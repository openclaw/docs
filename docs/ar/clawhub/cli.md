---
read_when:
    - استخدام ClawHub CLI
    - تصحيح أخطاء التثبيت أو التحديث أو النشر
summary: 'مرجع CLI: الأوامر، والأعلام، والإعدادات، وسلوك ملف القفل.'
x-i18n:
    generated_at: "2026-06-28T20:41:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a20b288bab0e81c9ba63e054adc35b66c9013da1e0b310401b3f931c2d0b2a1
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

حزمة CLI: `clawhub`، الملف التنفيذي: `clawhub`.

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
- `--dir <dir>`: دليل التثبيت تحت دليل العمل (الافتراضي: `skills`)
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
لـ HTTP العادي. يُحترم `NO_PROXY` / `no_proxy` لتجاوز الوكيل مع
مضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تكون فيها الاتصالات الصادرة المباشرة محظورة
(مثل حاويات Docker، أو Hetzner VPS بإنترنت عبر الوكيل فقط، أو جدران
حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم ضبط أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف الإعدادات

يخزّن رمز API المميز الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد لكن `clawdhub/config.json` موجود، تعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكتمل عبر رد نداء local loopback.
- دون واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/دون واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوّضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المميز المخزّن عبر `/api/v1/whoami`.

### `token`

- يطبع رمز API المميز المخزّن إلى stdout.
- مفيد لتمرير رمز تسجيل دخول محلي إلى أوامر إعداد أسرار CI عبر الأنابيب.

### `star <skill>` / `unstar <skill>`

- يضيف Skills إلى أبرز العناصر لديك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يتضمن الإخراج slug الخاصة بالـ skill، ومعرّف المالك، واسم العرض، ودرجة الصلة.
- يفضّل البحث تطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. يطابق رمز slug مستقل مثل `map` ‏`personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- الشعبية عامل ترتيب سابق صغير، وليست ضمانًا للظهور في الصدارة.
- إذا كان ينبغي أن تظهر skill لكنها لا تظهر، شغّل `clawhub inspect @owner/slug` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- العلامات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|rating|downloads|trending` (الافتراضي: newest). ما تزال أسماء ترتيب التثبيت القديمة تعمل للتوافق.
  - `--json` (إخراج قابل للقراءة آليًا)
- الإخراج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect @owner/slug`

- يجلب بيانات skill الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا ذا وسم (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `install @owner/slug`

- يحل أحدث إصدار للمالك وskill المحددين.
- ينزّل zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة؛ شغّل `clawhub unpin <skill>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <skill>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- يرسل قياسات استخدام بأفضل جهد أثناء تسجيل الدخول بحيث يمكن
  إلغاء تنشيط أعداد التثبيت الحالية.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <skill>`

- يعلّم skill مثبّتة على أنها مثبتة في ملف القفل.
- يسجل `--reason <text>` سبب تجميد skill.
- تتجاوز `update --all` ‏Skills المثبتة، وترفضها `update <skill>` المباشرة.
- ترفض Skills المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية بالخطأ.

### `unpin <skill>`

- يزيل تثبيت ملف القفل من skill مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [@owner/slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا تطابقت البصمة مع إصدار معروف: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يكتب فوقها مع `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث Skills المثبتة أبدًا عبر `--force`.
- يفشل `update <skill>` سريعًا مع Skills المثبتة ويخبرك بتشغيل `clawhub unpin <skill>` أولًا.
- يتجاوز `update --all` قيم slug المثبتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- يقارن بصمة الحزمة المحلية مع ClawHub ويخرج بنجاح عندما
  يكون المحتوى منشورًا بالفعل.
- الإعداد الافتراضي لـ Skills الجديدة هو `1.0.0`؛ والإعداد الافتراضي لـ Skills المتغيرة هو إصدار
  التصحيح التالي.
- يحدد `--version <version>` إصدارًا صراحةً وينشر حتى عندما
  يطابق المحتوى إصدارًا موجودًا.
- يحل `--dry-run` عملية النشر دون رفع؛ ويطبع `--json` نتيجة
  قابلة للقراءة آليًا.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما يمتلك
  الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` ‏skill موجودة إلى `--owner` أثناء نشر إصدار
  جديد. يتطلب صلاحية مسؤول/مالك على كلا الناشرين.
- يُشرح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر skill يعني أنها تُصدر بموجب `MIT-0` على ClawHub.
- Skills المنشورة مجانية الاستخدام والتعديل وإعادة التوزيع دون نسبة.
- لا يدعم ClawHub ‏Skills مدفوعة أو تسعيرًا لكل skill.
- الاسم البديل القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

يستدعي سير العمل القابل لإعادة الاستخدام من ClawHub
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
الأمر `skill publish` لـ `skill_path` واحدة، أو لكل مجلد skill مباشر
تحت `root` (الافتراضي: `skills`). يتجاوز Skills غير المتغيرة ويستخدم
سلوك إصدار التصحيح التلقائي نفسه.

اضبط `dry_run: true` للمعاينة دون رمز مميز. تتطلب عمليات النشر الفعلية
سر `clawhub_token`.

### `sync`

- يفحص دليل العمل الحالي، ودليل Skills المهيأ، وأي
  مجلدات `--root <dir>` بحثًا عن مجلدات Skills محلية تحتوي على `SKILL.md` أو
  `skill.md`.
- يقارن بصمة كل skill محلية مع ClawHub وينشر فقط Skills الجديدة أو
  المتغيرة.
- تنشر Skills الجديدة كـ `1.0.0`؛ وتنشر Skills المتغيرة إصدار التصحيح التالي
  افتراضيًا. استخدم `--bump minor|major` لدُفعات التحديث التي ينبغي أن تنتقل بخطوة semver
  أكبر.
- يعرض `--dry-run` خطة النشر دون رفع؛ ويطبع `--json` خطة
  قابلة للقراءة آليًا.
- ينشر `--all` كل skill جديدة أو متغيرة دون مطالبة. بدون
  `--all`، تتيح لك الطرفيات التفاعلية تحديد Skills المراد نشرها.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما يمتلك
  الفاعل صلاحية الناشر.
- `sync` نشر أحادي الاتجاه فقط. لا يثبّت أو يحدّث أو ينزّل أو
  يبلّغ عن قياسات استخدام التثبيت/التنزيل.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- يتطلب `clawhub login`.
- يشغّل ClawHub ClawScan عبر `POST /api/v1/skills/-/scan`، ثم يستطلع حتى يصبح الفحص نهائيًا.
- الفحوصات غير متزامنة وقد تستغرق وقتًا حتى تكتمل. أثناء وجودها في قائمة الانتظار، يعرض مؤشر الطرفية الدوّار موضع الفحص ذي الأولوية الحالي وعدد الفحوصات التي تسبقه.
- تتطلب الفحوصات المنشورة ملكية أو صلاحية إدارة الناشر. يمكن للمشرفين/المسؤولين استخدام الخلفية نفسها عبر `clawhub-admin`.
- `--update` صالح فقط مع `--slug`؛ يكتب نتائج الفحص المنشورة الناجحة مرة أخرى إلى الإصدار المحدد.
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
- ينزّل ملف ZIP لتقرير الفحص المخزّن لإصدار skill أو Plugin مقدّم، بما في ذلك الإصدارات التي حجبتها أو أخفتها فحوصات أمان ClawHub.
- تستخدم تنزيلات skill ‏slug الخاصة بالـ skill وتكون افتراضيًا `--kind skill`.
- تستخدم تنزيلات Plugin اسم الحزمة وتتطلب `--kind plugin`.
- `--version` مطلوب حتى يفحص المؤلفون الإصدار المقدّم تحديدًا الذي حجبه ClawHub.
- يختار `--output <file.zip>` مسار الوجهة.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

يشحن ClawHub سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/skill-publish.yml)
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

- القيمة الافتراضية لـ `root` هي `skills` لمستودعات الفهارس.
- مرّر `skill_path: skills/review-helper` لمعالجة مجلد skill واحد.
- يطابق `owner` علامة CLI ‏`--owner`؛ اتركه لتُنشر باسم المستخدم المصادَق.
- يستخدم نشر Skills في V1 ‏`clawhub_token`؛ أما النشر الموثوق عبر GitHub OIDC فهو للحزم فقط حاليًا.

### `delete <skill>`

- بدون `--version`، احذف مهارة حذفًا مبدئيًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المبدئي التي يبدأها المالك تحجز المعرّف اللطيف لمدة 30 يومًا؛ ويطبع الأمر وقت انتهاء الصلاحية.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار خاص بالإصدار
  ومغلق عند الفشل.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. لا يتجاوز موظفو المنصة الملكية في هذا المسار الخاص بالإصدار فقط.
- يسجل `--reason <text>` ملاحظة إشراف على حذف مبدئي لمهارة كاملة وفي سجل التدقيق.
- `--note <text>` هو اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <skill>`

- استعد مهارة مخفية (المالك أو المشرف أو المسؤول).
- لا توجد استعادة حذف لإصدار؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وفي سجل التدقيق.
- `--note <text>` هو اسم بديل لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <skill>`

- أخفِ مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <skill>`

- ألغِ إخفاء مهارة (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <skill> <new-name>`

- أعد تسمية مهارة مملوكة واحتفظ بالمعرّف اللطيف السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source> <target>`

- ادمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف إدراج المعرّف اللطيف للمصدر علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون لدى المنفذ
  صلاحية مسؤول لكل من المالك الحالي والناشر الوجهة.
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
- استخدم هذا للمكوّنات الإضافية وإدخالات عائلات الحزم الأخرى؛ يبقى `search` على المستوى الأعلى سطح البحث عن المهارات.
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
- استخدم هذا لبيانات تعريف المكوّن الإضافي، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اعرض سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد عرضها (1-100).
- `--files`: اعرض ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من SHA-256 الخاص بـ ClawHub لكل الآثار.
- بالنسبة إلى آثار ClawPack من نوع npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` الخاص بملف tarball.
- تُنزل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- العلامات:
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

- يحسب SHA-256 الخاص بـ ClawHub، وسلامة npm `sha512`، وnpm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع علامات البصمة المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: SHA-256 المتوقع من ClawHub.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: npm shasum المتوقع.
  - `--json`: إخراج قابل للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- يشغّل Plugin Inspector المضمن في ClawHub CLI على مجلد حزمة مكوّن إضافي محلي.
- الوضع الافتراضي هو التحقق غير المتصل/الثابت، دون تحديد موقع نسخة محلية من
  OpenClaw أو استيرادها.
- تؤدي أخطاء التوافق الصارمة إلى الخروج برمز غير صفري. تُطبع النتائج التي تقتصر على التحذيرات فقط لكن
  الخروج يكون صفريًا.
- العلامات:
  - `--out <dir>`: اكتب تقارير Plugin Inspector إلى هذا الدليل.
  - `--openclaw <path>`: افحص مقابل نسخة OpenClaw محلية صريحة.
  - `--runtime`: فعّل التقاط وقت التشغيل؛ يستورد كود المكوّن الإضافي.
  - `--allow-execute`: اسمح بالتقاط وقت التشغيل في مساحة عمل معزولة.
  - `--no-mock-sdk`: عطّل OpenClaw SDK المحاكى أثناء التقاط وقت التشغيل.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package validate ./example-plugin
```

إذا أبلغ التحقق عن نتيجة تخص الحزمة أو البيان أو استيراد SDK أو الأثر، فراجع
[إصلاحات تحقق Plugin](/ar/clawhub/plugin-validation-fixes)، ثم أعد تشغيل الأمر.

### `package delete <name>`

- بدون `--version`، يحذف حزمة وكل الإصدارات حذفًا مبدئيًا.
- يحذف `--version <version>` نهائيًا إصدارًا واحدًا مملوكًا غير أحدث إصدار عبر مسار خاص بالإصدار
  ومغلق عند الفشل.
  لا يمكن استعادة الإصدارات المحذوفة أو إعادة نشرها. انشر بديلًا قبل حذف
  أحدث إصدار حالي. يتطلب هذا المسار الخاص بالإصدار فقط مالك الحزمة أو مسؤول ناشر مؤسسة؛
  لا يتجاوز موظفو المنصة ملكية الحزمة.
- يتطلب الحذف المبدئي للحزمة كاملة مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو
  مشرف منصة، أو مسؤول منصة.
- العلامات:
  - `--version <version>`: احذف نهائيًا إصدارًا واحدًا غير أحدث إصدار.
  - `--yes`: تجاوز التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مبدئيًا.
- لا توجد استعادة حذف لإصدار؛ لا يمكن استعادة الإصدارات المحذوفة نهائيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف منصة،
  أو مسؤول منصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- العلامات:
  - `--yes`: تجاوز التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب صلاحية مسؤول لكل من مالك الحزمة الحالي والناشر الوجهة،
  ما لم ينفذه مسؤول منصة.
- يجب نقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
- يستدعي `POST /api/v1/packages/{name}/transfer`.
- العلامات:
  - `--to <owner>`: معرّف الناشر الوجهة.
  - `--reason <text>`: سبب تدقيق اختياري.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- أمر موثّق للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تُخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بذاتها.
- العلامات:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من ظهور إشراف الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي على أحدث إصدار،
  وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وبصمة الأثر،
  ومصدر المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغل لحزمة قد تستبدل
  مكوّن OpenClaw إضافيًا مضمنًا.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- ينشئ ناشر مؤسسة يملكه المستخدم الموثّق.
- يُطبّع المعرّف إلى أحرف صغيرة ويمكن تمريره مع `@` أو بدونها.
- لا يكون ناشرو المؤسسات المنشأون حديثًا موثوقين/رسميين افتراضيًا.
- يفشل إذا كان المعرّف مستخدمًا بالفعل من ناشر موجود أو مستخدم أو مسار محجوز.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- ينشر Plugin برمجية أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف tarball محلي من ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - رابط GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack
  الدقيقة ويستخدم محتويات `package/` المستخرجة فقط للتحقق والتعبئة المسبقة
  للبيانات الوصفية.
- تُحزم مجلدات Plugin البرمجية في أرشيف tarball من ClawPack npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. أما مجلدات Plugin الحزم فلا تزال
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيا من المستودع والالتزام المحلول والمرجع والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب أن تصرح Plugins البرمجية الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحة.
  لا يُستخدم `package.json.version` على المستوى الأعلى كاحتياطي للتحقق من النشر.
- يعاين `--dry-run` حمولة النشر المحلولة دون رفعها.
- يصدر `--json` مخرجات قابلة للقراءة آليا من أجل CI.
- ينشر `--owner <handle>` تحت معرف ناشر لمستخدم أو مؤسسة عندما تكون لدى الفاعل صلاحية الناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- لا تزال الأعلام الحالية (`--family`، `--name`، `--version`، `--source-repo`، `--source-commit`، `--source-ref`، `--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة
ونسبة المصدر قبل إنشاء إصدار حي:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins البرمجية، يبني نشر المجلد أثرا من ClawPack ويرفعه من
مجلد الحزمة:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### `package.json` الأدنى لـ `--family code-plugin`

تحتاج Plugins البرمجية الخارجية إلى مقدار صغير من بيانات OpenClaw الوصفية في
`package.json`. هذا البيان الأدنى كاف لنشر ناجح:

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
  كاحتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها ليست مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلا عن التوافق.
- إذا كنت تستخدم إصدارا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.
- إذا أبلغ التحقق عن رمز معالجة، فراجع
  [إصلاحات تحقق Plugin](/ar/clawhub/plugin-validation-fixes).

#### GitHub Actions

يشحن ClawHub أيضا سير عمل رسميا قابلا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f96ae4a54ec9b72177220d4db601ebc0ddf5a1fd/.github/workflows/package-publish.yml)
لمستودعات Plugin.

إعداد مستدع نموذجي:

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
- بالنسبة إلى المستودعات الأحادية، مرر `source_path` حتى ينشر سير العمل
  مجلد حزمة Plugin، مثل `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب حصر عمليات النشر الحقيقية في أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق بدون سر إلا على `workflow_dispatch`؛ ولا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبق `clawhub_token` متاحا للنشر الأول، أو الحزم غير الموثوقة، أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `package trusted-publisher get <name>`

- يعرض إعداد الناشر الموثوق في GitHub Actions لحزمة.
- استخدم هذا بعد ضبط الإعداد لتأكيد المستودع واسم ملف سير العمل
  وتثبيت البيئة الاختياري.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليا.

مثال:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- يرفق أو يستبدل إعداد الناشر الموثوق في GitHub Actions لحزمة موجودة.
- يجب إنشاء الحزمة أولا من خلال `clawhub package publish` العادي اليدوي أو
  المصادق عليه برمز.
- بعد ضبط الإعداد، يمكن لعمليات نشر GitHub Actions المدعومة المستقبلية استخدام
  OIDC/النشر الموثوق بدون رمز ClawHub طويل الأمد.
- يجب أن يكون `--repository <repo>` بصيغة `owner/repo`.
- يجب أن يطابق `--workflow-filename <file>` اسم ملف سير العمل في
  `.github/workflows/`.
- `--environment <name>` اختياري. عند تكوينه، يجب أن تطابق بيئة GitHub Actions
  في مطالبة OIDC تماما.
- يتحقق ClawHub من مستودع GitHub المكوّن عند تشغيل هذا الأمر.
  يمكن التحقق من المستودعات العامة عبر بيانات GitHub الوصفية العامة. تتطلب
  المستودعات الخاصة أن يكون لدى ClawHub وصول GitHub إلى ذلك المستودع، على
  سبيل المثال عبر تثبيت مستقبلي لتطبيق ClawHub GitHub App أو تكامل GitHub آخر
  مخول.
- الأعلام:
  - `--repository <repo>`: مستودع GitHub، مثل `openclaw/example-plugin`.
  - `--workflow-filename <file>`: اسم ملف سير العمل، مثل `package-publish.yml`.
  - `--environment <name>`: بيئة GitHub Actions اختيارية بتطابق دقيق.
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
  تعطيل أو إعادة إنشاء.
- يجب أن تستخدم عمليات النشر الحقيقية المستقبلية النشر المصادق عليه العادي حتى
  يُضبط الإعداد مرة أخرى.
- الأعلام:
  - `--json`: مخرجات قابلة للقراءة آليا.

مثال:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### قياسات التثبيت

- تُرسل بعد `clawhub install <slug>` عند تسجيل الدخول، ما لم يكن
  `CLAWHUB_DISABLE_TELEMETRY=1` مضبوطا.
- الإبلاغ مبذول بأفضل جهد. لا تفشل أوامر التثبيت إذا كانت القياسات
  غير متاحة.
- التفاصيل: `docs/telemetry.md`.

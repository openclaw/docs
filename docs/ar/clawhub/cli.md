---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر أو المزامنة
summary: 'مرجع CLI: الأوامر، الأعلام، التهيئة، ملف القفل، سلوك المزامنة.'
x-i18n:
    generated_at: "2026-05-13T04:17:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98c1886f2df29dd9489d18d4813f0f7df6c365b47888035fe12d2b05871cdf17
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

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يرجع إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت داخل دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي لواجهة API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

المكافئات في البيئة:

- `CLAWHUB_SITE` (القديم `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (القديم `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (القديم `CLAWDHUB_WORKDIR`)

### وكيل HTTP

يحترم CLI متغيرات بيئة وكيل HTTP القياسية للأنظمة الموجودة خلف
وكلاء الشركات أو الشبكات المقيدة:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

عند ضبط أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لطلبات HTTP العادية. ويُحترم `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS بإنترنت عبر الوكيل فقط، أو
جدران الحماية المؤسسية).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم ضبط أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف الإعدادات

يخزن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- مسار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويكمل عبر رد نداء الاسترجاع المحلي.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر أثناء تفويضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزن عبر `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- يضيف/يزيل مهارة من العناصر المميزة لديك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتخطى `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يفضّل البحث تطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. يطابق رمز slug مستقل مثل `map` العنصر `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- التنزيلات عامل شعبية أولي صغير، وليست ضمانًا للظهور في المرتبة الأولى.
- إذا كان ينبغي لمهارة أن تظهر لكنها لا تظهر، شغّل `clawhub inspect <slug>` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- العلامات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (الافتراضي: newest)
  - `--json` (مخرجات قابلة للقراءة آليًا)
- المخرجات: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect <slug>`

- يجلب بيانات المهارة الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المطلوب سردها (1-200).
- `--files`: اسرد ملفات الإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `install <slug>`

- يحل أحدث إصدار عبر `/api/v1/skills/<slug>`.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق المهارات المثبتة على إصدار محدد؛ شغّل `clawhub unpin <slug>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <slug>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (الملف القديم `.clawdhub`).
- يعرض `pinned` بجوار المهارات المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <slug>`

- يضع علامة التثبيت على مهارة مثبتة في ملف القفل.
- يسجّل `--reason <text>` سبب تجميد المهارة.
- تتجاوز `update --all` المهارات المثبتة، وترفضها `update <slug>` المباشرة.
- ترفض المهارات المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <slug>`

- يزيل تثبيت ملف القفل من مهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا تظهر أي مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث المهارات المثبتة أبدًا بواسطة `--force`.
- يفشل `update <slug>` سريعًا مع المعرّفات المثبتة ويطلب منك تشغيل `clawhub unpin <slug>` أولًا.
- تتجاوز `update --all` المعرّفات المثبتة وتطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- ينشر عبر `POST /api/v1/skills` (متعدد الأجزاء).
- يتطلب semver: `--version 1.2.3`.
- ينشر `--owner <handle>` ضمن معرّف ناشر لمؤسسة/مستخدم عندما يكون لدى
  الفاعل وصول ناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب وصول مسؤول/مالك لدى كلا الناشرين.
- يُشرح سلوك المالك والمراجعة في `docs/publishing.md`.
- يعني نشر مهارة أنها صادرة بموجب `MIT-0` على ClawHub.
- المهارات المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub المهارات المدفوعة أو التسعير لكل مهارة.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير معتاد، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات الاعتماد الخاصة بالمزوّد. تُخزَّن الملاحظة على
  الإصدار المنشور.
- الاسم المستعار القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- يحذف مهارة حذفًا ناعمًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- تحجز عمليات الحذف الناعم التي يبدأها المالك المعرّف لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يسجّل `--reason <text>` ملاحظة إشراف على المهارة وسجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `undelete <slug>`

- يستعيد مهارة مخفية (المالك أو المشرف أو المسؤول).
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجّل `--reason <text>` ملاحظة إشراف على المهارة وسجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتجاوز `--yes` التأكيد.

### `hide <slug>`

- يخفي مهارة (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `delete`.

### `unhide <slug>`

- يلغي إخفاء مهارة (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `undelete`.

### `skill rename <slug> <new-slug>`

- يعيد تسمية مهارة مملوكة ويبقي المعرّف السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتجاوز `--yes` التأكيد.

### `skill merge <source-slug> <target-slug>`

- يدمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف المعرّف المصدر عن الظهور علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتجاوز `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون لدى الفاعل
  وصول مسؤول إلى كل من المالك الحالي والناشر الوجهة.
- الأوامر الفرعية:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- نقاط النهاية:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- يستعرض أو يبحث في كتالوج الحزم الموحّد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` في المستوى الأعلى سطح البحث عن المهارات.
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
- استخدم هذا لبيانات تعريف Plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدارات/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا ذا وسم (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد الملفات للإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200 كيلوبايت).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلّل.
- يتحقق من ClawHub SHA-256 لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  ومجموع npm shasum، واسم/إصدار `package.json` الخاص بحزمة tarball.
- تُنزَّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- العلامات:
  - `--version <version>`: نزّل إصدارًا محددًا.
  - `--tag <tag>`: نزّل إصدارًا ذا وسم (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: استبدل ملف إخراج موجودًا.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- يحسب ClawHub SHA-256، وسلامة npm `sha512`، ومجموع npm shasum لأثر محلي.
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع علامات الملخص المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
  - `--package <name>`: اسم الحزمة لحل بيانات تعريف الأثر المتوقعة.
  - `--version <version>` أو `--tag <tag>`: إصدار الحزمة المتوقع.
  - `--sha256 <hex>`: قيمة ClawHub SHA-256 المتوقعة.
  - `--npm-integrity <sri>`: سلامة npm المتوقعة.
  - `--npm-shasum <sha1>`: مجموع npm shasum المتوقع.
  - `--json`: مخرجات قابلة للقراءة آليًا.

أمثلة:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- يحذف الحزمة وجميع الإصدارات حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- العلامات:
  - `--yes`: تخطّي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- العلامات:
  - `--yes`: تخطّي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر الوجهة،
  ما لم ينفّذه مسؤول منصة.
- يجب أن تُنقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
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
- التقارير على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تُخفي التقارير الحزم تلقائيًا ولا تمنع التنزيلات بذاتها.
- العلامات:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالتقرير.
  - `--reason <text>`: سبب التقرير المطلوب.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من رؤية الإشراف على الحزمة.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد التقارير المفتوحة، وحالة الإشراف
  اليدوي على أحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw المستقبلي.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق أمام الحالة الرسمية، وتوفّر ClawPack، وبصمة الأداة،
  ومصدر الأصل، وتوافق OpenClaw، وأهداف المضيف، وبيانات البيئة الوصفية،
  وحالة الفحص.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجّهة للمشغل لحزمة قد تستبدل
  Plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركّز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات، و
  العوائق.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف ClawPack npm-pack محلي: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL على GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json`، و`openclaw.plugin.json`، و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json`،
  و`.claude-plugin/plugin.json`، و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` كـ ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق وملء البيانات الوصفية مسبقًا.
- تُحزم مجلدات Plugin البرمجي في أرشيف ClawPack npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأداة الدقيقة. ما زالت مجلدات Plugin الحزمة
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير remote الأصل إلى GitHub.
- يجب على Plugins البرمجية الخارجية التصريح بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كاحتياط للتحقق من النشر.
- يعرض `--dry-run` معاينة حمولة النشر المحلولة دون رفع.
- يُصدر `--json` إخراجًا قابلًا للقراءة آليًا لـ CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يملك الفاعل وصول الناشر.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا للسلوك الذي قد يبدو غير معتاد بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات اعتماد خاصة بالمزوّد. تُخزّن الملاحظة على
  الإصدار المنشور.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- ما زالت العلامات الموجودة (`--family`، و`--name`، و`--version`، و`--source-repo`، و`--source-commit`، و`--source-ref`، و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات وصف الحزمة المحلولة و
نسبة المصدر قبل إنشاء إصدار مباشر:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins البرمجية، يبني نشر المجلد ويرفع أداة ClawPack من
مجلد الحزمة:

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

- `package.json.version` هو إصدار حزمة النشر الخاصة بك، لكنه لا يُستخدم
  كاحتياط للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها ليست مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا كنت تريد نشر
  بيانات توافق وصفية أكثر تفصيلًا.
- إذا كنت تستخدم إصدارًا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.

#### GitHub Actions

يوفّر ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/f0a6789c31d5a1666d25173927356dd5be7738bc/.github/workflows/package-publish.yml)
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
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل مجلد حزمة
  Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تُشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب أن تقتصر عمليات النشر الحقيقية على أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ وما زالت دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا لأول نشر، أو للحزم غير الموثوقة، أو لعمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأداة ويعرضها كمخرجات لسير العمل.

### `sync`

- يفحص مجلدات Skills المحلية وينشر الجديدة/المتغيرة منها.
- يمكن أن تكون الجذور أي مجلد: دليل Skills أو مجلد Skill واحد يحتوي على `SKILL.md`.
- يضيف تلقائيًا جذور Skills الخاصة بـ Clawdbot عندما يكون `~/.clawdbot/clawdbot.json` موجودًا:
  - `agent.workspace/skills` (الوكيل الرئيسي)
  - `routing.agents.*.workspace/skills` (لكل وكيل)
  - `~/.clawdbot/skills` (مشترك)
  - `skills.load.extraDirs` (حزم مشتركة)
- يحترم `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و`OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- العلامات:
  - `--root <dir...>` جذور فحص إضافية
  - `--all` الرفع دون مطالبة
  - `--dry-run` عرض الخطة فقط
  - `--bump patch|minor|major` (الافتراضي: patch)
  - `--changelog <text>` (غير تفاعلي)
  - `--tags a,b,c` (الافتراضي: latest)
  - `--concurrency <n>` (الافتراضي: 4)

القياسات:

- تُرسل أثناء `sync` عند تسجيل الدخول، ما لم يكن `CLAWHUB_DISABLE_TELEMETRY=1` (القديم `CLAWDHUB_DISABLE_TELEMETRY=1`).
- التفاصيل: `docs/telemetry.md`.

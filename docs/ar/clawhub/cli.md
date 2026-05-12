---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - استكشاف أخطاء التثبيت أو التحديث أو النشر أو المزامنة وإصلاحها
summary: 'مرجع CLI: الأوامر، والأعلام، والتكوين، وملف القفل، وسلوك المزامنة.'
x-i18n:
    generated_at: "2026-05-12T23:28:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3600e5539372490924ee884c03d2417b80d25aab519d8260897b2268c2f7b46
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

## الخيارات العامة

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت ضمن دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي لواجهة API (الافتراضي: يُكتشف تلقائيًا، وإلا `https://clawhub.ai`)
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

عند تعيين أي من هذه المتغيرات، توجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لطلبات HTTP العادية. يتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو خوادم Hetzner VPS ذات الإنترنت عبر الوكيل فقط، أو جدران الحماية
المؤسسية).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التكوين

يخزّن رمز API الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، تعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويُكمل عبر رد نداء local loopback.
- بلا واجهة رسومية: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة رسومية: يطبع `clawhub login --device` رمزًا وينتظر بينما تفوضه في `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- يضيف/يزيل مهارة من أبرز العناصر لديك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتخطى `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يفضّل البحث التطابقات الدقيقة لرموز slug/الاسم قبل شعبية التنزيلات. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- التنزيلات عامل شعبية مسبق صغير، وليست ضمانًا للظهور في أعلى النتائج.
- إذا كان ينبغي لمهارة أن تظهر لكنها لا تظهر، فشغّل `clawhub inspect <slug>` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الخيارات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (الافتراضي: newest)
  - `--json` (مخرجات قابلة للقراءة آليًا)
- المخرجات: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect <slug>`

- يجلب البيانات الوصفية للمهارة وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: latest).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد الملفات للإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `install <slug>`

- يحل أحدث إصدار عبر `/api/v1/skills/<slug>`.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرج إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق المهارات المثبتة؛ شغّل `clawhub unpin <slug>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <slug>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (القديمة `.clawdhub`).
- يعرض `pinned` بجوار المهارات المجمدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <slug>`

- يعلّم مهارة مثبتة كـ pinned في ملف القفل.
- يسجل `--reason <text>` سبب تجميد المهارة.
- تتخطى `update --all` المهارات المثبتة، وترفضها `update <slug>` المباشرة.
- ترفض المهارات المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <slug>`

- يزيل تثبيت ملف القفل من مهارة مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا تظهر مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا تُحدّث المهارات المثبتة مطلقًا بواسطة `--force`.
- تفشل `update <slug>` سريعًا للمعرّفات المثبتة وتخبرك بتشغيل `clawhub unpin <slug>` أولًا.
- تتخطى `update --all` المعرّفات المثبتة وتطبع ملخصًا لما بقي مجمدًا.

### `skill publish <path>`

- ينشر عبر `POST /api/v1/skills` (multipart).
- يتطلب semver: `--version 1.2.3`.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما يكون لدى
  الفاعل حق وصول الناشر.
- ينقل `--migrate-owner` مهارة موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب وصول مسؤول/مالك لدى كلا الناشرين.
- يُشرح سلوك المالك والمراجعة في `docs/publishing.md`.
- يعني نشر مهارة أنها صُدرت تحت `MIT-0` على ClawHub.
- المهارات المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون نسبة.
- لا يدعم ClawHub المهارات المدفوعة أو التسعير لكل مهارة.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا للسلوك الذي قد يبدو غير معتاد بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات اعتماد خاصة بمزوّد. تُخزن الملاحظة على
  الإصدار المنشور.
- الاسم المستعار القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- يحذف مهارة حذفًا مرنًا (مالك أو مشرف أو مسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- تحجز عمليات الحذف المرن التي يبدأها المالك المعرّف لمدة 30 يومًا؛ يطبع الأمر وقت الانتهاء.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وسجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `undelete <slug>`

- يستعيد مهارة مخفية (مالك أو مشرف أو مسؤول).
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على المهارة وسجل التدقيق.
- `--note <text>` اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `hide <slug>`

- يخفي مهارة (مالك أو مشرف أو مسؤول).
- اسم مستعار لـ `delete`.

### `unhide <slug>`

- يلغي إخفاء مهارة (مالك أو مشرف أو مسؤول).
- اسم مستعار لـ `undelete`.

### `skill rename <slug> <new-slug>`

- يعيد تسمية مهارة مملوكة ويُبقي المعرّف السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتخطى `--yes` التأكيد.

### `skill merge <source-slug> <target-slug>`

- يدمج مهارة مملوكة في مهارة مملوكة أخرى.
- يتوقف المعرّف المصدر عن الظهور علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتخطى `--yes` التأكيد.

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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلة الحزم الأخرى؛ يبقى `search` عالي المستوى واجهة بحث المهارات.
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
- استخدم هذا لبيانات تعريف الـ plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: اسرد الملفات للإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلّل.
- يتحقق من ClawHub SHA-256 لكل الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` في ملف tarball.
- تُنزّل إصدارات ZIP القديمة عبر مسار ZIP القديم.
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
- مع أعلام الملخص المباشرة، يتحقق دون بحث عبر الشبكة.
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

### `package delete <name>`

- يحذف الحزمة وجميع الإصدارات حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف منصة،
  أو مسؤول منصة.
- العلامات:
  - `--yes`: تخطّي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف منصة،
  أو مسؤول منصة.
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
- يتطلب وصول مسؤول إلى كلٍّ من مالك الحزمة الحالي والناشر
  الوجهة، ما لم ينفذه مسؤول منصة.
- يجب أن تنتقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
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

- أمر مصادَق عليه للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا ولا تحظر التنزيلات بذاتها.
- العلامات:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- أمر للمالك للتحقق من ظهور الحزمة في الإشراف.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق الخاصة بالحالة الرسمية، وتوفر ClawPack، وملخص الأثر،
  ومصدرية المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات البيئة الوصفية،
  وحالة الفحص.
- العلامات:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة ترحيل موجهة للمشغلين لحزمة قد تستبدل
  Plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
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
  - أرشيف tarball محلي من ClawPack npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL من GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json`، و`openclaw.plugin.json`، و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json`،
  و`.claude-plugin/plugin.json`، و`.cursor-plugin/plugin.json`.
- تُعامَل مصادر `.tgz` بصفتها ClawPack. يرفع CLI بايتات npm-pack
  نفسها ويستخدم محتويات `package/` المستخرجة فقط للتحقق
  وملء البيانات الوصفية مسبقًا.
- تُحزَم مجلدات Plugin البرمجية في tarball من ClawPack npm قبل الرفع كي
  تستطيع تثبيتات OpenClaw التحقق من الأثر الدقيق. ما زالت مجلدات Plugin الحزمة
  تستخدم مسار النشر بالملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، يُملأ إسناد المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، يُكتشف إسناد المصدر تلقائيًا من git المحلي عندما يشير جهاز التحكم البعيد الأصل إلى GitHub.
- يجب أن تصرّح Plugins البرمجية الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كبديل للتحقق من النشر.
- يعرض `--dry-run` معاينة لحمولة النشر المحلولة دون رفع.
- يصدر `--json` إخراجًا قابلًا للقراءة آليًا من أجل CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يكون لدى الفاعل وصول إلى الناشر.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير معتاد، مثل الوصول إلى الشبكة،
  أو الوصول الأصلي إلى المضيف، أو بيانات اعتماد خاصة بموفّر. تُخزَّن الملاحظة على
  الإصدار المنشور.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- ما زالت العلامات الموجودة (`--family`، و`--name`، و`--version`، و`--source-repo`، و`--source-commit`، و`--source-ref`، و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة
وإسناد المصدر قبل إنشاء إصدار حي:

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

- `package.json.version` هو إصدار حزمة النشر لديك، لكنه لا يُستخدم
  كبديل للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI الخاص بـ `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الرحلة المحلية قبل الرفع.

#### GitHub Actions

يشحن ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/af96221ebb197e2af09f44870046ced4ded4aea0/.github/workflows/package-publish.yml)
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

- يضبط سير العمل القابل لإعادة الاستخدام `source` افتراضيًا على مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل مجلد حزمة
  Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوِّث.
- يجب قصر عمليات النشر الحقيقية على أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ ما زالت دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول، أو الحزم غير الموثوقة، أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `sync`

- يفحص مجلدات Skills المحلية وينشر الجديدة/المتغيرة منها.
- يمكن أن تكون الجذور أي مجلد: دليل Skills أو مجلد Skill واحد يحتوي على `SKILL.md`.
- يضيف تلقائيًا جذور Skills الخاصة بـ Clawdbot عندما يكون `~/.clawdbot/clawdbot.json` موجودًا:
  - `agent.workspace/skills` (العميل الرئيسي)
  - `routing.agents.*.workspace/skills` (لكل عميل)
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

القياسات عن بُعد:

- تُرسل أثناء `sync` عند تسجيل الدخول، ما لم يكن `CLAWHUB_DISABLE_TELEMETRY=1` (القديم `CLAWDHUB_DISABLE_TELEMETRY=1`).
- التفاصيل: `docs/telemetry.md`.

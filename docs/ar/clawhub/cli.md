---
read_when:
    - استخدام ClawHub CLI
    - تصحيح أخطاء التثبيت أو التحديث أو النشر أو المزامنة
summary: 'مرجع CLI: الأوامر، والأعلام، والتكوين، وملف القفل، وسلوك المزامنة.'
x-i18n:
    generated_at: "2026-05-12T00:56:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 852c15f48e414364303f77873b0c531d2b80478a99cb816719c00972c4ae2203
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
- `--dir <dir>`: دليل التثبيت ضمن دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي لواجهة API (الافتراضي: مُكتشف، وإلا `https://clawhub.ai`)
- `--no-input`: تعطيل المطالبات

المكافئات البيئية:

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
لطلبات HTTP العادية. ويتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS مع اتصال إنترنت عبر الوكيل فقط، أو
جدران حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزّن رمز API الخاص بك + عنوان URL المخزن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- خيار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح على `<site>/cli/auth` ويكمل عبر استدعاء local loopback.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر أثناء تخويله على `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المخزّن عبر `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- يضيف/يزيل مهارة من إبرازاتك.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يفضّل البحث مطابقات رموز slug/الاسم الدقيقة قبل شعبية التنزيل. رمز slug مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- التنزيلات عامل شعبية مسبق صغير، وليست ضمانًا للظهور في الموضع الأعلى.
- إذا كان ينبغي لمهارة أن تظهر لكنها لا تظهر، شغّل `clawhub inspect <slug>` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- العلامات:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (الافتراضي: newest)
  - `--json` (إخراج قابل للقراءة آليًا)
- الإخراج: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect <slug>`

- يجلب بيانات المهارة الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد تاريخ الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد ملفات الإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: إخراج قابل للقراءة آليًا.

### `install <slug>`

- يحل أحدث إصدار عبر `/api/v1/skills/<slug>`.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق المهارات المثبّتة بدبوس؛ شغّل `clawhub unpin <slug>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <slug>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (الاسم القديم `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <slug>`

- يضع علامة التثبيت على Skill مثبتة في ملف القفل.
- يسجل `--reason <text>` سبب تجميد Skill.
- يتم تخطي Skills المثبتة بواسطة `update --all` ورفضها بواسطة `update <slug>` المباشر.
- ترفض Skills المثبتة أيضًا `install --force` حتى لا يمكن استبدال البايتات المحلية عن طريق الخطأ.

### `unpin <slug>`

- يزيل تثبيت ملف القفل من Skill مثبتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا يتم تحديث Skills المثبتة أبدًا بواسطة `--force`.
- يفشل `update <slug>` بسرعة بالنسبة إلى slugs المثبتة ويطلب منك تشغيل `clawhub unpin <slug>` أولًا.
- يتخطى `update --all` slugs المثبتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- ينشر عبر `POST /api/v1/skills` (متعدد الأجزاء).
- يتطلب semver: `--version 1.2.3`.
- ينشر `--owner <handle>` تحت معرّف ناشر مؤسسة/مستخدم عندما تكون لدى
  الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` Skill موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب صلاحية مسؤول/مالك لدى كلا الناشرين.
- يتم شرح سلوك المالك والمراجعة في `docs/publishing.md`.
- نشر Skill يعني إصدارها بموجب `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون نسب.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل Skill.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير معتاد بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات اعتماد خاصة بمزوّد. تُخزّن الملاحظة على
  الإصدار المنشور.
- الاسم البديل القديم: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- يحذف Skill حذفًا مرنًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- عمليات الحذف المرن التي يبدأها المالك تحجز slug لمدة 30 يومًا؛ يطبع الأمر وقت انتهاء الصلاحية.
- يسجل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `undelete <slug>`

- يستعيد Skill مخفية (المالك أو المشرف أو المسؤول).
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` اسم بديل لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `hide <slug>`

- يخفي Skill (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `delete`.

### `unhide <slug>`

- يلغي إخفاء Skill (المالك أو المشرف أو المسؤول).
- اسم بديل لـ `undelete`.

### `skill rename <slug> <new-slug>`

- يعيد تسمية Skill مملوكة ويحتفظ بـ slug السابق كاسم بديل لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتخطى `--yes` التأكيد.

### `skill merge <source-slug> <target-slug>`

- يدمج Skill مملوكة في Skill مملوكة أخرى.
- يتوقف slug المصدر عن الظهور علنًا ويصبح اسمًا بديلًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتخطى `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تؤدي عمليات النقل إلى معرّفات المستخدمين إلى إنشاء طلب معلق يقبله المستلم.
- تطبق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما تكون لدى الفاعل
  صلاحية مسؤول لدى كل من المالك الحالي والناشر الوجهة.
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و `GET /api/v1/packages/search`.
- استخدم هذا مع plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` في المستوى الأعلى سطح البحث في Skills.
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
- استخدم هذا لبيانات تعريف Plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملفات.
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
- يتحقق من ClawHub SHA-256 لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` داخل كرة tar.
- يتم تنزيل إصدارات ZIP القديمة عبر مسار ZIP القديم.
- العلامات:
  - `--version <version>`: نزّل إصدارًا محددًا.
  - `--tag <tag>`: نزّل إصدارًا موسومًا (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: استبدل ملف إخراج موجود.
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
- مع علامات الملخص المباشرة، يتحقق دون بحث عبر الشبكة.
- العلامات:
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

- يحذف حزمة وكل الإصدارات حذفًا مؤقتًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو وسيط المنصة،
  أو مسؤول المنصة.
- الأعلام:
  - `--yes`: تخطي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مؤقتًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو وسيط المنصة،
  أو مسؤول المنصة.
- يستدعي `POST /api/v1/packages/{name}/undelete`.
- الأعلام:
  - `--yes`: تخطي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر الوجهة،
  إلا إذا نفذه مسؤول المنصة.
- يجب أن تُنقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
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

- أمر موثّق للإبلاغ عن حزمة إلى الوسطاء.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للوسطاء للمراجعة.
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

- أمر للمالك للتحقق من رؤية الحزمة في الإشراف.
- يستدعي `GET /api/v1/packages/{name}/moderation`.
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي لأحدث إصدار،
  وحالة حظر التنزيل، وأسباب الإشراف.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

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
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغّل لحزمة قد تستبدل Plugin مضمّنًا في
  OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  الحالة المركزة على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات، و
  العوائق.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - أرشيف npm-pack محلي من ClawPack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL في GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json`، و`openclaw.plugin.json`، و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json`،
  و`.claude-plugin/plugin.json`، و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` على أنها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق وتعبئة البيانات الوصفية مسبقًا.
- تُحزَّم مجلدات Plugins البرمجية في أرشيف npm من ClawPack قبل الرفع لكي
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. لا تزال مجلدات Plugins الحزمة
  تستخدم مسار النشر للملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ نسبة المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف نسبة المصدر تلقائيًا من git المحلي عندما يشير origin remote إلى GitHub.
- يجب على Plugins البرمجية الخارجية التصريح بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كقيمة احتياطية للتحقق من النشر.
- يعاين `--dry-run` حمولة النشر المحلولة دون رفعها.
- يصدر `--json` إخراجًا قابلًا للقراءة آليًا لـ CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يملك الفاعل وصول الناشر.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير معتاد بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات اعتماد خاصة بالمزوّد. تُخزَّن الملاحظة على
  الإصدار المنشور.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- لا تزال الأعلام الموجودة (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة و
نسبة المصدر قبل إنشاء إصدار حي:

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

#### ملف `package.json` الأدنى لـ `--family code-plugin`

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
  كقيمة احتياطية للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضها ClawHub عند وجودها، لكنها غير مطلوبة للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدار CLI أقدم من `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.

#### GitHub Actions

يشحن ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/426a2a78792b7ebcf5aa2a08c595cc618a197c66/.github/workflows/package-publish.yml)
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

- يعيّن سير العمل القابل لإعادة الاستخدام `source` افتراضيًا إلى مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل مجلد
  حزمة Plugin، مثلًا `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوِّث.
- يجب أن تقتصر عمليات النشر الحقيقية على أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- النشر الموثوق دون سر لا يعمل إلا على `workflow_dispatch`؛ لا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول، أو الحزم غير الموثوقة، أو عمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأثر ويكشفها كمخرجات لسير العمل.

### `sync`

- يفحص مجلدات Skills المحلية وينشر الجديدة/المتغيرة منها.
- يمكن أن تكون الجذور أي مجلد: دليل Skills أو مجلد Skill واحد مع `SKILL.md`.
- يضيف تلقائيًا جذور Skills الخاصة بـ Clawdbot عند وجود `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (الوكيل الرئيسي)
  - `routing.agents.*.workspace/skills` (لكل وكيل)
  - `~/.clawdbot/skills` (مشترك)
  - `skills.load.extraDirs` (حزم مشتركة)
- يحترم `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و`OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- الأعلام:
  - `--root <dir...>` جذور فحص إضافية
  - `--all` الرفع دون مطالبة
  - `--dry-run` عرض الخطة فقط
  - `--bump patch|minor|major` (الافتراضي: patch)
  - `--changelog <text>` (غير تفاعلي)
  - `--tags a,b,c` (الافتراضي: latest)
  - `--concurrency <n>` (الافتراضي: 4)

القياس عن بُعد:

- يُرسل أثناء `sync` عند تسجيل الدخول، ما لم يكن `CLAWHUB_DISABLE_TELEMETRY=1` (القديم `CLAWDHUB_DISABLE_TELEMETRY=1`).
- التفاصيل: `docs/telemetry.md`.

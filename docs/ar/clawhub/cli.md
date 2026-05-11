---
read_when:
    - استخدام CLI الخاص بـ ClawHub
    - تصحيح أخطاء التثبيت أو التحديث أو النشر أو المزامنة
summary: 'مرجع CLI: الأوامر، والرايات، والتكوين، وملف القفل، وسلوك المزامنة.'
x-i18n:
    generated_at: "2026-05-11T20:24:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b07c0a4cf2896ac8ffbaf9d65b913523a565a7030c9c255c0d27e0af7ad28b4
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

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مهيّأة)
- `--dir <dir>`: دليل التثبيت داخل دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي للـ API (الافتراضي: يتم اكتشافه، وإلا `https://clawhub.ai`)
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

عند ضبط أي من هذه المتغيرات، يوجّه CLI الطلبات الصادرة عبر
الوكيل المحدد. يُستخدم `HTTPS_PROXY` لطلبات HTTPS، و`HTTP_PROXY`
لطلبات HTTP العادية. ويتم احترام `NO_PROXY` / `no_proxy` لتجاوز الوكيل
لمضيفين أو نطاقات محددة.

هذا مطلوب على الأنظمة التي تُحظر فيها الاتصالات الصادرة المباشرة
(مثل حاويات Docker، أو Hetzner VPS مع إنترنت عبر الوكيل فقط، أو جدران
الحماية المؤسسية).

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
- مسار احتياطي قديم: إذا لم يكن `clawhub/config.json` موجودًا بعد لكن `clawdhub/config.json` موجود، فإن CLI يعيد استخدام المسار القديم
- تجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح على `<site>/cli/auth` ويُكمل عبر استدعاء رجوع حلقي.
- بلا واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بلا واجهة: يطبع `clawhub login --device` رمزًا وينتظر بينما تصرّح له عند `<site>/cli/device`.

### `whoami`

- يتحقّق من الرمز المخزّن عبر `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- يضيف مهارة إلى العناصر المميزة لديك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يفضّل البحث مطابقات رمز المعرّف/الاسم الدقيقة قبل شعبية التنزيل. يطابق رمز معرّف مستقل مثل `map` المعرف `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- التنزيلات عامل شعبية مسبق صغير، وليست ضمانًا للظهور في أعلى النتائج.
- إذا كان ينبغي أن تظهر مهارة لكنها لا تظهر، فشغّل `clawhub inspect <slug>` أثناء تسجيل الدخول للتحقق من تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث المهارات عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (الافتراضي: newest)
  - `--json` (مخرجات قابلة للقراءة آليًا)
- المخرجات: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect <slug>`

- يجلب البيانات الوصفية للمهارة وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى لعدد الإصدارات المراد سردها (1-200).
- `--files`: سرد الملفات للإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `install <slug>`

- يحل أحدث إصدار عبر `/api/v1/skills/<slug>`.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق المهارات المثبّتة بإصدار محدد؛ شغّل `clawhub unpin <slug>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <slug>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (الإرثي `.clawdhub`).
- يعرض `pinned` بجانب Skills المثبتة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <slug>`

- يعلّم Skill مثبّتة كـ pinned في ملف القفل.
- يسجل `--reason <text>` سبب تجميد Skill.
- يتم تخطي Skills المثبتة بواسطة `update --all` ورفضها بواسطة `update <slug>` المباشر.
- ترفض Skills المثبتة أيضًا `install --force` حتى لا تُستبدل البايتات المحلية عن طريق الخطأ.

### `unpin <slug>`

- يزيل تثبيت ملف القفل من Skill مثبتة بحيث يمكن للتحديثات المستقبلية تعديلها.

### `update [slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا طابقت البصمة إصدارًا معروفًا: لا توجد مطالبة.
- إذا لم تطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا يتم تحديث Skills المثبتة مطلقًا بواسطة `--force`.
- يفشل `update <slug>` بسرعة مع slugs المثبتة ويخبرك بتشغيل `clawhub unpin <slug>` أولًا.
- يتخطى `update --all` slugs المثبتة ويطبع ملخصًا لما بقي مجمدًا.

### `skill publish <path>`

- ينشر عبر `POST /api/v1/skills` (متعدد الأجزاء).
- يتطلب semver: `--version 1.2.3`.
- ينشر `--owner <handle>` تحت معرّف ناشر لمؤسسة/مستخدم عندما تكون لدى
  الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` Skill موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب صلاحية مسؤول/مالك لدى كلا الناشرين.
- يتم شرح سلوك المالك والمراجعة في `docs/publishing.md`.
- يعني نشر Skill أنها صادرة تحت `MIT-0` على ClawHub.
- Skills المنشورة مجانية للاستخدام والتعديل وإعادة التوزيع دون إسناد.
- لا يدعم ClawHub Skills المدفوعة أو التسعير لكل Skill.
- الاسم المستعار الإرثي: `publish <path>`.

### `delete <slug>`

- يحذف Skill حذفًا ناعمًا (المالك أو المشرف أو المسؤول).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- تحجز عمليات الحذف الناعم التي يبدأها المالك slug لمدة 30 يومًا؛ يطبع الأمر وقت الانتهاء.
- يسجل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` هو اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `undelete <slug>`

- يستعيد Skill مخفية (المالك أو المشرف أو المسؤول).
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` هو اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `hide <slug>`

- يخفي Skill (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `delete`.

### `unhide <slug>`

- يلغي إخفاء Skill (المالك أو المشرف أو المسؤول).
- اسم مستعار لـ `undelete`.

### `skill rename <slug> <new-slug>`

- يعيد تسمية Skill مملوكة ويحافظ على slug السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتخطى `--yes` التأكيد.

### `skill merge <source-slug> <target-slug>`

- يدمج Skill مملوكة في Skill مملوكة أخرى.
- يتوقف slug المصدر عن الظهور علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتخطى `--yes` التأكيد.

### `skill rescan <slug>`

- يطلب إعادة فحص أمني لأحدث إصدار منشور من Skill.
- يمكن للمالكين ومسؤولي الناشرين إعادة فحص Skills الخاصة بهم حتى حد الاسترداد
  لكل إصدار.
- يمكن لمشرفي المنصة والمسؤولين إعادة فحص أي Skill ولا يقيّدهم
  حد استرداد المالك، رغم أنه لا يمكن تشغيل أكثر من إعادة فحص واحدة في الوقت نفسه لكل إصدار.
- يستدعي `POST /api/v1/skills/{slug}/rescan`.
- الأعلام:
  - `--yes`: تخطي التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلقًا يقبله المستلم.
- تُطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما تكون لدى الفاعل
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

- يتصفح أو يبحث في كتالوج الحزم الموحد عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا للـ plugins وإدخالات عائلات الحزم الأخرى؛ يبقى `search` على المستوى الأعلى واجهة بحث Skills.
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
- استخدم هذا لبيانات تعريف plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدارات/الملفات.
- `--version <version>`: افحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: افحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: اعرض سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد عرضها (1-100).
- `--files`: اعرض الملفات للإصدار المحدد.
- `--file <path>`: اجلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200 كيلوبايت).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلل.
- يتحقق من SHA-256 الخاص بـ ClawHub لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من سلامة npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` في ملف tarball.
- يتم تنزيل إصدارات ZIP الإرثية عبر مسار ZIP الإرثي.
- الأعلام:
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
- مع `--package`، يحل بيانات التعريف المتوقعة من ClawHub ويقارن
  الملف المحلي ببيانات تعريف الأثر المنشور.
- مع أعلام البصمة المباشرة، يتحقق دون بحث شبكي.
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

### `package delete <name>`

- يحذف الحزمة حذفًا مبدئيًا مع جميع الإصدارات.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر المؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- الأعلام:
  - `--yes`: تخطي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- يستعيد حزمة وإصدارات محذوفة حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر المؤسسة، أو مشرف المنصة،
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
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر
  الوجهة، ما لم ينفذه مسؤول المنصة.
- يجب أن تُنقل أسماء الحزم ذات النطاق إلى مالك النطاق المطابق.
- يستدعي `POST /api/v1/packages/{name}/transfer`.
- الأعلام:
  - `--to <owner>`: معرف الناشر الوجهة.
  - `--reason <text>`: سبب تدقيق اختياري.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package rescan <name>`

- يطلب إعادة فحص أمني لأحدث إصدار منشور من الحزمة.
- يمكن للمالكين ومسؤولي الناشر إعادة فحص حزمهم حتى حد الاسترداد
  لكل إصدار.
- يمكن لمشرفي المنصة ومسؤوليها إعادة فحص أي حزمة ولا يقيّدهم
  حد استرداد المالك، مع أنه لا يمكن تشغيل أكثر من إعادة فحص واحدة في كل مرة لكل إصدار.
- يستدعي `POST /api/v1/packages/{name}/rescan`.
- الأعلام:
  - `--yes`: تخطي التأكيد.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- أمر موثّق للإبلاغ عن حزمة إلى المشرفين.
- يستدعي `POST /api/v1/packages/{name}/report`.
- تكون البلاغات على مستوى الحزمة، ويمكن ربطها اختياريًا بإصدار، وتصبح مرئية
  للمشرفين للمراجعة.
- لا تخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بحد ذاتها.
- الأعلام:
  - `--version <version>`: إصدار حزمة اختياري لإرفاقه بالبلاغ.
  - `--reason <text>`: سبب البلاغ المطلوب.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- أمر للمالك/الناشر لاستئناف إشراف الإصدار.
- يستدعي `POST /api/v1/packages/{name}/appeal`.
- تُقبل الاستئنافات للإصدارات المعزولة، أو الملغاة، أو المشبوهة، أو الخبيثة.
- الأعلام:
  - `--version <version>`: إصدار الحزمة المطلوب.
  - `--message <text>`: رسالة الاستئناف المطلوبة.
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
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

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق أمام الحالة الرسمية، وتوفر ClawPack، وملخص الأداة المصطنعة،
  ومصدر المصدر، وتوافق OpenClaw، وأهداف المضيف، وبيانات تعريف البيئة،
  وحالة الفحص.
- الأعلام:
  - `--json`: إخراج قابل للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغلين لحزمة قد تستبدل
  Plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها مثل `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات،
  والعوائق.
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
  - أرشيف ClawPack محلي من نوع npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL من GitHub: `https://github.com/owner/repo`
- تُكتشف بيانات التعريف تلقائيًا من `package.json`، و`openclaw.plugin.json`،
  وعلامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json`،
  و`.claude-plugin/plugin.json`، و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` بصفتها ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة فقط للتحقق وملء بيانات التعريف مسبقًا.
- تُحزم مجلدات Plugin البرمجية في أرشيف npm من نوع ClawPack قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأداة المصطنعة الدقيقة. ما زالت مجلدات Plugin الحزم
  تستخدم مسار النشر من الملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، تُملأ إحالة المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، تُكتشف إحالة المصدر تلقائيًا من git المحلي عندما يشير remote الأصل إلى GitHub.
- يجب على Plugins البرمجية الخارجية تعريف `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` على المستوى الأعلى كاحتياطي للتحقق من النشر.
- يعرض `--dry-run` معاينة حمولة النشر المحلولة دون رفعها.
- يصدر `--json` إخراجًا قابلًا للقراءة آليًا لاستخدام CI.
- ينشر `--owner <handle>` تحت معرف ناشر مستخدم أو مؤسسة عندما يكون لدى الفاعل وصول ناشر.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- ما زالت الأعلام الموجودة (`--family`، و`--name`، و`--version`، و`--source-repo`، و`--source-commit`، و`--source-ref`، و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات تعريف الحزمة المحلولة
وإحالة المصدر قبل إنشاء إصدار حي:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### تدفق المجلد المحلي

بالنسبة إلى Plugins البرمجية، يبني نشر المجلد أداة ClawPack مصطنعة من
مجلد الحزمة ويرفعها:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### الحد الأدنى من `package.json` لـ `--family code-plugin`

تحتاج Plugins البرمجية الخارجية إلى قدر صغير من بيانات تعريف OpenClaw في
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

- `package.json.version` هو إصدار حزمة الإصدار لديك، لكنه لا يُستخدم
  كاحتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` هما بيانات تعريف اختيارية.
  قد يعرضهما ClawHub عند وجودهما، لكنهما غير مطلوبين للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات تعريف توافق أكثر تفصيلًا.
- إذا كنت تستخدم إصدارًا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.

#### GitHub Actions

يوفر ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/8ed84813808a116d30aebe4357bb367b0786bb9c/.github/workflows/package-publish.yml)
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
- بالنسبة إلى المستودعات الأحادية، مرر `source_path` حتى ينشر سير العمل مجلد
  حزمة Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى تبقى CI غير ملوِّثة.
- يجب أن تقتصر عمليات النشر الحقيقية على أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ ما زالت دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا للنشر الأول، أو للحزم غير الموثوقة، أو لعمليات النشر الطارئة.
- يرفع سير العمل نتيجة JSON كأداة مصطنعة ويعرضها كمخرجات لسير العمل.

### `sync`

- يفحص مجلدات Skills المحلية وينشر الجديدة/المتغيرة منها.
- يمكن أن تكون الجذور أي مجلد: دليل Skills أو مجلد Skill واحد يحتوي على `SKILL.md`.
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

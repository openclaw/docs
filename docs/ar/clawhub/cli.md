---
read_when:
    - استخدام ClawHub CLI
    - تصحيح أخطاء التثبيت أو التحديث أو النشر أو المزامنة
summary: 'مرجع CLI: الأوامر، والأعلام، والتكوين، وملف القفل، وسلوك المزامنة.'
x-i18n:
    generated_at: "2026-05-13T05:32:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33d1874fbb65602a7a3b19838a45b4715fa1edd4edc8873a3e4b53bd122e6774
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

## الأعلام العامة

- `--workdir <dir>`: دليل العمل (الافتراضي: cwd؛ يعود إلى مساحة عمل Clawdbot إذا كانت مهيأة)
- `--dir <dir>`: دليل التثبيت تحت دليل العمل (الافتراضي: `skills`)
- `--site <url>`: عنوان URL الأساسي لتسجيل الدخول عبر المتصفح (الافتراضي: `https://clawhub.ai`)
- `--registry <url>`: عنوان URL الأساسي لواجهة API (الافتراضي: يُكتشف، وإلا `https://clawhub.ai`)
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
(مثل حاويات Docker، أو خوادم Hetzner VPS ذات الإنترنت عبر الوكيل فقط، أو
جدران حماية الشركات).

مثال:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

عند عدم تعيين أي متغير وكيل، يبقى السلوك دون تغيير (اتصالات مباشرة).

## ملف التهيئة

يخزّن رمز API المميز الخاص بك + عنوان URL المخزّن مؤقتًا للسجل.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` أو `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- الرجوع القديم: إذا لم يكن `clawhub/config.json` موجودًا بعد ولكن `clawdhub/config.json` موجود، يعيد CLI استخدام المسار القديم
- التجاوز: `CLAWHUB_CONFIG_PATH` (القديم `CLAWDHUB_CONFIG_PATH`)

## الأوامر

### `login` / `auth login`

- الافتراضي: يفتح المتصفح إلى `<site>/cli/auth` ويُكمل عبر رد نداء loopback.
- بدون واجهة: `clawhub login --token clh_...`
- تفاعلي عن بُعد/بدون واجهة: يطبع `clawhub login --device` رمزًا وينتظر أثناء تفويضه على `<site>/cli/device`.

### `whoami`

- يتحقق من الرمز المميز المخزّن عبر `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- يضيف Skill إلى تمييزاتك أو يزيلها منها.
- يستدعي `POST /api/v1/stars/<slug>` و`DELETE /api/v1/stars/<slug>`.
- يتجاوز `--yes` التأكيد.

### `search <query...>`

- يستدعي `/api/v1/search?q=...`.
- يفضّل البحث مطابقات رموز المعرّف/الاسم الدقيقة قبل شعبية التنزيل. رمز معرّف مستقل مثل `map` يطابق `personal-map` بقوة أكبر من السلسلة الفرعية داخل `amap`.
- التنزيلات عامل شعبية مسبق صغير، وليست ضمانًا للظهور في أعلى النتائج.
- إذا كان ينبغي أن تظهر Skill لكنها لا تظهر، شغّل `clawhub inspect <slug>` أثناء تسجيل الدخول لفحص تشخيصات الإشراف المرئية للمالك قبل إعادة تسمية البيانات الوصفية.

### `explore`

- يسرد أحدث Skills عبر `/api/v1/skills?limit=...&sort=createdAt` (مرتبة حسب `createdAt` تنازليًا).
- الأعلام:
  - `--limit <n>` (1-200، الافتراضي: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (الافتراضي: الأحدث)
  - `--json` (مخرجات قابلة للقراءة آليًا)
- المخرجات: `<slug>  v<version>  <age>  <summary>` (يُقتطع الملخص إلى 50 حرفًا).

### `inspect <slug>`

- يجلب بيانات Skill الوصفية وملفات الإصدار دون تثبيت.
- `--version <version>`: فحص إصدار محدد (الافتراضي: الأحدث).
- `--tag <tag>`: فحص إصدار موسوم (مثل `latest`).
- `--versions`: سرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-200).
- `--files`: سرد الملفات للإصدار المحدد.
- `--file <path>`: جلب محتوى الملف الخام (الملفات النصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `install <slug>`

- يحل أحدث إصدار عبر `/api/v1/skills/<slug>`.
- ينزّل ملف zip عبر `/api/v1/download`.
- يستخرجه إلى `<workdir>/<dir>/<slug>`.
- يرفض الكتابة فوق Skills المثبتة بدبوس؛ شغّل `clawhub unpin <slug>` أولًا.
- يكتب:
  - `<workdir>/.clawhub/lock.json` (القديم `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (القديم `.clawdhub`)

### `uninstall <slug>`

- يزيل `<workdir>/<dir>/<slug>` ويحذف إدخال ملف القفل.
- تفاعلي: يطلب التأكيد.
- غير تفاعلي (`--no-input`): يتطلب `--yes`.

### `list`

- يقرأ `<workdir>/.clawhub/lock.json` (الإرثي `.clawdhub`).
- يعرض `pinned` بجانب Skills المجمّدة باستخدام `clawhub pin`، بما في ذلك السبب الاختياري.

### `pin <slug>`

- يعلّم Skill مثبّتة على أنها مثبّتة في ملف القفل.
- يسجّل `--reason <text>` سبب تجميد Skill.
- يتم تخطي Skills المثبّتة بواسطة `update --all` ورفضها بواسطة `update <slug>` المباشر.
- ترفض Skills المثبّتة أيضًا `install --force` حتى لا يمكن استبدال البايتات المحلية عن طريق الخطأ.

### `unpin <slug>`

- يزيل تثبيت ملف القفل من Skill مثبّتة حتى تتمكن التحديثات المستقبلية من تعديلها.

### `update [slug]` / `update --all`

- يحسب البصمة من الملفات المحلية.
- إذا تطابقت البصمة مع إصدار معروف: لا توجد مطالبة.
- إذا لم تتطابق البصمة:
  - يرفض افتراضيًا
  - يستبدل باستخدام `--force` (أو مطالبة، إذا كان تفاعليًا)
- لا يتم تحديث Skills المثبّتة أبدًا بواسطة `--force`.
- يفشل `update <slug>` بسرعة مع slugs المثبّتة ويخبرك بتشغيل `clawhub unpin <slug>` أولًا.
- يتخطى `update --all` slugs المثبّتة ويطبع ملخصًا لما بقي مجمّدًا.

### `skill publish <path>`

- ينشر عبر `POST /api/v1/skills` (متعدد الأجزاء).
- يتطلب semver: `--version 1.2.3`.
- ينشر `--owner <handle>` ضمن معرّف ناشر مؤسسة/مستخدم عندما يكون لدى
  الفاعل صلاحية الناشر.
- ينقل `--migrate-owner` Skill موجودة إلى `--owner` أثناء نشر إصدار جديد.
  يتطلب صلاحية admin/owner على كلا الناشرين.
- يتم شرح سلوك المالك والمراجعة في `docs/publishing.md`.
- يعني نشر Skill أنها أُصدرت بموجب `MIT-0` على ClawHub.
- يمكن استخدام Skills المنشورة وتعديلها وإعادة توزيعها مجانًا دون نسب.
- لا يدعم ClawHub Skills مدفوعة أو تسعيرًا لكل Skill.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير معتاد بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى مضيف أصلي، أو بيانات اعتماد خاصة بموفّر. تُخزّن الملاحظة على
  الإصدار المنشور.
- الاسم المستعار الإرثي: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- يحذف Skill حذفًا مبدئيًا (المالك أو المشرف أو admin).
- يستدعي `DELETE /api/v1/skills/{slug}`.
- تحجز عمليات الحذف المبدئي التي يبدأها المالك slug لمدة 30 يومًا؛ ويطبع الأمر وقت الانتهاء.
- يسجّل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` هو اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `undelete <slug>`

- يستعيد Skill مخفية (المالك أو المشرف أو admin).
- يستدعي `POST /api/v1/skills/{slug}/undelete`.
- يسجّل `--reason <text>` ملاحظة إشراف على Skill وسجل التدقيق.
- `--note <text>` هو اسم مستعار لـ `--reason`.
- يتخطى `--yes` التأكيد.

### `hide <slug>`

- يخفي Skill (المالك أو المشرف أو admin).
- اسم مستعار لـ `delete`.

### `unhide <slug>`

- يلغي إخفاء Skill (المالك أو المشرف أو admin).
- اسم مستعار لـ `undelete`.

### `skill rename <slug> <new-slug>`

- يعيد تسمية Skill مملوكة ويُبقي slug السابق كاسم مستعار لإعادة التوجيه.
- يستدعي `POST /api/v1/skills/{slug}/rename`.
- يتخطى `--yes` التأكيد.

### `skill merge <source-slug> <target-slug>`

- يدمج Skill مملوكة في Skill مملوكة أخرى.
- يتوقف slug المصدر عن الظهور علنًا ويصبح اسمًا مستعارًا لإعادة التوجيه إلى الهدف.
- يستدعي `POST /api/v1/skills/{sourceSlug}/merge`.
- يتخطى `--yes` التأكيد.

### `transfer`

- سير عمل نقل الملكية.
- تنشئ عمليات النقل إلى معرّفات المستخدمين طلبًا معلّقًا يقبله المستلِم.
- تطبّق عمليات النقل إلى معرّفات المؤسسات/الناشرين فورًا فقط عندما يكون لدى الفاعل
  صلاحية admin لكل من المالك الحالي والناشر الوجهة.
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

- يتصفح كتالوج الحزم الموحّد أو يبحث فيه عبر `GET /api/v1/packages` و`GET /api/v1/packages/search`.
- استخدم هذا لـ plugins وإدخالات عائلات الحزم الأخرى؛ تبقى `search` ذات المستوى الأعلى واجهة بحث Skills.
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
- استخدم هذا لبيانات تعريف Plugin، والتوافق، والتحقق، والمصدر، وفحص الإصدار/الملف.
- `--version <version>`: يفحص إصدارًا محددًا (الافتراضي: الأحدث).
- `--tag <tag>`: يفحص إصدارًا موسومًا (مثل `latest`).
- `--versions`: يسرد سجل الإصدارات (الصفحة الأولى).
- `--limit <n>`: الحد الأقصى للإصدارات المراد سردها (1-100).
- `--files`: يسرد الملفات للإصدار المحدد.
- `--file <path>`: يجلب محتوى الملف الخام (ملفات نصية فقط؛ حد 200KB).
- `--json`: مخرجات قابلة للقراءة آليًا.

### `package download <name>`

- يحل إصدار حزمة عبر
  `GET /api/v1/packages/{name}/versions/{version}/artifact`.
- ينزّل الأثر من `downloadUrl` الخاص بالمحلّل.
- يتحقق من ClawHub SHA-256 لجميع الآثار.
- بالنسبة إلى آثار ClawPack npm-pack، يتحقق أيضًا من تكامل npm `sha512`،
  وnpm shasum، واسم/إصدار `package.json` في tarball.
- تُنزّل إصدارات ZIP الإرثية عبر مسار ZIP الإرثي.
- العلامات:
  - `--version <version>`: ينزّل إصدارًا محددًا.
  - `--tag <tag>`: ينزّل إصدارًا موسومًا (الافتراضي: `latest`).
  - `-o, --output <path>`: ملف أو دليل الإخراج.
  - `--force`: يستبدل ملف إخراج موجودًا.
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
- مع علامات الملخص المباشرة، يتحقق دون بحث شبكي.
- العلامات:
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

### `package delete <name>`

- يحذف الحزمة وجميع الإصدارات حذفًا مبدئيًا.
- يتطلب مالك الحزمة، أو مالك/مسؤول ناشر مؤسسة، أو مشرف المنصة،
  أو مسؤول المنصة.
- العلامات:
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

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
  - `--yes`: تجاوز التأكيد.
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- ينقل حزمة إلى ناشر آخر.
- يتطلب وصول مسؤول إلى كل من مالك الحزمة الحالي والناشر
  الوجهة، ما لم ينفذه مسؤول المنصة.
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
- لا تخفي البلاغات الحزم تلقائيًا ولا تمنع التنزيلات بحد ذاتها.
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
- يعرض حالة فحص الحزمة الحالية، وعدد البلاغات المفتوحة، وحالة الإشراف اليدوي
  لأحدث إصدار، وحالة حظر التنزيل، وأسباب الإشراف.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- يتحقق مما إذا كانت الحزمة جاهزة لاستهلاك OpenClaw مستقبلًا.
- يستدعي `GET /api/v1/packages/{name}/readiness`.
- يبلّغ عن العوائق للحالة الرسمية، وتوفر ClawPack، وملخص الأثر،
  ومصدر المنشأ، وتوافق OpenClaw، وأهداف المضيف، وبيانات البيئة الوصفية،
  وحالة الفحص.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- يعرض حالة الترحيل الموجهة للمشغل لحزمة قد تستبدل
  Plugin مضمّنًا في OpenClaw.
- يستدعي نقطة نهاية الجاهزية المحسوبة نفسها التي يستدعيها `package readiness`، لكنه يطبع
  حالة تركز على الترحيل، وأحدث إصدار، وحالة الحزمة الرسمية، والفحوصات، و
  العوائق.
- العلامات:
  - `--json`: مخرجات قابلة للقراءة آليًا.

مثال:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- ينشر Plugin برمجيًا أو Plugin حزمة عبر `POST /api/v1/packages`.
- يقبل `<source>`:
  - مسار مجلد محلي: `./my-plugin`
  - ملف tarball محلي بصيغة ClawPack من npm-pack: `./my-plugin-1.2.3.tgz`
  - مستودع GitHub: `owner/repo` أو `owner/repo@ref`
  - عنوان URL في GitHub: `https://github.com/owner/repo`
- تُكتشف البيانات الوصفية تلقائيًا من `package.json` و`openclaw.plugin.json` و
  علامات حزم OpenClaw الحقيقية مثل `.codex-plugin/plugin.json` و
  `.claude-plugin/plugin.json` و`.cursor-plugin/plugin.json`.
- تُعامل مصادر `.tgz` كـ ClawPack. يرفع CLI بايتات npm-pack الدقيقة
  ويستخدم محتويات `package/` المستخرجة للتحقق وملء البيانات الوصفية مسبقًا فقط.
- تُحزم مجلدات Plugin البرمجية في ملف tarball من ClawPack بصيغة npm قبل الرفع حتى
  تتمكن تثبيتات OpenClaw من التحقق من الأثر الدقيق. لا تزال مجلدات Plugin الحزمة
  تستخدم مسار نشر الملفات المستخرجة.
- بالنسبة إلى مصادر GitHub، يُملأ نسب المصدر تلقائيًا من المستودع، والالتزام المحلول، والمرجع، والمسار الفرعي.
- بالنسبة إلى المجلدات المحلية، يُكتشف نسب المصدر تلقائيًا من git المحلي عندما يشير الأصل البعيد إلى GitHub.
- يجب أن تصرّح Plugins البرمجية الخارجية بـ `openclaw.compat.pluginApi` و
  `openclaw.build.openclawVersion` صراحةً.
  لا يُستخدم `package.json.version` في المستوى الأعلى كبديل احتياطي للتحقق عند النشر.
- يعاين `--dry-run` حمولة النشر المحلولة دون رفعها.
- يصدر `--json` مخرجات قابلة للقراءة آليًا لـ CI.
- ينشر `--owner <handle>` تحت معرّف ناشر مستخدم أو مؤسسة عندما يكون لدى الفاعل وصول الناشر.
- يضيف `--clawscan-note <text>` ملاحظة ClawScan. تمنح هذه الملاحظة ClawScan
  سياقًا لسلوك قد يبدو غير مألوف بخلاف ذلك، مثل الوصول إلى الشبكة،
  أو الوصول إلى المضيف الأصلي، أو بيانات اعتماد خاصة بمزود. تُخزّن الملاحظة على
  الإصدار المنشور.
- يجب أن تطابق أسماء الحزم ذات النطاق المالك المحدد. راجع `docs/publishing.md`.
- لا تزال العلامات الحالية (`--family` و`--name` و`--version` و`--source-repo` و`--source-commit` و`--source-ref` و`--source-path`) تعمل كتجاوزات.
- تتطلب مستودعات GitHub الخاصة `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### التدفق المحلي الموصى به

استخدم `--dry-run` أولًا حتى تتمكن من تأكيد بيانات الحزمة الوصفية المحلولة و
نسب المصدر قبل إنشاء إصدار مباشر:

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

#### الحد الأدنى من `package.json` لـ `--family code-plugin`

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
  كبديل احتياطي للتحقق من توافق/بناء OpenClaw.
- `openclaw.hostTargets` و`openclaw.environment` بيانات وصفية اختيارية.
  قد يعرضهما ClawHub عند وجودهما، لكنهما غير مطلوبين للنشر.
- `openclaw.compat.minGatewayVersion` و
  `openclaw.build.pluginSdkVersion` إضافات اختيارية إذا أردت نشر
  بيانات وصفية أكثر تفصيلًا للتوافق.
- إذا كنت تستخدم إصدارًا أقدم من CLI `clawhub`، فقم بالترقية قبل النشر حتى
  تعمل فحوصات ما قبل الإقلاع المحلية قبل الرفع.

#### GitHub Actions

يوفر ClawHub أيضًا سير عمل رسميًا قابلًا لإعادة الاستخدام في
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2ddaad62cc7852eb8274022ae8a6d7527d169ae8/.github/workflows/package-publish.yml)
لمستودعات Plugin.

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

- يجعل سير العمل القابل لإعادة الاستخدام `source` افتراضيًا إلى مستودع المستدعي.
- بالنسبة إلى المستودعات الأحادية، مرّر `source_path` حتى ينشر سير العمل مجلد حزمة
  Plugin، على سبيل المثال `source_path: extensions/codex`.
- ثبّت سير العمل القابل لإعادة الاستخدام على وسم مستقر أو SHA التزام كامل. لا تشغّل نشر الإصدارات من `@main`.
- يجب أن يستخدم `pull_request` القيمة `dry_run: true` حتى يبقى CI غير ملوث.
- يجب حصر عمليات النشر الحقيقية في أحداث موثوقة مثل `workflow_dispatch` أو دفعات الوسوم.
- لا يعمل النشر الموثوق دون سر إلا على `workflow_dispatch`؛ لا تزال دفعات الوسوم تحتاج إلى `clawhub_token`.
- أبقِ `clawhub_token` متاحًا لأول نشر، أو للحزم غير الموثوقة، أو للنشر عند الطوارئ.
- يرفع سير العمل نتيجة JSON كأثر ويعرضها كمخرجات لسير العمل.

### `sync`

- يفحص مجلدات Skills المحلية وينشر الجديدة/المتغيرة منها.
- يمكن أن تكون الجذور أي مجلد: دليل Skills أو مجلد Skill واحد يحتوي على `SKILL.md`.
- يضيف تلقائيًا جذور Skills الخاصة بـ Clawdbot عند وجود `~/.clawdbot/clawdbot.json`:
  - `agent.workspace/skills` (الوكيل الرئيسي)
  - `routing.agents.*.workspace/skills` (لكل وكيل)
  - `~/.clawdbot/skills` (مشترك)
  - `skills.load.extraDirs` (حزم مشتركة)
- يحترم `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` و`OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- العلامات:
  - `--root <dir...>` جذور فحص إضافية
  - `--all` الرفع دون طلب تأكيد
  - `--dry-run` عرض الخطة فقط
  - `--bump patch|minor|major` (الافتراضي: patch)
  - `--changelog <text>` (غير تفاعلي)
  - `--tags a,b,c` (الافتراضي: latest)
  - `--concurrency <n>` (الافتراضي: 4)

القياس عن بعد:

- يُرسل أثناء `sync` عند تسجيل الدخول، ما لم يكن `CLAWHUB_DISABLE_TELEMETRY=1` (القديم `CLAWDHUB_DISABLE_TELEMETRY=1`).
- التفاصيل: `docs/telemetry.md`.

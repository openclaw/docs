---
read_when:
    - تريد تثبيت أو إدارة مكوّنات Gateway الإضافية أو الحِزم المتوافقة
    - تريد تصحيح أخطاء فشل تحميل المكوّنات الإضافية
summary: مرجع CLI لـ `openclaw plugins` (`list`، `install`، `marketplace`، `uninstall`، `enable`/`disable`، `doctor`)
title: المكوّنات الإضافية
x-i18n:
    generated_at: "2026-04-25T18:18:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

إدارة مكوّنات Gateway الإضافية، وحِزم الخطافات، والحِزم المتوافقة.

ذو صلة:

- نظام Plugin: [المكوّنات الإضافية](/ar/tools/plugin)
- توافق الحِزم: [حِزم Plugin](/ar/plugins/bundles)
- بيان Plugin + المخطط: [بيان Plugin](/ar/plugins/manifest)
- تعزيز الأمان: [الأمان](/ar/gateway/security)

## الأوامر

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

تأتي المكوّنات الإضافية المضمّنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (على سبيل المثال
موفّرو النماذج المضمّنون، وموفّرو الكلام المضمّنون، وPlugin
المتصفح المضمّن)؛ بينما يتطلب البعض الآخر `plugins enable`.

يجب أن تشحن مكوّنات OpenClaw الإضافية الأصلية ملف `openclaw.plugin.json` مع
مخطط JSON مضمن (`configSchema`، حتى لو كان فارغًا). أمّا الحِزم المتوافقة فتستخدم
بيانات الحِزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما يعرض الإخراج
المفصل لـ list/info أيضًا النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى
إمكانات الحزمة المكتشفة.

### التثبيت

```bash
openclaw plugins install <package>                      # ClawHub أولًا، ثم npm
openclaw plugins install clawhub:<package>              # ClawHub فقط
openclaw plugins install <package> --force              # الكتابة فوق التثبيت الحالي
openclaw plugins install <package> --pin                # تثبيت الإصدار
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # مسار محلي
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (صريح)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

يُتحقق من أسماء الحِزم المجردة في ClawHub أولًا، ثم npm. ملاحظة أمنية:
تعامل مع تثبيت المكوّنات الإضافية كما لو كنت تشغّل شيفرة. يُفضَّل استخدام الإصدارات المثبتة.

إذا كان قسم `plugins` لديك مدعومًا بملف `$include` أحادي الملف، فإن
`plugins install/update/enable/disable/uninstall` يكتب إلى ذلك الملف المضمّن
ويترك `openclaw.json` دون تعديل. وتفشل التضمينات الجذرية، ومصفوفات التضمين،
والتضمينات ذات التجاوزات الشقيقة بشكل مغلق بدلًا من تسطيحها. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

إذا كانت الإعدادات غير صالحة، فإن `plugins install` يفشل عادة بشكل مغلق ويطلب منك
تشغيل `openclaw doctor --fix` أولًا. والاستثناء الوحيد الموثّق هو
مسار استرداد ضيق لمكوّن إضافي مضمّن للمكوّنات الإضافية التي تختار صراحةً
`openclaw.install.allowInvalidConfigRecovery`.

يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق مكوّن إضافي أو حزمة
خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تكون بصدد إعادة تثبيت
المعرّف نفسه عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm.
وبالنسبة للترقيات الروتينية لمكوّن npm إضافي متتبع مسبقًا، يُفضَّل استخدام
`openclaw plugins update <id-or-npm-spec>`.

إذا شغّلت `plugins install` لمعرّف مكوّن إضافي مثبت مسبقًا، فإن OpenClaw
يتوقف ويوجهك إلى `plugins update <id-or-npm-spec>` لإجراء ترقية عادية،
أو إلى `plugins install <package> --force` عندما تريد فعلًا الكتابة فوق
التثبيت الحالي من مصدر مختلف.

ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع `--marketplace`،
لأن تثبيتات marketplace تحفظ بيانات مصدر marketplace الوصفية بدلًا من
مواصفة npm.

يُعد `--dangerously-force-unsafe-install` خيارًا طارئًا للحالات الإيجابية الكاذبة
في ماسح الشيفرة الخطرة المدمج. فهو يسمح بمتابعة التثبيت حتى
عندما يبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا**
يتجاوز حظر سياسات خطاف Plugin `before_install`، كما **لا**
يتجاوز حالات فشل الفحص.

ينطبق هذا العلم في CLI على تدفقات تثبيت/تحديث Plugin. وتعتمد
عمليات تثبيت تبعيات Skills المدعومة من Gateway على تجاوز الطلب المطابق
`dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفقًا
منفصلًا لتنزيل/تثبيت Skills من ClawHub.

يُعد `plugins install` أيضًا سطح التثبيت لحِزم الخطافات التي تعرض
`openclaw.hooks` في `package.json`. استخدم `openclaw hooks` للحصول على
رؤية مفلترة للخطافات وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

تقتصر مواصفات npm على **السجل فقط** (اسم الحزمة مع **إصدار مطابق تمامًا**
اختياري أو **dist-tag**). وتُرفض مواصفات Git/URL/file ونطاقات semver.
تُشغَّل عمليات تثبيت التبعيات باستخدام `--ignore-scripts` لأسباب تتعلق بالأمان.

تظل المواصفات المجردة و`@latest` على المسار المستقر. وإذا قام npm بحل
أي منهما إلى إصدار prerelease، فإن OpenClaw يتوقف ويطلب منك الاشتراك
صراحةً باستخدام وسم prerelease مثل `@beta`/`@rc` أو إصدار prerelease
مطابق تمامًا مثل `@1.2.3-beta.4`.

إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمّنًا (مثل `diffs`)، فإن OpenClaw
يثبت Plugin المضمّن مباشرة. ولتثبيت حزمة npm بالاسم نفسه،
استخدم مواصفة نطاق صريحة (مثل `@scope/diffs`).

الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`.

تُدعَم أيضًا تثبيتات Claude marketplace.

تستخدم تثبيتات ClawHub محدِّدًا صريحًا بالشكل `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات المكوّنات الإضافية الآمنة مع npm والمجردة. ولا
يلجأ إلى npm إلا إذا لم يكن ClawHub يحتوي على تلك الحزمة أو ذلك الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

يقوم OpenClaw بتنزيل أرشيف الحزمة من ClawHub، والتحقق من
توافق Plugin API المُعلن/الحد الأدنى من توافق Gateway، ثم يثبتها عبر
المسار العادي للأرشيف. وتحتفظ التثبيتات المسجلة ببيانات مصدر ClawHub
الوصفية لاستخدامها لاحقًا في التحديثات.

استخدم الاختصار `plugin@marketplace` عندما يكون اسم marketplace موجودًا في
ذاكرة التخزين المؤقت لسجل Claude المحلي في `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر marketplace صراحةً:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

يمكن أن تكون مصادر Marketplace:

- اسم marketplace معروفًا لدى Claude من `~/.claude/plugins/known_marketplaces.json`
- جذر marketplace محليًا أو مسار `marketplace.json`
- اختصار مستودع GitHub مثل `owner/repo`
- عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
- عنوان URL لـ git

بالنسبة إلى marketplaces البعيدة التي تُحمّل من GitHub أو git، يجب أن تظل
إدخالات Plugin داخل مستودع marketplace المستنسخ. يقبل OpenClaw
مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin ذات HTTP(S) والمسارات
المطلقة وgit وGitHub وغيرها من المصادر غير المسارية من البيانات البعيدة.

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- مكوّنات OpenClaw الإضافية الأصلية (`openclaw.plugin.json`)
- حِزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حِزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّن Claude
  الافتراضي)
- حِزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

تُثبَّت الحِزم المتوافقة في جذر المكوّنات الإضافية العادي وتشارك
في نفس تدفق list/info/enable/disable. في الوقت الحالي، تُدعَم Skills الحِزم،
وcommand-skills الخاصة بـ Claude، وقيم Claude الافتراضية في `settings.json`،
وقيم Claude الافتراضية في `.lsp.json` /
و`lspServers` الافتراضية المعلنة في البيان، وcommand-skills الخاصة بـ Cursor، و
أدلة خطافات Codex المتوافقة؛ أمّا إمكانات الحِزم الأخرى المكتشفة
فتُعرَض في التشخيصات/info لكنها لم تُوصَل بعد بالتنفيذ وقت التشغيل.

### القائمة

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--enabled` لإظهار المكوّنات الإضافية المفعّلة فقط. واستخدم `--verbose` للانتقال من
عرض الجدول إلى أسطر تفاصيل لكل مكوّن إضافي تتضمن بيانات المصدر/المنشأ/الإصدار/التفعيل
الوصفية. واستخدم `--json` للحصول على مخزون قابل للقراءة آليًا بالإضافة إلى
تشخيصات السجل.

يقرأ `plugins list` أولًا سجل المكوّنات الإضافية المحلي المحفوظ، مع
بديل مشتق يعتمد على البيان فقط عندما يكون السجل مفقودًا أو غير صالح. وهو
مفيد للتحقق مما إذا كان المكوّن الإضافي مثبتًا ومفعّلًا ومرئيًا لتخطيط
بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا وقت التشغيل لعملية
Gateway تعمل بالفعل. بعد تغيير شيفرة المكوّن الإضافي أو تفعيله أو سياسة الخطافات أو
`plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل
توقّع تشغيل شيفرة `register(api)` أو الخطافات الجديدة. وبالنسبة إلى
عمليات النشر البعيدة/ضمن الحاويات، تحقّق من أنك تعيد تشغيل العملية الفرعية الفعلية
`openclaw gateway run`، وليس مجرد عملية غلاف فقط.

لتصحيح أخطاء الخطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --json` الخطافات المسجلة والتشخيصات
  من مرور فحص مع تحميل الوحدة.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway الممكن الوصول إليه،
  وتلميحات الخدمة/العملية، ومسار الإعدادات، وسلامة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input` و`llm_output` و`agent_end`)
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام
مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` مع تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في
`plugins.installs` مع إبقاء السلوك الافتراضي دون تثبيت إصدار.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يقوم `uninstall` بإزالة سجلات Plugin من `plugins.entries` و`plugins.installs`
وقائمة السماح الخاصة بالمكوّنات الإضافية وإدخالات `plugins.load.paths` المرتبطة
عند الاقتضاء. وبالنسبة إلى مكوّنات الذاكرة النشطة الإضافية، تُعاد تعيين خانة الذاكرة إلى
`memory-core`.

افتراضيًا، يزيل إلغاء التثبيت أيضًا دليل تثبيت المكوّن الإضافي ضمن
جذر مكوّنات الحالة النشطة. استخدم
`--keep-files` للاحتفاظ بالملفات على القرص.

يُدعَم `--keep-config` كاسم بديل مهمل لـ `--keep-files`.

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على التثبيتات المتتبعة في `plugins.installs` وعلى
تثبيتات حِزم الخطافات المتتبعة في `hooks.internal.installs`.

عند تمرير معرّف مكوّن إضافي، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك
المكوّن الإضافي. وهذا يعني أن dist-tags المخزنة مسبقًا مثل `@beta` والإصدارات
المثبتة الدقيقة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

وبالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag
أو إصدار مطابق تمامًا. يحل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل المكوّن الإضافي
المتتبع، ويحدّث ذلك المكوّن الإضافي المثبت، ويسجل مواصفة npm الجديدة
لاستخدامها في التحديثات المستقبلية المعتمدة على المعرّف.

كما أن تمرير اسم حزمة npm دون إصدار أو وسم يعيد أيضًا الحل إلى
سجل المكوّن الإضافي المتتبع. استخدم هذا عندما يكون المكوّن الإضافي مثبتًا على إصدار دقيق
وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

قبل تنفيذ تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقارنةً ببيانات
npm registry الوصفية. وإذا كان الإصدار المثبت وهوية العنصر المسجلة
يطابقان الهدف الذي تم حله بالفعل، يُتخطى التحديث دون
تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

عند وجود قيمة hash للتكامل مخزنة وتغيّر hash للعنصر الذي تم جلبه،
يتعامل OpenClaw مع ذلك على أنه انجراف في عنصر npm. ويعرض الأمر التفاعلي
`openclaw plugins update` قيم hash المتوقعة والفعلية ويطلب
التأكيد قبل المتابعة. وتفشل مساعدات التحديث غير التفاعلية بشكل مغلق
ما لم يوفّر المستدعي سياسة متابعة صريحة.

يتوفر `--dangerously-force-unsafe-install` أيضًا مع `plugins update` كخيار
طارئ لتجاوز الحالات الإيجابية الكاذبة في فحص الشيفرة الخطرة المدمج أثناء
تحديثات Plugin. لكنه لا يزال لا يتجاوز حظر سياسات Plugin `before_install`
أو حظر فشل الفحص، كما أنه ينطبق فقط على تحديثات Plugin، وليس على
تحديثات حِزم الخطافات.

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

استبطان عميق لمكوّن إضافي واحد. يعرض الهوية، وحالة التحميل، والمصدر،
والإمكانات المسجلة، والخطافات، والأدوات، والأوامر، والخدمات، وطرائق Gateway،
ومسارات HTTP، وأعلام السياسات، والتشخيصات، وبيانات التثبيت الوصفية، وإمكانات الحِزم،
وأي دعم مكتشف لخوادم MCP أو LSP.

يُصنَّف كل مكوّن إضافي وفقًا لما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع إمكانة واحد (مثل Plugin لموفّر فقط)
- **hybrid-capability** — أنواع إمكانات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، من دون إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات ولكن من دون إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج الإمكانات.

يُخرج العلم `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية
والتدقيق.

يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الأعمدة الخاصة بالشكل، وأنواع الإمكانات،
وملاحظات التوافق، وإمكانات الحِزم، وملخص الخطافات.

`info` اسم بديل لـ `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف،
وملاحظات التوافق. وعندما يكون كل شيء سليمًا يطبع `No plugin issues
detected.`

في حالات فشل شكل الوحدة مثل غياب عمليات التصدير `register`/`activate`، أعد التشغيل
مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصدير في
مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل المكوّنات الإضافية المحلي هو نموذج القراءة الباردة المحفوظ في OpenClaw لهوية
المكوّن الإضافي المثبت، وحالة تفعيله، وبيانات المصدر الوصفية، وملكية المساهمات.
يمكن لبدء التشغيل العادي، والبحث عن مالك الموفّر، وتصنيف إعداد القنوات، وجرد المكوّنات الإضافية
قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا،
أو حديثًا، أو قديمًا. واستخدم `--refresh` لإعادة بنائه من دفتر
التثبيت الدائم، وسياسة الإعدادات، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس
مسار تفعيل وقت التشغيل.

يُعد `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق طارئًا
مهمَلًا لحالات فشل قراءة السجل. يُفضَّل استخدام `plugins registry
--refresh` أو `openclaw doctor --fix`؛ فالبديل البيئي مخصص فقط
لاسترداد بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل Marketplace list مسار marketplace محليًا، أو مسار `marketplace.json`، أو
اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json`
تسمية المصدر التي تم حلها بالإضافة إلى بيان marketplace الذي تم تحليله
وإدخالات Plugin.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins المجتمع](/ar/plugins/community)

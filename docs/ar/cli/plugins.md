---
read_when:
    - تريد تثبيت Plugins الخاصة بـ Gateway أو إدارتها أو الحزم المتوافقة
    - تريد تصحيح حالات فشل تحميل Plugin
summary: مرجع CLI لـ `openclaw plugins` (list وinstall وmarketplace وuninstall وenable/disable وdoctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T07:35:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 35ef8f54c64ea52d7618a0ef8b90d3d75841a27ae4cd689b4ca8e0cfdcddc408
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

إدارة Plugins الخاصة بـ Gateway، وحزم hooks، والحزم المتوافقة.

ذو صلة:

- نظام Plugin: [Plugins](/ar/tools/plugin)
- توافق الحزم: [حزم Plugin](/ar/plugins/bundles)
- بيان Plugin + المخطط: [بيان Plugin](/ar/plugins/manifest)
- التقوية الأمنية: [الأمان](/ar/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

تأتي Plugins المضمنة مع OpenClaw. وبعضها مفعّل افتراضيًا (على سبيل المثال
مزوّدو النماذج المضمنون، ومزوّدو الكلام المضمنون، وPlugin
المتصفح المضمن)؛ بينما يتطلب البعض الآخر الأمر `plugins enable`.

يجب أن تأتي Plugins الأصلية الخاصة بـ OpenClaw مع `openclaw.plugin.json` ومعها
JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة
فتستخدم بيانات الحزمة الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض
مخرجات list/info المفصلة أيضًا النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.

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

يتم التحقق من أسماء الحزم المجردة مقابل ClawHub أولًا، ثم npm. ملاحظة أمنية:
تعامل مع تثبيت Plugins كما لو كنت تشغّل شيفرة. ويفضَّل استخدام الإصدارات المثبتة.

إذا كان قسم `plugins` لديك مدعومًا بملف `$include` أحادي، فإن `plugins install/update/enable/disable/uninstall` يكتب مباشرة إلى ذلك الملف المضمَّن ويترك `openclaw.json` دون تغيير. أما التضمينات الجذرية، ومصفوفات include، والتضمينات ذات التجاوزات الشقيقة فتفشل في وضع الإغلاق الآمن بدلًا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للاطلاع على الأشكال المدعومة.

إذا كانت الإعدادات غير صالحة، فإن `plugins install` يفشل عادةً في وضع الإغلاق الآمن ويطلب منك
تشغيل `openclaw doctor --fix` أولًا. والاستثناء الموثق الوحيد هو مسار
استرداد ضيق خاص بـ Plugin مضمن بالنسبة إلى Plugins التي تختار صراحةً
`openclaw.install.allowInvalidConfigRecovery`.

يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق Plugin أو حزمة hook مثبّتة
مسبقًا في مكانها. استخدمه عندما تكون تعيد عمدًا تثبيت
المعرّف نفسه من مسار محلي جديد أو أرشيف أو حزمة ClawHub أو عنصر npm.
أما في الترقيات الروتينية لـ Plugin npm متتبّع بالفعل، ففضّل
`openclaw plugins update <id-or-npm-spec>`.

إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، فسيتوقف OpenClaw
ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية،
أو إلى `plugins install <package> --force` عندما تريد فعلًا الكتابة فوق
التثبيت الحالي من مصدر مختلف.

ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع `--marketplace`,
لأن تثبيتات marketplace تحفظ بيانات مصدر marketplace بدلًا من
مواصفة npm.

إن `--dangerously-force-unsafe-install` هو خيار طوارئ لحالات الإيجابيات الكاذبة
في ماسح الشيفرة الخطرة المضمن. فهو يسمح بمتابعة التثبيت حتى
عندما يبلغ الماسح المضمن عن نتائج `critical`، لكنه **لا**
يتجاوز كتل سياسة hook ‏`before_install` الخاصة بـ Plugin، كما أنه **لا**
يتجاوز حالات فشل الفحص.

ينطبق هذا الخيار في CLI على تدفقات تثبيت/تحديث Plugin. أما تثبيتات تبعيات Skills
المدعومة من Gateway فتستخدم التجاوز الموافق للطلب `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

يُعد `plugins install` أيضًا سطح التثبيت لحزم hooks التي تكشف
`openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لعرض hooks
المصفّى وتفعيل كل hook على حدة، وليس لتثبيت الحزم.

تكون مواصفات npm **للسجل فقط** (اسم الحزمة مع **إصدار مطابق تمامًا** اختياري أو
**dist-tag**). وتُرفض مواصفات Git/URL/file ونطاقات semver. وتعمل تثبيتات
التبعيات مع `--ignore-scripts` لأسباب الأمان.

تبقى المواصفات المجردة و`@latest` على المسار المستقر. وإذا حلّ npm أيًا
منهما إلى إصدار prerelease، فسيتوقف OpenClaw ويطلب منك الاشتراك صراحةً
باستخدام علامة prerelease مثل `@beta`/`@rc` أو إصدار prerelease دقيق مثل
`@1.2.3-beta.4`.

إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمنًا (مثل `diffs`)، فسيثبّت OpenClaw
الـ Plugin المضمن مباشرةً. ولتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة
محددة النطاق صريحة (مثل `@scope/diffs`).

الأرشيفات المدعومة: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

كما أن تثبيتات Claude marketplace مدعومة أيضًا.

تستخدم تثبيتات ClawHub محددًا صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات Plugin المجردة الآمنة لـ npm. ولا
يعود إلى npm إلا إذا لم يكن ClawHub يحتوي على تلك الحزمة أو الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

يقوم OpenClaw بتنزيل أرشيف الحزمة من ClawHub، ويتحقق من
توافق Plugin API / الحد الأدنى المعلن لـ Gateway، ثم يثبته عبر
مسار الأرشيف العادي. وتحتفظ التثبيتات المسجلة ببيانات مصدر ClawHub
الوصفيّة لاستخدامها لاحقًا في التحديثات.

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم marketplace موجودًا في
ذاكرة السجل المحلية لـ Claude في `~/.claude/plugins/known_marketplaces.json`:

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

يمكن أن تكون مصادر marketplace:

- اسم marketplace معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
- جذر marketplace محلي أو مسار `marketplace.json`
- صيغة مختصرة لمستودع GitHub مثل `owner/repo`
- عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
- عنوان git URL

بالنسبة إلى marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin
داخل مستودع marketplace المستنسخ. ويقبل OpenClaw مصادر المسارات النسبية من
ذلك المستودع ويرفض مصادر Plugin من HTTP(S) والمسارات المطلقة وgit وGitHub
وغيرها من المصادر غير المسارية من البيانات الوصفية البعيدة.

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins OpenClaw الأصلية (`openclaw.plugin.json`)
- الحزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط
  مكونات Claude الافتراضي)
- الحزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

يتم تثبيت الحزم المتوافقة داخل جذر Plugin العادي وتشارك في
التدفق نفسه لـ list/info/enable/disable. ويدعم النظام اليوم bundle Skills وClaude
command-skills وقيَم Claude الافتراضية في `settings.json` وقيَم Claude الافتراضية في `.lsp.json` /
`lspServers` المعلنة في البيان، وCursor command-skills، وأدلة hooks
المتوافقة مع Codex؛ أما إمكانات الحزم المكتشفة الأخرى فتظهر في التشخيصات/info لكنها غير موصولة بعد بتنفيذ وقت التشغيل.

### List

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

استخدم `--enabled` لإظهار Plugins المحمّلة فقط. واستخدم `--verbose` للانتقال من
عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات المصدر/المنشأ/الإصدار/التفعيل
الوصفيّة. واستخدم `--json` للحصول على جرد قابل للقراءة الآلية بالإضافة إلى
تشخيصات السجل.

استخدم `--link` لتجنب نسخ دليل محلي (ويضيف المسار إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يكون `--force` مدعومًا مع `--link` لأن التثبيتات المرتبطة تعيد استخدام
المسار المصدري بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلَّلة (`name@version`) في
`plugins.installs` مع إبقاء السلوك الافتراضي غير مثبت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` و`plugins.installs`،
وقائمة السماح الخاصة بالـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء.
وبالنسبة إلى Plugins الخاصة بالذاكرة النشطة، تتم إعادة تعيين خانة الذاكرة إلى `memory-core`.

افتراضيًا، يؤدي إلغاء التثبيت أيضًا إلى إزالة دليل تثبيت Plugin من
جذر Plugin في state-dir النشط. استخدم
`--keep-files` للاحتفاظ بالملفات على القرص.

ويُدعم `--keep-config` كاسم بديل قديم لـ `--keep-files`.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على التثبيتات المتتبعة في `plugins.installs` وعلى
تثبيتات حزم hooks المتتبعة في `hooks.internal.installs`.

عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك
الـ Plugin. وهذا يعني أن dist-tags المخزنة مسبقًا مثل `@beta` والإصدارات الدقيقة المثبتة
تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag
أو إصدار دقيق. ويحلّل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل Plugin المتتبع،
ويحدّث Plugin المثبّت، ويسجّل مواصفة npm الجديدة لتحديثات
المعرّفات المستقبلية.

كما أن تمرير اسم حزمة npm من دون إصدار أو علامة يُحلّ أيضًا مرة أخرى إلى
سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد
إعادته إلى خط الإصدار الافتراضي للسجل.

قبل أي تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات
npm registry الوصفية. وإذا كان الإصدار المثبّت وهوية العنصر المسجلين
يطابقان بالفعل الهدف المحلَّل، فيتم تخطي التحديث من دون
تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

عندما توجد قيمة تجزئة integrity مخزنة ويتغير تجزئة العنصر الذي تم جلبه،
يتعامل OpenClaw مع ذلك على أنه انجراف في عنصر npm. ويطبع الأمر التفاعلي
`openclaw plugins update` قيم التجزئة المتوقعة والفعلية ويطلب
تأكيدًا قبل المتابعة. أما مساعدات التحديث غير التفاعلية فتفشل في وضع الإغلاق الآمن
ما لم يوفّر المستدعي سياسة متابعة صريحة.

يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز
طوارئ للإيجابيات الكاذبة في فحص الشيفرة الخطرة المضمن أثناء
تحديثات Plugin. لكنه ما يزال لا يتجاوز كتل سياسة `before_install`
الخاصة بـ Plugin أو حجب حالات فشل الفحص، كما أنه ينطبق على تحديثات Plugin فقط،
وليس على تحديثات حزم hooks.

### Inspect

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

فحص عميق لـ Plugin واحد. ويعرض الهوية، وحالة التحميل، والمصدر،
والإمكانات المسجلة، وhooks، والأدوات، والأوامر، والخدمات، وطرق Gateway،
ومسارات HTTP، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وإمكانات الحزمة،
وأي دعم مكتشف لخوادم MCP أو LSP.

يتم تصنيف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع إمكانية واحد (مثل Plugin خاص بمزوّد فقط)
- **hybrid-capability** — أنواع إمكانات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، من دون إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات ولكن من دون إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد حول نموذج الإمكانات.

يُخرج العلم `--json` تقريرًا قابلاً للقراءة الآلية ومناسبًا للبرمجة النصية
والتدقيق.

يعرض `inspect --all` جدولًا على مستوى الأسطول مع أعمدة للشكل، وأنواع الإمكانات،
وإشعارات التوافق، وإمكانات الحزمة، وملخص hooks.

إن `info` هو اسم بديل لـ `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف،
وإشعارات التوافق. وعندما يكون كل شيء سليمًا، يطبع `No plugin issues
detected.`

بالنسبة إلى حالات فشل شكل الوحدة مثل غياب الصادرات `register`/`activate`، أعد التشغيل
مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات ضمن
المخرجات التشخيصية.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل عرض marketplace مسار marketplace محليًا، أو مسار `marketplace.json`، أو
صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو git URL. وتقوم `--json`
بطباعة تسمية المصدر المحلَّلة بالإضافة إلى بيان marketplace المحلَّل
وإدخالات Plugin.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins المجتمع](/ar/plugins/community)

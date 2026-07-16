---
read_when:
    - تريد تثبيت أو إدارة Pluginات Gateway أو الحِزم المتوافقة
    - تريد إنشاء هيكل أولي لـ Plugin أداة بسيط أو التحقق من صحته
    - تريد تصحيح أخطاء فشل تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (التهيئة، والبناء، والتحقق، والعرض، والتثبيت، والسوق، وإلغاء التثبيت، والتمكين/التعطيل، والتشخيص)
title: الإضافات
x-i18n:
    generated_at: "2026-07-16T13:51:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

إدارة إضافات Gateway وحزم الخطافات والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت الإضافات وتمكينها واستكشاف أخطائها وإصلاحها.
  </Card>
  <Card title="إدارة الإضافات" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت والعرض والتحديث وإلغاء التثبيت والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعداد.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تعزيز أمان عمليات تثبيت الإضافات.
  </Card>
</CardGroup>

## الأوامر

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # اسم مستعار للأمر inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

للتحقيق في بطء التثبيت أو الفحص أو إلغاء التثبيت أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، يكون `openclaw.json` غير قابل للتغيير. ترفض كل من `install` و`update` و`uninstall` و`enable` و`disable` التشغيل. عدّل مصدر Nix لهذا التثبيت بدلًا من ذلك (`programs.openclaw.config` أو `instances.<name>.config` في nix-openclaw)، ثم أعد البناء. راجع [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الموجّه للوكلاء.
</Note>

<Note>
تأتي الإضافات المضمّنة مع OpenClaw. يُمكَّن بعضها افتراضيًا (مثل موفّري النماذج المضمّنين وموفّري الكلام المضمّنين وإضافة المتصفح المضمّنة)؛ بينما تتطلب الإضافات الأخرى `plugins enable`.

تأتي إضافات OpenClaw الأصلية مع `openclaw.plugin.json` ومخطط JSON مضمّن (`configSchema`، حتى إن كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات العرض/المعلومات المفصّلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

## التأليف

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ينشئ `plugins init` إضافة أدوات مصغّرة بلغة TypeScript افتراضيًا. الوسيطة
الأولى هي معرّف الإضافة؛ ويضبط `--name` اسم العرض. يستخدم OpenClaw
المعرّف لدليل الإخراج الافتراضي وتسمية الحزمة. تستخدم قوالب الأدوات
`defineToolPlugin` وتنشئ نصوص `package.json` البرمجية `plugin:build` و
`plugin:validate` التي تبني ثم تستدعي `openclaw plugins build`/`validate`.

يستورد `plugins build` نقطة الدخول المبنية، ويقرأ بيانات تعريف أدواتها الثابتة، ويكتب
`openclaw.plugin.json`، ويحافظ على محاذاة `openclaw.extensions` الخاص بـ `package.json`.
يتحقق `plugins validate` من استمرار توافق البيان المنشأ وبيانات تعريف الحزمة
وتصدير نقطة الدخول الحالية. راجع [إضافات الأدوات](/ar/plugins/tool-plugins) للاطلاع على
سير عمل التأليف الكامل.

يكتب القالب مصدر TypeScript، لكنه ينشئ بيانات التعريف من نقطة الدخول المبنية
`./dist/index.js`، ولذلك يعمل سير العمل أيضًا مع CLI المنشور. استخدم
`--entry <path>` عندما لا تكون نقطة الدخول هي نقطة الدخول الافتراضية للحزمة. استخدم
`plugins build --check` في CI لإحداث فشل عندما تكون بيانات التعريف المنشأة قديمة من دون
إعادة كتابة الملفات.

### قالب الموفّر

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

تنشئ قوالب الموفّرين إضافة عامة لموفّر نماذج متوافق مع OpenAI
ومزوّدة بآلية مصادقة بمفتاح API، ونص `npm run validate` برمجي يشغّل
`clawhub package validate`، وبيانات تعريف حزمة ClawHub، وسير عمل GitHub Actions
يُشغَّل يدويًا للنشر الموثوق مستقبلًا عبر GitHub
OIDC. لا تنشئ قوالب الموفّرين Skills ولا تستخدم
`openclaw plugins build`/`validate`؛ فهذه الأوامر مخصّصة لمسار بيانات التعريف
المنشأة في قالب الأدوات.

قبل النشر، استبدل عنوان URL الأساسي النائب لـ API وكتالوج النماذج ومسار الوثائق
ونص بيانات الاعتماد ونص README بتفاصيل حقيقية عن الموفّر. استخدم ملف README
المنشأ للنشر لأول مرة على ClawHub وإعداد الناشر الموثوق.

## التثبيت

```bash
openclaw plugins search "calendar"                      # البحث عن إضافات ClawHub
openclaw plugins install @openclaw/<package>            # الكتالوج الرسمي الموثوق
openclaw plugins install <package>                       # حزمة npm عشوائية
openclaw plugins install clawhub:<package>                # ClawHub فقط
openclaw plugins install npm:<package>                    # npm فقط
openclaw plugins install npm-pack:<path.tgz>               # أرشيف npm-pack محلي
openclaw plugins install git:github.com/<owner>/<repo>     # مستودع git
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # مسار أو أرشيف محلي
openclaw plugins install -l <path>                         # الربط بدلًا من النسخ
openclaw plugins install <plugin>@<marketplace>             # اختصار السوق
openclaw plugins install <plugin> --marketplace <name>      # السوق (صريح)
openclaw plugins install <package> --force                  # تأكيد المصدر / استبدال الموجود
openclaw plugins install <package> --pin                    # تثبيت إصدار npm المحسوم
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

يمكن للمشرفين الذين يختبرون عمليات التثبيت وقت الإعداد تجاوز مصادر تثبيت الإضافات
التلقائية باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت الإضافات](/ar/plugins/install-overrides).

<Warning>
تُثبَّت أسماء الحزم المجرّدة من npm افتراضيًا أثناء الانتقال إلى الإطلاق، ما لم تطابق معرّف إضافة مضمّنة أو رسمية، وعندئذٍ يستخدم OpenClaw تلك النسخة المحلية/الرسمية بدلًا من الاتصال بسجل npm. استخدم `npm:<package>` عندما تريد عمدًا حزمة npm خارجية بدلًا من ذلك. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع عمليات تثبيت الإضافات كما تتعامل مع تشغيل التعليمات البرمجية؛ وفضّل الإصدارات المثبّتة.
</Warning>

<Warning>
تُعد حزم ClawHub وكتالوج OpenClaw المضمّن/الرسمي
مصادر تثبيت موثوقة. يُصدر مصدر جديد عشوائي من npm أو `npm-pack:` أو git أو مسار/أرشيف محلي أو
السوق تحذيرًا ويطلب التأكيد قبل المتابعة. يجب أن تمرّر عمليات التثبيت العشوائية
غير التفاعلية `--force` بعد مراجعة المصدر والثقة به. كما يستبدل الخيار نفسه
هدف تثبيت موجودًا عند الحاجة. لا تتطلب التحديثات العادية لتثبيت
متتبّع بالفعل هذا الخيار. هذا التأكيد منفصل عن
`--acknowledge-clawhub-risk`، الذي لا ينطبق إلا على تحذيرات الثقة الخطرة
لإصدارات ClawHub. لا يتجاوز `--force` الخيار `security.installPolicy` أو فحوصات
أمان التثبيت المتبقية.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم `code-plugin` و
`bundle-plugin` القابلة للتثبيت (وليس Skills؛ استخدم `openclaw skills search` لها).
القيمة الافتراضية لـ `--limit` هي 20، وبحد أقصى 100. ولا يقرأ سوى الكتالوج البعيد: لا
يفحص الحالة المحلية، ولا يعدّل الإعداد، ولا يثبّت الحزم، ولا يحمّل وقت تشغيل
الإضافة. تتضمن النتائج اسم حزمة ClawHub والعائلة والقناة والإصدار
والملخص وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub هو واجهة التوزيع والاكتشاف الأساسية لمعظم الإضافات. يظل npm
مسارًا احتياطيًا ومدعومًا للتثبيت المباشر. تُنشر حزم إضافات
`@openclaw/*` المملوكة لـ OpenClaw على npm مجددًا؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون الإضافات](/ar/plugins/plugin-inventory). تستخدم عمليات التثبيت المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث في قناة الإصدار التجريبي وسم التوزيع `beta` في npm عند توفره،
وتعود إلى `latest` عند عدم توفره. في قناة الاستقرار الممتد، تُحل إضافات npm الرسمية
ذات القصد المجرّد/الافتراضي أو `latest` إلى إصدار النواة المثبّت
نفسه تمامًا. لا تُعاد كتابة التثبيتات الدقيقة والوسوم الصريحة غير `latest` وحزم الجهات الخارجية
والمصادر غير التابعة لـ npm.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعداد وإصلاح الإعداد غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` أحادي، فإن `plugins install/update/enable/disable/uninstall` يكتب مباشرةً إلى ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات ذات التجاوزات الشقيقة بصورة مغلقة بدلًا من تسطيحها. راجع [تضمينات الإعداد](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كان الإعداد غير صالح أثناء التثبيت، يفشل `plugins install` عادةً بصورة مغلقة ويطلب تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الفوري، يفشل إعداد الإضافة غير الصالح بصورة مغلقة مثل أي إعداد آخر غير صالح؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال الإضافة غير الصالح. الاستثناء الوحيد الموثّق وقت التثبيت هو مسار استرداد ضيق لإضافة مضمّنة، وذلك للإضافات التي تشترك صراحةً في `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="تأكيد --force وإعادة التثبيت مقارنةً بالتحديث">
    يؤكد `--force` مصدرًا غير تابع لـ ClawHub من دون مطالبة. ولا يتجاوز `security.installPolicy` أو فحوصات أمان التثبيت المتبقية. عندما تكون الإضافة أو حزمة الخطافات مثبّتة بالفعل، فإنه يعيد أيضًا استخدام الهدف الموجود ويستبدله في مكانه. استخدمه بعد مراجعة مصدر عشوائي من npm أو محلي أو أرشيف أو git أو السوق، أو عند إعادة تثبيت المعرّف نفسه عمدًا. للترقيات الروتينية لإضافة npm متتبّعة بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف إضافة مثبّت بالفعل، يتوقف OpenClaw ويوجّهك إلى `plugins update <id-or-npm-spec>` لإجراء ترقية عادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف. تظل المصادر العشوائية تعرض تحذير المصدر التفاعلي؛ ويجب أن تمرّر عمليات التثبيت غير التفاعلية `--force` بعد المراجعة. لا تحتاج مصادر ClawHub الموثوقة وكتالوج OpenClaw إليه. مع `--link`، يؤكد `--force` المصدر لكنه لا يغيّر وضع تثبيت المسار المرتبط.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على عمليات تثبيت npm فقط ويسجّل `<name>@<version>` الدقيق المحسوم. وهو غير مدعوم مع عمليات تثبيت `git:` (ثبّت المرجع في المواصفة بدلًا من ذلك، مثل `git:github.com/acme/plugin@v1.2.3`) أو مع `--marketplace` (تحتفظ عمليات التثبيت من السوق ببيانات تعريف مصدر السوق بدلًا من مواصفة npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    أصبح `--dangerously-force-unsafe-install` مهملًا ولا ينفّذ الآن أي إجراء. لم يعد OpenClaw يشغّل الحظر المضمّن للتعليمات البرمجية الخطرة وقت التثبيت لعمليات تثبيت الإضافات.

    استخدم سطح `security.installPolicy` المملوك للمشغّل عندما تكون سياسة التثبيت الخاصة بالمضيف مطلوبة. خطافات Plugin ‏`before_install` هي خطافات دورة حياة وقت تشغيل Plugin، وليست حدّ السياسة الأساسي لعمليات تثبيت CLI.

    إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بفحص السجل، فاستخدم خطوات الناشر الواردة في [النشر على ClawHub](/ar/clawhub/publishing). لا يطلب `--dangerously-force-unsafe-install` من ClawHub إعادة فحص Plugin أو إتاحة إصدار محظور للعامة.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    تتحقق عمليات تثبيت ClawHub المجتمعية من سجل الثقة للإصدار المحدد قبل التنزيل. إذا عطّل ClawHub التنزيل للإصدار، أو أبلغ عن نتائج فحص ضارة، أو وضع الإصدار في حالة إشراف مانعة (محجور، ملغى)، فإن OpenClaw يرفضه رفضًا قاطعًا بصرف النظر عن هذه العلامة. أما حالات الفحص المحفوفة بالمخاطر غير المانعة أو حالات الإشراف غير المانعة، فيعرض OpenClaw تفاصيل الثقة ويطلب التأكيد قبل المتابعة.

    استخدم `--acknowledge-clawhub-risk` فقط بعد مراجعة تحذير ClawHub واتخاذ قرار المتابعة دون مطالبة تفاعلية. تحذّر نتائج الفحص المعلّقة أو القديمة (التي لم تصبح نظيفة بعد)، لكنها لا تتطلب إقرارًا. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw فحص ثقة الإصدار هذا بالكامل.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لإظهار الخطافات بعد تصفيتها وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة مع **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تُشغّل عمليات تثبيت التبعيات في مشروع npm مُدار واحد لكل Plugin مع `--ignore-scripts` للأمان، حتى عندما تحتوي صدفتك على إعدادات تثبيت npm عامة. ترث مشاريع npm المُدارة الخاصة بالـ Plugin قيمة npm ‏`overrides` على مستوى حزمة OpenClaw، ولذلك تنطبق قيود أمان المضيف أيضًا على تبعيات Plugin المرفوعة.

    استخدم `npm:<package>` لجعل تحليل npm صريحًا. تُثبّت مواصفات الحزم المجرّدة أيضًا مباشرةً من npm أثناء الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin رسميًا.

    مواصفات `@openclaw/*` الخام التي تطابق Plugins مضمّنة تُحل إلى النسخة المضمّنة المملوكة للصورة قبل الرجوع إلى npm. على سبيل المثال، يستخدم `openclaw plugins install @openclaw/discord@2026.5.20 --pin` Plugin ‏Discord المضمّن من إصدار OpenClaw الحالي بدلًا من إنشاء تجاوز npm مُدار. لفرض استخدام حزمة npm الخارجية، استخدم `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    تظل المواصفات المجرّدة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة في OpenClaw، مثل `2026.5.3-1`، مستقرة لهذا الفحص. إذا حلّ npm أيًا من الصيغتين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب الاشتراك صراحةً باستخدام وسم تمهيدي (`@beta`/`@rc`) أو إصدار تمهيدي دقيق (`@1.2.3-beta.4`).

    بالنسبة إلى عمليات تثبيت npm من دون إصدار دقيق (`npm:<package>` أو `npm:<package>@latest`)، يتحقق OpenClaw من بيانات الحزمة الوصفية التي جرى حلها قبل التثبيت. إذا كانت أحدث حزمة مستقرة تتطلب API أحدث لـ Plugin في OpenClaw أو حدًا أدنى أحدث لإصدار المضيف، يفحص OpenClaw الإصدارات المستقرة الأقدم ويثبّت أحدث إصدار متوافق بدلًا منها. تظل الإصدارات الدقيقة ووسوم dist-tags الصريحة صارمة: يفشل الاختيار غير المتوافق ويطلب ترقية OpenClaw أو اختيار إصدار متوافق.

    إذا طابقت مواصفة تثبيت مجرّدة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm تحمل الاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. الصيغ المدعومة: `git:github.com/owner/repo`، و`git:owner/repo`، و`https://` الكامل، و`ssh://`، و`git://`، و`file://`، وعناوين URL للاستنساخ `git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو تثبيت محدد قبل التثبيت.

    تستنسخ عمليات تثبيت Git المحتوى في دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي، ولذلك تتصرف عملية التحقق من البيان وسياسة تثبيت المشغّل وعمل تثبيت مدير الحزم وسجلات التثبيت كما في عمليات تثبيت npm. تتضمن عمليات تثبيت git المسجلة عنوان URL/المرجع للمصدر، إضافة إلى التثبيت المحدد الذي جرى حله، لكي يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل، مثل أساليب Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فشغّل ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ أما الأرشيفات التي لا تحتوي إلا على `package.json` فتُرفض قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف حزمة tarball ناتجة عن npm-pack وتريد
    مسار مشروع npm المُدار نفسه لكل Plugin والمستخدم في عمليات التثبيت من السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة،
    وسجلات تثبيت npm. تظل مسارات الأرشيف العادية تُثبّت كأرشيفات
    محلية ضمن جذر ملحقات Plugin.

    عمليات التثبيت من سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم عمليات تثبيت ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبّت مواصفات Plugin المجرّدة الصالحة لـ npm من npm افتراضيًا أثناء الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin رسميًا:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل التحليل الخاص بـ npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API المعلن للـ Plugin / الحد الأدنى لـ Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثرًا من نوع ClawPack، ينزّل OpenClaw حزمة npm-pack ذات الإصدار `.tgz`، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبّتها عبر مسار الأرشيف العادي. تظل إصدارات ClawHub الأقدم التي لا تتضمن بيانات ClawPack الوصفية تُثبّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ عمليات التثبيت المسجلة ببيانات مصدر ClawHub الوصفية ونوع الأثر وتكامل npm وقيمة shasum لـ npm واسم حزمة tarball وحقائق ملخص ClawPack لاستخدامها في التحديثات اللاحقة.
تحتفظ عمليات تثبيت ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار لكي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة، مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta`، فتظل مثبتة على ذلك المحدد.

### الصيغة المختصرة للسوق

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي لـ Claude في `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` لتمرير مصدر السوق صراحةً:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="مصادر السوق">
    - اسم سوق معروف لـ Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - صيغة مختصرة لمستودع GitHub، مثل `owner/repo`
    - عنوان URL لمستودع GitHub، مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد الأسواق البعيدة">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تظل إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع، ويرفض مصادر Plugin من نوع HTTP(S) والمسارات المطلقة وgit وGitHub وغيرها من المصادر غير المسارية الواردة في البيانات البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw ‏(`openclaw.plugin.json`)
- حزم متوافقة مع Codex ‏(`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude ‏(`.claude-plugin/plugin.json`، أو تخطيط مكوّنات Claude الافتراضي عند غياب ملف البيان هذا)
- حزم متوافقة مع Cursor ‏(`.cursor-plugin/plugin.json`)

يجب أن تكون عمليات التثبيت المحلية المُدارة أدلة Plugin أو أرشيفات. ملفات Plugin المستقلة `.js`،
و`.mjs`، و`.cjs`، و`.ts` لا ينسخها `plugins install` إلى جذر Plugin
المُدار، ولا تُحمّل بوضعها مباشرةً في
`~/.openclaw/extensions` أو `<workspace>/.openclaw/extensions`؛ إذ تحمّل جذور
الاكتشاف التلقائي هذه أدلة حزم Plugin أو الحزم المتوافقة، وتتخطى
ملفات النصوص البرمجية عالية المستوى باعتبارها أدوات مساعدة محلية. أدرج الملفات المستقلة صراحةً في
`plugins.load.paths` بدلًا من ذلك.

<Note>
تُثبّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق العرض/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الخاصة بالحزم، وSkills أوامر Claude، وقيم Claude الافتراضية `settings.json`، وقيم Claude الافتراضية `.lsp.json` / القيم الافتراضية `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة؛ أما إمكانات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات، لكنها لم تُربط بعد بتنفيذ وقت التشغيل.
</Note>

استخدم `-l`/`--link` للإشارة إلى دليل Plugin محلي دون نسخه (يضيف
إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعم `--link` مع عمليات تثبيت `--marketplace` أو `git:`، كما
يتطلب مسارًا محليًا موجودًا بالفعل. لإنشاء رابط محلي غير تفاعلي،
مرّر `--force` بعد مراجعة المصدر؛ فهو يؤكد المنشأ، لكنه لا
ينسخ الدليل المرتبط أو يستبدله.

<Note>
لا تُستورد Plugins ذات أصل مساحة العمل المكتشفة من جذر ملحقات مساحة العمل
ولا تُنفّذ حتى تُمكّن صراحةً. للتطوير المحلي،
شغّل `openclaw plugins enable <plugin-id>` أو عيّن
`plugins.entries.<plugin-id>.enabled: true`؛ وإذا كان إعدادك يستخدم
`plugins.allow`، فأدرج معرّف Plugin نفسه هناك أيضًا. تنطبق قاعدة الإغلاق عند الفشل هذه
أيضًا عندما يستهدف إعداد القناة صراحةً Plugin ذا أصل مساحة عمل بغرض
التحميل للإعداد فقط، ولذلك لن تعمل شيفرة إعداد Plugin القناة المحلية ما دام
Plugin مساحة العمل هذا معطّلًا أو مستبعدًا من قائمة السماح. تتبع عمليات التثبيت المرتبطة
وإدخالات `plugins.load.paths` الصريحة السياسة العادية لأصل Plugin
الذي جرى حله. راجع
[ضبط سياسة Plugin](/ar/tools/plugin#configure-plugin-policy)
و[مرجع الإعدادات](/ar/gateway/configuration-reference#plugins).

استخدم `--pin` في عمليات تثبيت npm لحفظ المواصفة الدقيقة التي جرى حلها (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

## العرض

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  اعرض Plugins الممكّنة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  انتقل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات التنسيق/المصدر/الأصل/الإصدار/التنشيط الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  قائمة مخزون قابلة للقراءة آليًا، إضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` أولًا سجل Plugin المحلي الدائم، مع خيار احتياطي مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. وهو مفيد للتحقق مما إذا كان Plugin مثبتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير شيفرة Plugin أو حالة تفعيله أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقّع تشغيل شيفرة `register(api)` الجديدة أو خطافاتها. في عمليات النشر البعيدة/ضمن الحاويات، تحقّق من أنك تعيد تشغيل عملية `openclaw gateway run` الفرعية الفعلية، لا مجرد عملية مغلِّفة.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
و`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء الحزم
هذه موجودة على طول مسار بحث Node المعتاد `node_modules` الخاص بـPlugin؛ ولا
يستورد شيفرة وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح
التبعيات المفقودة.
</Note>

إذا سجّلت عملية بدء التشغيل `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
فشغّل `openclaw plugins list --enabled --verbose` أو
`openclaw plugins inspect <id>` باستخدام معرّف Plugin مدرج لتأكيد معرّفات Plugin،
وانسخ المعرّفات الموثوقة إلى `plugins.allow` في `openclaw.json`. عندما يستطيع
التحذير سرد كل Plugin مكتشف، فإنه يطبع مقتطف
`plugins.allow` جاهزًا للصق يتضمن تلك المعرّفات بالفعل. إذا حُمّل Plugin
من دون مصدر مثبت للتثبيت/مسار التحميل، فافحص معرّف Plugin ذلك، ثم إما ثبّت
المعرّف الموثوق في `plugins.allow` أو أعد تثبيت Plugin من مصدر موثوق
حتى يسجّل OpenClaw مصدر التثبيت المثبت.

للعمل على Plugin مضمّن داخل صورة Docker محزّمة، اربط دليل مصدر Plugin
فوق مسار المصدر المحزّم المطابق، مثل
`/app/extensions/synology-chat`. يكتشف OpenClaw تراكب المصدر المركّب هذا
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ عاديًا
فيبقى غير نشط، لذلك تظل عمليات التثبيت المحزّمة العادية تستخدم ملفات dist المترجمة.

لتصحيح أخطاء خطافات وقت التشغيل:

- `openclaw plugins inspect <id> --runtime --json` يعرض الخطافات المسجّلة والتشخيصات من تمريرة فحص محمّلة بالوحدة. لا يثبّت فحص وقت التشغيل التبعيات مطلقًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل والمفقودة التي يشير إليها الإعداد.
- `openclaw gateway status --deep --require-rpc` يؤكد عنوان URL/الملف الشخصي القابل للوصول لـGateway، وتلميحات الخدمة/العملية، ومسار الإعداد، وسلامة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`) قيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### فهرس Plugins

البيانات الوصفية لتثبيت Plugin هي حالة تديرها الآلة، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث في قاعدة بيانات حالة SQLite المشتركة ضمن دليل حالة OpenClaw النشط. يخزّن صف `installed_plugin_index` بيانات وصفية دائمة لـ`installRecords`، بما في ذلك سجلات بيانات Plugin التالفة أو المفقودة، بالإضافة إلى ذاكرة مؤقتة لسجل بارد مشتقة من البيان تستخدمها `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugins البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعداد، تتعامل معها قراءات وقت التشغيل كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل عمليات الكتابة الصريحة لـPlugin و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugins وتزيل مفتاح الإعداد عندما يُسمح بالكتابة إلى الإعداد؛ وإذا فشلت أي من عمليتي الكتابة، يُحتفظ بسجلات الإعداد كي لا تضيع بيانات التثبيت الوصفية.

## إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` وفهرس Plugins الدائم وإدخالات قوائم السماح/المنع الخاصة بـPlugin وإدخالات `plugins.load.paths` المرتبطة عند انطباق ذلك. ما لم تُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار والمتتبّع، ولكن فقط عندما يُحلّ إلى موقع داخل جذر امتدادات Plugins في OpenClaw. إذا كان Plugin يملك حاليًا خانة `memory` أو `contextEngine`، فتُعاد تلك الخانة إلى قيمتها الافتراضية (`memory-core` للذاكرة، و`legacy` لمحرك السياق).

يطبع `uninstall` معاينة لما سيُزال، ثم يطلب `Uninstall plugin "<id>"?` قبل إجراء التغييرات. مرّر `--force` لتجاوز مطالبة التأكيد (وهو مفيد للنصوص البرمجية وعمليات التشغيل غير التفاعلية)؛ ومن دونه، يتطلب إلغاء التثبيت طرفية TTY تفاعلية. يطبع `--dry-run` المعاينة نفسها ويخرج من دون مطالبة أو تغيير أي شيء.

<Note>
يُدعم `--keep-config` كاسم بديل مهمل لـ`--keep-files`.
</Note>

## التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على عمليات تثبيت Plugins المتتبّعة في فهرس Plugins المُدار وعمليات تثبيت حزم الخطافات المتتبّعة في `hooks.internal.installs`. وهي تعيد استخدام المصدر الذي اختاره المستخدم بالفعل عند تثبيت Plugin، ولذلك لا تتطلب إقرارًا ثانيًا بالمصدر.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقارنةً بمواصفة npm">
    عندما تمرّر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجّلة لذلك Plugin. وهذا يعني أن وسوم التوزيع المخزّنة سابقًا، مثل `@beta`، والإصدارات الدقيقة المثبّتة يظل استخدامها مستمرًا في عمليات تشغيل `update <id>` اللاحقة.

    أثناء `update <id> --dry-run`، تظل عمليات تثبيت npm المثبّتة على إصدار دقيق كما هي. وإذا استطاع OpenClaw أيضًا حل خط الحزمة الافتراضي في السجل وكان ذلك الخط الافتراضي أحدث من الإصدار المثبّت المُثبَّت، فإن التشغيل التجريبي يبلّغ عن التثبيت ويطبع أمر تحديث الحزمة الصريح `@latest` لاتباع الخط الافتراضي للسجل.

    تختلف قاعدة التحديث المستهدف هذه عن مسار الصيانة المجمع `openclaw plugins update --all`. لا تزال التحديثات المجمعة تحترم مواصفات التثبيت المتتبّعة العادية، لكن يمكن لسجلات Plugins الرسمية الموثوقة من OpenClaw أن تتزامن مع هدف الكتالوج الرسمي الحالي بدلًا من البقاء على حزمة رسمية دقيقة قديمة. استخدم `update <id>` المستهدف عندما تريد عمدًا إبقاء مواصفة رسمية دقيقة أو موسومة من دون تغيير.

    بالنسبة إلى عمليات تثبيت npm، يمكنك أيضًا تمرير مواصفة صريحة لحزمة npm تتضمن وسم توزيع أو إصدارًا دقيقًا. يحل OpenClaw اسم الحزمة هذا إلى سجل Plugin المتتبّع، ويحدّث Plugin المثبّت ذلك، ويسجّل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm من دون إصدار أو وسم أيضًا إلى حله إلى سجل Plugin المتتبّع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة Beta">
    يعيد `openclaw plugins update <id-or-npm-spec>` المستهدف استخدام مواصفة Plugin المتتبّعة ما لم تمرّر مواصفة جديدة. يستخدم `openclaw plugins update --all` المجمع قيمة `update.channel` المضبوطة عند مزامنة سجلات Plugins الرسمية الموثوقة مع هدف الكتالوج الرسمي، بحيث يمكن لعمليات تثبيت قناة Beta البقاء على خط إصدار Beta بدلًا من تسويتها ضمنيًا إلى stable/latest.

    يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة Beta، تحاول سجلات Plugins الافتراضية في npm وClawHub استخدام `@beta` أولًا. وتعود إلى المواصفة الافتراضية/latest المسجّلة إذا لم يوجد إصدار Beta من Plugin؛ كما تعود Plugins الخاصة بـnpm عندما توجد حزمة Beta لكنها تفشل في التحقق من صحة التثبيت. يُبلّغ عن هذا الرجوع كتحذير ولا يؤدي إلى فشل تحديث النواة. تظل الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدِّد في التحديثات المستهدفة.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف التكامل">
    قبل تحديث npm فعلي، يتحقق OpenClaw من إصدار الحزمة المثبّتة مقارنةً بالبيانات الوصفية لسجل npm. إذا كان الإصدار المثبّت وهوية الأثر المسجّلة يطابقان الهدف المحلول بالفعل، فيُتخطى التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عند وجود تجزئة تكامل مخزّنة وتغيّر تجزئة الأثر المُجلَب، يتعامل OpenClaw مع ذلك بوصفه انحرافًا في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئتين المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث غير التفاعلية بصورة مغلقة ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يُقبل `--dangerously-force-unsafe-install` أيضًا في `plugins update` لأغراض التوافق، لكنه مهمل ولم يعد يغيّر سلوك تحديث Plugin. لا يزال بإمكان `security.installPolicy` الخاص بالمشغّل حظر التحديثات؛ ولا تنطبق خطافات `before_install` الخاصة بـPlugin إلا في العمليات التي تُحمّل فيها خطافات Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk عند التحديث">
    تُجري تحديثات Plugins المجتمعية المدعومة من ClawHub فحص الثقة نفسه للإصدار الدقيق كما في عمليات التثبيت قبل تنزيل الحزمة البديلة. استخدم `--acknowledge-clawhub-risk` للأتمتة المُراجعة التي ينبغي أن تتابع عندما يتضمن إصدار ClawHub المحدد تحذير ثقة ينطوي على مخاطر. تتجاوز حزم ClawHub الرسمية ومصادر Plugins المضمّنة في OpenClaw مطالبة الثقة بالإصدار هذه.
  </Accordion>
</AccordionGroup>

## الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

يعرض الفحص الهوية وحالة التحميل والمصدر وإمكانات البيان وأعلام السياسة والتشخيصات وبيانات التثبيت الوصفية وإمكانات الحزمة وأي دعم مكتشف لخوادم MCP أو LSP، من دون استيراد وقت تشغيل Plugin افتراضيًا. يتضمن إخراج JSON عقود بيان Plugin، مثل `contracts.agentToolResultMiddleware` و`contracts.trustedToolPolicies`، بحيث يمكن للمشغّلين تدقيق إعلانات الأسطح الموثوقة قبل تفعيل Plugin أو إعادة تشغيله. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرائق Gateway ومسارات HTTP المسجّلة. يبلّغ فحص وقت التشغيل مباشرةً عن تبعيات Plugin المفقودة؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبّت أوامر CLI المملوكة لـPlugin عادةً كمجموعات أوامر جذرية `openclaw`، لكن يمكن لـPlugins أيضًا تسجيل أوامر متداخلة ضمن أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ فعلى سبيل المثال، يمكن التحقق من Plugin يسجّل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin بحسب ما يسجّله فعليًا في وقت التشغيل:

| الشكل               | المعنى                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | نوع إمكانات واحد بالضبط (مثل Plugin خاص بموفّر فقط)         |
| `hybrid-capability` | أكثر من نوع إمكانات واحد (مثل النص + الكلام + الصور)       |
| `hook-only`         | خطافات فقط، بلا إمكانات أو أدوات أو أوامر أو خدمات أو مسارات |
| `non-capability`    | أدوات/أوامر/خدمات، لكن بلا إمكانات                       |

راجع [أشكال Plugins](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج الإمكانات.

<Note>
يُخرج العلم `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للنصوص البرمجية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل وأنواع الإمكانات وإشعارات التوافق وإمكانات الحزمة وملخص الخطافات. يُعد `info` اسمًا بديلًا لـ`inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` يعرض أخطاء تحميل الـ plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق، ومراجع إعدادات الـ plugin القديمة مثل خانات الـ plugin المفقودة. عندما تكون شجرة التثبيت وإعدادات الـ plugin سليمتين، فإنه يطبع `No plugin issues detected.` وإذا بقيت إعدادات قديمة مع سلامة شجرة التثبيت بخلاف ذلك، يوضّح الملخص ذلك بدلًا من الإيحاء بأن جميع الـ plugins سليمة تمامًا.

إذا كان plugin مُعَدّ موجودًا على القرص، لكن تمنعه فحوصات أمان المسار الخاصة بأداة التحميل، يُبقي التحقق من صحة الإعدادات مُدخل الـ plugin ويُبلغ عنه بصفته `present but blocked`. أصلح تشخيص الـ plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة المتاحة للجميع، بدلًا من إزالة إعدادات `plugins.entries.<id>` أو `plugins.allow`.

عند حدوث إخفاقات في بنية الوحدة مثل غياب تصديرات `register`/`activate`، أعد التشغيل باستخدام `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص موجز لبنية التصدير في مخرجات التشخيص.

## السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل الـ plugins المحلي هو نموذج القراءة الباردة الدائم في OpenClaw لهوية الـ plugins المثبتة وحالة تمكينها والبيانات الوصفية لمصدرها وملكية مساهماتها. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد الـ plugins قراءته من دون استيراد وحدات وقت تشغيل الـ plugins.

استخدم `plugins registry` للتحقق مما إذا كان السجل الدائم موجودًا أو محدثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس الـ plugins الدائم، وسياسة الإعدادات، والبيانات الوصفية للبيان/الحزمة. هذا مسار إصلاح، وليس مسار تنشيط في وقت التشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستردة، ضمن مشروع npm مُدار لأحد الـ plugins أو جذر npm المُدار المسطّح القديم، plugin مضمّنًا، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل لكي يتحقق بدء التشغيل استنادًا إلى البيان المضمّن. يعيد doctor أيضًا ربط حزمة المضيف `openclaw` داخل plugins ‏npm المُدارة التي تعلن `peerDependencies.openclaw`، لكي تعمل استيرادات وقت التشغيل المحلية للحزمة، مثل `openclaw/plugin-sdk/*`، بعد التحديثات أو إصلاحات npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل للاستخدام الاضطراري عند إخفاق قراءة السجل. يُفضّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ ولا يُستخدم الخيار الاحتياطي لمتغير البيئة إلا لاستعادة بدء التشغيل في حالات الطوارئ أثناء نشر الترحيل.
</Warning>

## السوق

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

يسرد `plugins marketplace entries` المُدخلات من موجز سوق OpenClaw المُعَد. يحاول افتراضيًا استخدام الموجز المستضاف، ثم يرجع إلى أحدث لقطة مقبولة أو إلى البيانات المضمّنة عند الإخفاق. استخدم `--feed-profile <name>` لقراءة ملف تعريف مُعَد بعينه، و`--feed-url <url>` لقراءة عنوان URL صريح لموجز مستضاف، و`--offline` لقراءة أحدث لقطة مقبولة من دون جلب الموجز.

يحدّث `plugins marketplace refresh` لقطة الموجز المستضاف المُعَد ويُبلغ عما إذا كان OpenClaw قد قبل البيانات المستضافة، أو لقطة مستضافة، أو بيانات احتياطية مضمّنة. استخدم `--expected-sha256` عندما يحتاج المستدعي إلى إخفاق الأمر ما لم تتطابق حمولة مستضافة حديثة مع مجموع اختباري مثبت.

يقبل `list` الخاص بالسوق مسار سوق محليًا، أو مسار `marketplace.json`، أو صيغة GitHub مختصرة مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر التي جرى حلها، إضافةً إلى بيان السوق المحلّل ومُدخلات الـ plugins.

يحمّل تحديث السوق موجز سوق OpenClaw مستضافًا ويحفظ الاستجابة
المتحقق من صحتها كلقطة محلية للموجز المستضاف. من دون خيارات، يستخدم
ملف تعريف الموجز الافتراضي المُعَد. استخدم `--feed-profile <name>` لتحديث
ملف تعريف مُعَد بعينه، و`--feed-url <url>` لتحديث عنوان URL صريح لموجز
مستضاف، و`--expected-sha256 <sha256>` لاشتراط تطابق المجموع الاختباري للحمولة
(`sha256:<hex>` أو ملخص سداسي عشري مجرد مكوّن من 64 حرفًا)، و`--json` للحصول على
مخرجات قابلة للقراءة آليًا. يجب ألا تتضمن عناوين URL الصريحة للموجز المستضاف
بيانات اعتماد أو سلاسل استعلام أو أجزاء. يمكن لعمليات التحديث غير المثبتة الإبلاغ عن
نتيجة لقطة مستضافة أو نتيجة احتياطية مضمّنة من دون إخفاق الأمر. أما عمليات
التحديث المثبتة فتفشل ما لم تقبل حمولة مستضافة حديثة، وتفشل عمليات التحديث
المستضافة الناجحة إذا تعذّر على OpenClaw حفظ اللقطة المتحقق من صحتها.

## ذو صلة

- [إنشاء الـ plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/clawhub)

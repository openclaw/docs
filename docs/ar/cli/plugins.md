---
read_when:
    - تريد تثبيت Plugins لـ Gateway أو حِزم متوافقة أو إدارتها
    - تريد إنشاء هيكل أولي لـ Plugin أداة بسيط أو التحقق من صحته
    - تريد تصحيح أخطاء فشل تحميل الـ Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (التهيئة، والبناء، والتحقق، والعرض، والتثبيت، والسوق، وإلغاء التثبيت، والتمكين/التعطيل، والتشخيص)
title: الإضافات
x-i18n:
    generated_at: "2026-07-12T05:42:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

أدِر Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف أخطائها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة على التثبيت والعرض والتحديث وإلغاء التثبيت والنشر.
  </Card>
  <Card title="حزم Plugins" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تعزيز أمان عمليات تثبيت Plugins.
  </Card>
</CardGroup>

## الأوامر

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # alias for inspect
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
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبّع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix‏ (`OPENCLAW_NIX_MODE=1`)، يكون `openclaw.json` غير قابل للتعديل. ترفض جميع أوامر `install` و`update` و`uninstall` و`enable` و`disable` التشغيل. عدّل بدلًا من ذلك مصدر Nix لهذا التثبيت (`programs.openclaw.config` أو `instances.<name>.config` في nix-openclaw)، ثم أعد البناء. راجع [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الذي يضع الوكيل أولًا.
</Note>

<Note>
تُشحن Plugins المضمّنة مع OpenClaw. يُمكَّن بعضها افتراضيًا (مثل موفّري النماذج المضمّنين، وموفّري الكلام المضمّنين، وPlugin المتصفح المضمّن)، بينما يتطلب بعضها الآخر تشغيل `plugins enable`.

تُشحن Plugins الأصلية في OpenClaw مع `openclaw.plugin.json` الذي يتضمن مخطط JSON مضمّنًا (`configSchema`، حتى إذا كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات التفصيلية النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

## التأليف

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ينشئ `plugins init` افتراضيًا Plugin أدوات بسيطًا بلغة TypeScript. الوسيطة
الأولى هي معرّف Plugin، ويضبط `--name` اسم العرض. يستخدم OpenClaw
المعرّف لدليل الإخراج الافتراضي وتسمية الحزمة. تستخدم قوالب الأدوات
`defineToolPlugin` وتنشئ النصين البرمجيين `plugin:build` و
`plugin:validate` في `package.json`، حيث ينفّذان البناء ثم يستدعيان
`openclaw plugins build`/`validate`.

يستورد `plugins build` نقطة الدخول المبنية، ويقرأ بياناتها الوصفية الثابتة للأدوات، ويكتب
`openclaw.plugin.json`، ويحافظ على توافق `openclaw.extensions` في `package.json`.
يتحقق `plugins validate` من استمرار توافق البيان المنشأ، والبيانات الوصفية للحزمة،
وتصدير نقطة الدخول الحالية. راجع [Plugins الأدوات](/ar/plugins/tool-plugins) للاطلاع على
سير عمل التأليف الكامل.

يكتب القالب مصدر TypeScript، لكنه ينشئ البيانات الوصفية من نقطة الدخول المبنية
`./dist/index.js`، ولذلك يعمل سير العمل أيضًا مع CLI المنشور. استخدم
`--entry <path>` عندما لا تكون نقطة الدخول هي نقطة الدخول الافتراضية للحزمة. استخدم
`plugins build --check` في CI لإخفاق العملية عندما تصبح البيانات الوصفية المنشأة قديمة من دون
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

تنشئ قوالب الموفّرين Plugin عامًا لموفّر نماذج متوافق مع OpenAI،
مع تجهيز مصادقة مفتاح API، ونص برمجي `npm run validate` يشغّل
`clawhub package validate`، وبيانات وصفية لحزمة ClawHub، وسير عمل
GitHub Actions يُشغَّل يدويًا للنشر الموثوق مستقبلًا عبر GitHub
OIDC. لا تنشئ قوالب الموفّرين Skills ولا تستخدم
`openclaw plugins build`/`validate`؛ فهذه الأوامر مخصصة لمسار البيانات
الوصفية المنشأة في قالب الأدوات.

قبل النشر، استبدل عنوان URL الأساسي النائب لـ API، وفهرس النماذج، ومسار
الوثائق، ونص بيانات الاعتماد، ومحتوى README بتفاصيل الموفّر الحقيقية. استخدم
README المنشأ للنشر الأول على ClawHub وإعداد الناشر الموثوق.

## التثبيت

```bash
openclaw plugins search "calendar"                      # search ClawHub plugins
openclaw plugins install <package>                       # source auto-detection
openclaw plugins install clawhub:<package>                # ClawHub only
openclaw plugins install npm:<package>                    # npm only
openclaw plugins install npm-pack:<path.tgz>               # local npm-pack tarball
openclaw plugins install git:github.com/<owner>/<repo>     # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # local path or archive
openclaw plugins install -l <path>                         # link instead of copy
openclaw plugins install <plugin>@<marketplace>             # marketplace shorthand
openclaw plugins install <plugin> --marketplace <name>      # marketplace (explicit)
openclaw plugins install <package> --force                  # overwrite existing install
openclaw plugins install <package> --pin                    # pin resolved npm version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

يمكن للمشرفين الذين يختبرون عمليات التثبيت أثناء الإعداد تجاوز مصادر تثبيت
Plugins التلقائية باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبَّت أسماء الحزم المجرّدة من npm افتراضيًا خلال الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin مضمّنًا أو رسميًا؛ وفي هذه الحالة يستخدم OpenClaw النسخة المحلية/الرسمية بدلًا من الوصول إلى سجل npm. استخدم `npm:<package>` عندما تريد عمدًا حزمة npm خارجية بدلًا من ذلك. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع عمليات تثبيت Plugins كما تتعامل مع تشغيل التعليمات البرمجية، وفضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم `code-plugin` و
`bundle-plugin` القابلة للتثبيت (وليس Skills؛ استخدم `openclaw skills search` لها).
القيمة الافتراضية لـ `--limit` هي 20، وبحد أقصى 100. يقرأ الأمر الفهرس البعيد فقط، من دون
فحص الحالة المحلية، أو تعديل الإعدادات، أو تثبيت الحزم، أو تحميل وقت تشغيل
Plugin. تتضمن النتائج اسم حزمة ClawHub، والعائلة، والقناة، والإصدار،
والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

<Note>
يمثّل ClawHub واجهة التوزيع والاكتشاف الأساسية لمعظم Plugins. يظل npm
مسارًا احتياطيًا ومدعومًا للتثبيت المباشر. تُنشر حزم Plugins
`@openclaw/*` المملوكة لـ OpenClaw على npm مجددًا؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[قائمة Plugins](/ar/plugins/plugin-inventory). تستخدم عمليات التثبيت المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث على قناة الإصدار التجريبي وسم التوزيع `beta` في npm عند توفره،
مع الرجوع إلى `latest` عند عدم توفره. على قناة الاستقرار الممتد، تُحل Plugins الرسمية في npm
ذات القصد المجرّد/الافتراضي أو `latest` إلى الإصدار الأساسي المثبّت
نفسه تمامًا. لا تُعاد كتابة التثبيتات الدقيقة والوسوم الصريحة غير `latest`، وحزم الجهات الخارجية،
والمصادر غير التابعة لـ npm.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بتضمين `$include` من ملف واحد، فإن `plugins install/update/enable/disable/uninstall` يكتب مباشرةً إلى ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بصورة مغلقة بدلًا من تسطيحها. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للاطلاع على البُنى المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بصورة مغلقة ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الفوري، تفشل إعدادات Plugin غير الصالحة بصورة مغلقة مثل أي إعدادات أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثّق في وقت التثبيت هو مسار استرداد محدود لـ Plugin مضمّن يختار صراحةً استخدام `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="استخدام --force وإعادة التثبيت مقارنةً بالتحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة بالفعل في موضعها. استخدمه عند إعادة تثبيت المعرّف نفسه عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. للترقيات الاعتيادية لـ Plugin في npm متعقّب بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، يتوقف OpenClaw ويوجّهك إلى `plugins update <id-or-npm-spec>` لإجراء ترقية عادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف. لا يُدعم `--force` مع `--link`.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على عمليات تثبيت npm فقط ويسجّل القيمة الدقيقة المحلولة `<name>@<version>`. ولا يُدعم مع عمليات تثبيت `git:` (ثبّت المرجع في المواصفة بدلًا من ذلك، مثل `git:github.com/acme/plugin@v1.2.3`) أو مع `--marketplace` (تحتفظ عمليات تثبيت السوق ببيانات مصدر السوق الوصفية بدلًا من مواصفة npm).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    الخيار `--dangerously-force-unsafe-install` مهمل، ولا ينفّذ الآن أي إجراء. لم يعد OpenClaw يشغّل حظرًا مضمّنًا للتعليمات البرمجية الخطرة وقت التثبيت عند تثبيت Plugins.

    استخدم واجهة `security.installPolicy` التي يملكها المشغّل عندما تكون هناك حاجة إلى سياسة تثبيت خاصة بالمضيف. خطافات `before_install` الخاصة بـ Plugin هي خطافات دورة حياة وقت تشغيل Plugin، وليست حد السياسة الأساسي لعمليات تثبيت CLI.

    إذا كانت Plugin نشرتها على ClawHub مخفية أو محظورة نتيجة فحص السجل، فاستخدم خطوات الناشر في [النشر على ClawHub](/ar/clawhub/publishing). لا يطلب `--dangerously-force-unsafe-install` من ClawHub إعادة فحص Plugin أو جعل إصدار محظور متاحًا للعامة.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    تتحقق عمليات التثبيت المجتمعية من ClawHub من سجل الثقة للإصدار المحدد قبل تنزيله. إذا عطّل ClawHub تنزيل الإصدار، أو أبلغ عن نتائج فحص ضارة، أو وضع الإصدار في حالة إشراف حاجبة (معزول أو مسحوب)، يرفضه OpenClaw رفضًا قاطعًا بصرف النظر عن هذا الخيار. بالنسبة إلى حالات الفحص الخطرة غير الحاجبة أو حالات الإشراف غير الحاجبة، يعرض OpenClaw تفاصيل الثقة ويطلب التأكيد قبل المتابعة.

    استخدم `--acknowledge-clawhub-risk` فقط بعد مراجعة تحذير ClawHub واتخاذ قرار المتابعة من دون مطالبة تفاعلية. تؤدي نتائج الفحص المعلّقة أو القديمة (التي لم تصبح سليمة بعد) إلى عرض تحذير، لكنها لا تتطلب إقرارًا. تتجاوز حزم ClawHub الرسمية ومصادر Plugins المضمّنة في OpenClaw فحص ثقة الإصدار هذا بالكامل.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يمثّل `plugins install` أيضًا واجهة تثبيت حزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لإظهار الخطافات بعد تصفيتها وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm **مقتصرة على السجل** (اسم الحزمة مع **إصدار دقيق** اختياري أو **dist-tag** اختياري). تُرفض مواصفات Git/URL/file ونطاقات semver. تُنفَّذ عمليات تثبيت التبعيات في مشروع npm مُدار واحد لكل Plugin باستخدام `--ignore-scripts` للأمان، حتى عندما تتضمن الصدفة إعدادات تثبيت npm عامة. ترث مشاريع npm المُدارة للـ Plugin إعدادات npm `overrides` على مستوى الحزمة في OpenClaw، لذلك تنطبق تثبيتات الأمان الخاصة بالمضيف أيضًا على تبعيات الـ Plugin المرفوعة.

    استخدم `npm:<package>` لجعل التحليل عبر npm صريحًا. تُثبَّت أيضًا مواصفات الحزم المجرّدة مباشرةً من npm أثناء الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin رسميًا.

    تُحل مواصفات `@openclaw/*` الخام التي تطابق Plugins المضمّنة إلى النسخة المضمّنة المملوكة للصورة قبل الرجوع إلى npm. على سبيل المثال، يستخدم `openclaw plugins install @openclaw/discord@2026.5.20 --pin`‏ Plugin الخاص بـ Discord والمضمّن في إصدار OpenClaw الحالي بدلًا من إنشاء تجاوز npm مُدار. لفرض استخدام حزمة npm الخارجية، استخدم `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    تبقى المواصفات المجرّدة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة في OpenClaw، مثل `2026.5.3-1`، مستقرةً لهذا الفحص. إذا حلّ npm أيًا من الصيغتين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم تمهيدي (`@beta`/`@rc`) أو إصدار تمهيدي دقيق (`@1.2.3-beta.4`).

    بالنسبة إلى عمليات تثبيت npm التي لا تتضمن إصدارًا دقيقًا (`npm:<package>` أو `npm:<package>@latest`)، يفحص OpenClaw بيانات الحزمة الوصفية التي تم حلها قبل التثبيت. إذا كانت أحدث حزمة مستقرة تتطلب API أحدث للـ Plugin في OpenClaw أو حدًا أدنى أحدث لإصدار المضيف، يفحص OpenClaw الإصدارات المستقرة الأقدم ويثبّت أحدث إصدار متوافق بدلًا منها. تظل الإصدارات الدقيقة ووسوم dist-tags الصريحة صارمة: يفشل الاختيار غير المتوافق ويطلب منك ترقية OpenClaw أو اختيار إصدار متوافق.

    إذا طابقت مواصفة تثبيت مجرّدة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm تحمل الاسم نفسه، استخدم مواصفة صريحة ذات نطاق (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. الصيغ المدعومة: `git:github.com/owner/repo` و`git:owner/repo` وعناوين الاستنساخ الكاملة من نوع `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو التزام قبل التثبيت.

    تستنسخ عمليات تثبيت Git المستودع إلى دليل مؤقت، وتستخرج المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل الـ Plugin المعتاد، وبذلك تعمل عملية التحقق من البيان وسياسة تثبيت المشغّل وأعمال تثبيت مدير الحزم وسجلات التثبيت كما في عمليات تثبيت npm. تتضمن عمليات تثبيت git المسجّلة عنوان URL/المرجع للمصدر بالإضافة إلى الالتزام الذي تم حله، لكي يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل، مثل أساليب Gateway وأوامر CLI. إذا سجّل الـ Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذر لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر الـ Plugin المستخرج؛ وتُرفض الأرشيفات التي لا تحتوي إلا على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف أرشيف tarball من npm-pack وتريد
    مسار مشروع npm المُدار نفسه لكل Plugin والمستخدم في عمليات التثبيت من السجل،
    بما في ذلك التحقق من `package-lock.json` وفحص التبعيات المرفوعة
    وسجلات تثبيت npm. تظل مسارات الأرشيفات العادية تُثبَّت كأرشيفات
    محلية ضمن جذر امتدادات الـ Plugin.

    عمليات التثبيت من سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم عمليات التثبيت من ClawHub محدِّدًا صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات الـ Plugin المجرّدة والصالحة لـ npm من npm افتراضيًا أثناء الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin رسميًا:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل التحليل عبر npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يفحص OpenClaw توافق API المعلن للـ Plugin / الحد الأدنى من Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أداة ClawPack، ينزّل OpenClaw ملف npm-pack بصيغة `.tgz` ذي الإصدار المحدد، ويتحقق من ترويسة ملخص ClawHub وملخص الأداة، ثم يثبّته عبر مسار الأرشيف المعتاد. تظل إصدارات ClawHub الأقدم التي لا تتضمن بيانات ClawPack الوصفية تُثبَّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ عمليات التثبيت المسجّلة ببيانات مصدر ClawHub الوصفية ونوع الأداة وتكامل npm ومجموع npm الاختباري واسم ملف tarball وحقائق ملخص ClawPack لاستخدامها في التحديثات اللاحقة.
تحتفظ عمليات تثبيت ClawHub غير محددة الإصدار بمواصفة مسجّلة غير محددة الإصدار، لكي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ بينما تظل محددات الإصدار أو الوسم الصريحة، مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta`، مثبتة على ذلك المحدد.

### الصيغة المختصرة للسوق

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة سجل Claude المحلية المؤقتة في `~/.claude/plugins/known_marketplaces.json`:

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
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - صيغة مختصرة لمستودع GitHub، مثل `owner/repo`
    - عنوان URL لمستودع GitHub، مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد الأسواق البعيدة">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تظل إدخالات الـ Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع، ويرفض مصادر الـ Plugin من نوع HTTP(S) والمسارات المطلقة وgit وGitHub وغيرها من المصادر غير المسارية الواردة في البيانات البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins الأصلية لـ OpenClaw‏ (`openclaw.plugin.json`)
- الحزم المتوافقة مع Codex‏ (`.codex-plugin/plugin.json`)
- الحزم المتوافقة مع Claude‏ (`.claude-plugin/plugin.json`، أو تخطيط مكونات Claude الافتراضي عند غياب ملف البيان هذا)
- الحزم المتوافقة مع Cursor‏ (`.cursor-plugin/plugin.json`)

يجب أن تكون عمليات التثبيت المحلية المُدارة أدلة Plugins أو أرشيفات. لا تُنسخ ملفات الـ Plugin المستقلة
من نوع `.js` و`.mjs` و`.cjs` و`.ts` إلى جذر الـ Plugin المُدار بواسطة `plugins install`،
كما لا تُحمَّل بوضعها مباشرةً في
`~/.openclaw/extensions` أو `<workspace>/.openclaw/extensions`؛ إذ تحمّل جذور
الاكتشاف التلقائي هذه أدلة حزم الـ Plugin أو الحزم المتوافقة، وتتخطى
ملفات البرامج النصية في المستوى الأعلى باعتبارها أدوات مساعدة محلية. أدرج الملفات المستقلة صراحةً في
`plugins.load.paths` بدلًا من ذلك.

<Note>
تُثبَّت الحزم المتوافقة في جذر الـ Plugin المعتاد وتشارك في مسار العرض/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الخاصة بالحزم، وSkills الأوامر في Claude، والقيم الافتراضية في `settings.json` لـ Claude، والقيم الافتراضية في `.lsp.json` لـ Claude /‏ `lspServers` المعلنة في البيان، وSkills الأوامر في Cursor، وأدلة الخطافات المتوافقة مع Codex؛ وتظهر إمكانات الحزم المكتشفة الأخرى في التشخيصات/المعلومات، لكنها ليست موصولة بعد بتنفيذ وقت التشغيل.
</Note>

استخدم `-l`/`--link` للإشارة إلى دليل Plugin محلي دون نسخه (يضيفه
إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

لا يُدعم `--link` مع `--force` (تشير Plugins المرتبطة إلى مسار
المصدر مباشرةً، لذلك لا يوجد ما يمكن استبداله في موضعه)، أو `--marketplace`، أو
عمليات تثبيت `git:`، ويتطلب مسارًا محليًا موجودًا بالفعل.

<Note>
لا تُستورد Plugins الناشئة من مساحة العمل والمكتشفة من جذر امتدادات مساحة العمل
ولا تُنفّذ حتى يتم تمكينها صراحةً. للتطوير المحلي،
نفّذ `openclaw plugins enable <plugin-id>` أو عيّن
`plugins.entries.<plugin-id>.enabled: true`؛ وإذا كان إعدادك يستخدم
`plugins.allow`، فأدرج معرّف الـ Plugin نفسه فيها أيضًا. تنطبق قاعدة الإغلاق الآمن هذه
أيضًا عندما يستهدف إعداد القناة صراحةً Plugin ناشئًا من مساحة العمل
للتحميل الخاص بالإعداد فقط، ولذلك لن تُنفّذ شيفرة إعداد Plugin القناة المحلي ما دام
Plugin مساحة العمل معطلًا أو مستبعدًا من قائمة السماح. تتبع عمليات التثبيت المرتبطة
وإدخالات `plugins.load.paths` الصريحة السياسة المعتادة لأصل الـ Plugin
الذي تم حله. راجع
[ضبط سياسة الـ Plugin](/ar/tools/plugin#configure-plugin-policy)
و[مرجع الإعدادات](/ar/gateway/configuration-reference#plugins).

استخدم `--pin` في عمليات تثبيت npm لحفظ المواصفة الدقيقة التي تم حلها (`name@version`) في فهرس الـ Plugin المُدار، مع إبقاء السلوك الافتراضي دون تثبيت.
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
  انتقل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات التنسيق/المصدر/الأصل/الإصدار/التفعيل الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  قائمة جرد قابلة للقراءة آليًا، بالإضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل الـ Plugin المحلي المحفوظ أولًا، مع بديل مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس مسبارًا حيًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير شيفرة الـ Plugin أو حالة التمكين أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تنفيذ شيفرة `register(api)` الجديدة أو الخطافات الجديدة. بالنسبة إلى عمليات النشر البعيدة/ضمن الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس مجرد عملية تغليف.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من
`dependencies` و`optionalDependencies` في `package.json`. يتحقق OpenClaw مما إذا كانت أسماء
هذه الحزم موجودة على طول مسار بحث Node المعتاد عن `node_modules` الخاص بالـ Plugin؛ ولا
يستورد شيفرة وقت تشغيل الـ Plugin، ولا يشغّل مدير حزم، ولا يصلح
التبعيات المفقودة.
</Note>

إذا عرضت سجلات بدء التشغيل `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
فنفّذ `openclaw plugins list --enabled --verbose` أو
`openclaw plugins inspect <id>` باستخدام معرّف Plugin مدرج، لتأكيد معرّفات الـ Plugin
ونسخ المعرّفات الموثوقة إلى `plugins.allow` في `openclaw.json`. عندما يستطيع
التحذير سرد كل Plugin مكتشف، فإنه يطبع مقتطف
`plugins.allow` جاهزًا للصق ويتضمن هذه المعرّفات مسبقًا. إذا تم تحميل Plugin
دون معلومات منشأ للتثبيت/مسار التحميل، فافحص معرّف ذلك الـ Plugin، ثم إما أن تثبّت
المعرّف الموثوق في `plugins.allow` أو تعيد تثبيت الـ Plugin من مصدر موثوق
لكي يسجّل OpenClaw منشأ التثبيت.

للعمل على Plugin مضمّن داخل صورة Docker محزّمة، اربط دليل مصدر الـ Plugin
بالمسار المصدر المحزّم المطابق، مثل
`/app/extensions/synology-chat`. يكتشف OpenClaw تراكب المصدر المربوط هذا
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ فحسب
فيظل غير نشط، ولذلك تستمر عمليات التثبيت المحزّمة المعتادة في استخدام ملفات dist المترجمة.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض الأمر `openclaw plugins inspect <id> --runtime --json` الخطافات المسجّلة وبيانات التشخيص من عملية فحص لوحدة محمّلة. لا يثبّت فحص وقت التشغيل التبعيات مطلقًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل والمفقودة التي يشير إليها الإعداد.
- يؤكد الأمر `openclaw gateway status --deep --require-rpc` عنوان URL/ملف التعريف القابل للوصول لـ Gateway، وتلميحات الخدمة/العملية، ومسار الإعداد، وسلامة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### فهرس Plugins

بيانات تعريف تثبيت Plugins هي حالة تديرها الآلة، وليست إعدادًا للمستخدم. تكتبها عمليات التثبيت والتحديث في قاعدة بيانات حالة SQLite المشتركة ضمن دليل حالة OpenClaw النشط. يخزّن صف `installed_plugin_index` بيانات تعريف `installRecords` الدائمة، بما في ذلك سجلات بيانات تعريف Plugins التالفة أو المفقودة، بالإضافة إلى ذاكرة تخزين مؤقتة لسجل بارد مشتقة من بيان Plugin، وتستخدمها أوامر `openclaw plugins update` وإلغاء التثبيت والتشخيص وسجل Plugins البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة ومشحونة ضمن الإعداد، تتعامل قراءات وقت التشغيل معها كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل عمليات الكتابة الصريحة لـ Plugin والأمر `openclaw doctor --fix` هذه السجلات إلى فهرس Plugins وتزيل مفتاح الإعداد عندما تكون الكتابة إلى الإعداد مسموحة؛ وإذا فشلت أي من عمليتي الكتابة، تُحتفظ بسجلات الإعداد حتى لا تضيع بيانات تعريف التثبيت.

## إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` وفهرس Plugins المحفوظ وإدخالات قائمتي السماح/المنع لـ Plugins وإدخالات `plugins.load.paths` المرتبطة عند انطباق ذلك. وما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار والمتتبّع، ولكن فقط عندما يُحلّ مساره داخل جذر امتدادات Plugins في OpenClaw. إذا كان Plugin يمتلك حاليًا خانة `memory` أو `contextEngine`، تُعاد تلك الخانة إلى قيمتها الافتراضية (`memory-core` للذاكرة و`legacy` لمحرك السياق).

يطبع `uninstall` معاينة لما سيُزال، ثم يعرض المطالبة `Uninstall plugin "<id>"?` قبل إجراء التغييرات. مرّر `--force` لتجاوز مطالبة التأكيد (وهو مفيد للبرامج النصية وعمليات التشغيل غير التفاعلية)؛ ومن دونه، يتطلب إلغاء التثبيت طرفية TTY تفاعلية. يطبع `--dry-run` المعاينة نفسها ثم يخرج من دون عرض مطالبة أو تغيير أي شيء.

<Note>
يُدعم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.
</Note>

## التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugins المتتبّعة في فهرس Plugins المُدار وتثبيتات حزم الخطافات المتتبّعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقارنةً بمواصفة npm">
    عندما تمرّر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجّلة لذلك Plugin. يعني ذلك استمرار استخدام وسوم التوزيع المخزّنة سابقًا، مثل `@beta`، والإصدارات الدقيقة المثبّتة في عمليات `update <id>` اللاحقة.

    أثناء `update <id> --dry-run`، تظل تثبيتات npm ذات الإصدارات الدقيقة مثبتة عليها. وإذا تمكّن OpenClaw أيضًا من حل خط الإصدار الافتراضي للحزمة في السجل وكان هذا الخط أحدث من الإصدار المثبّت المنصّب، تُبلغ عملية التشغيل التجريبي عن التثبيت وتطبع أمر تحديث الحزمة الصريح باستخدام `@latest` لاتباع خط الإصدار الافتراضي للسجل.

    تختلف قاعدة التحديث المستهدف هذه عن مسار الصيانة الجماعي `openclaw plugins update --all`. تظل التحديثات الجماعية تحترم مواصفات التثبيت المتتبّعة العادية، لكن يمكن لسجلات Plugins الرسمية الموثوقة من OpenClaw المزامنة مع الهدف الحالي في الكتالوج الرسمي بدلًا من البقاء على حزمة رسمية دقيقة قديمة. استخدم `update <id>` المستهدف عندما تريد عمدًا إبقاء مواصفة رسمية دقيقة أو موسومة من دون تغيير.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة صريحة لحزمة npm تتضمن وسم توزيع أو إصدارًا دقيقًا. يحل OpenClaw اسم الحزمة هذا إلى سجل Plugin المتتبّع، ويحدّث Plugin المثبّت، ويسجّل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm من دون إصدار أو وسم أيضًا إلى حلّه إلى سجل Plugin المتتبّع. استخدم ذلك عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة الإصدار التجريبي">
    يعيد الأمر المستهدف `openclaw plugins update <id-or-npm-spec>` استخدام مواصفة Plugin المتتبّعة ما لم تمرّر مواصفة جديدة. يستخدم الأمر الجماعي `openclaw plugins update --all` قيمة `update.channel` المضبوطة عند مزامنة سجلات Plugins الرسمية الموثوقة مع هدف الكتالوج الرسمي، بحيث يمكن أن تظل تثبيتات قناة الإصدار التجريبي على خط الإصدار التجريبي بدلًا من تسويتها ضمنيًا إلى المستقر/الأحدث.

    يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: في قناة الإصدار التجريبي، تحاول سجلات Plugins ذات خط npm الافتراضي والمدعومة من ClawHub استخدام `@beta` أولًا. وتعود إلى المواصفة الافتراضية/الأحدث المسجّلة إذا لم يوجد إصدار تجريبي من Plugin؛ كما تعود Plugins الخاصة بـ npm عند وجود الحزمة التجريبية مع فشل التحقق من صحة تثبيتها. يُبلّغ عن هذا الرجوع كتحذير ولا يؤدي إلى فشل تحديث النواة. تظل الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدِّد في التحديثات المستهدفة.

  </Accordion>
  <Accordion title="فحوص الإصدارات وانحراف السلامة">
    قبل تحديث npm فعلي، يتحقق OpenClaw من إصدار الحزمة المثبّتة بمقارنته مع بيانات تعريف سجل npm. إذا تطابق الإصدار المثبّت وهوية الأثر المسجّلة بالفعل مع الهدف المحلول، يُتجاوز التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة سلامة مخزّنة وتتغير بصمة الأثر المجلوب، يتعامل OpenClaw مع ذلك بوصفه انحرافًا في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمتين المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث غير التفاعلية بشكل مغلق ما لم يوفّر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="الخيار --dangerously-force-unsafe-install عند التحديث">
    يُقبل `--dangerously-force-unsafe-install` أيضًا مع `plugins update` لأغراض التوافق، لكنه مهمل ولم يعد يغيّر سلوك تحديث Plugins. لا يزال بإمكان `security.installPolicy` الذي يضبطه المشغّل حظر التحديثات؛ ولا تنطبق خطافات `before_install` الخاصة بـ Plugin إلا في العمليات التي تكون فيها خطافات Plugins محمّلة.
  </Accordion>
  <Accordion title="الخيار --acknowledge-clawhub-risk عند التحديث">
    تخضع تحديثات Plugins المجتمعية المدعومة من ClawHub لفحص ثقة الإصدار الدقيق نفسه الذي تخضع له التثبيتات قبل تنزيل الحزمة البديلة. استخدم `--acknowledge-clawhub-risk` للأتمتة الخاضعة للمراجعة التي ينبغي أن تستمر عندما يتضمن إصدار ClawHub المحدد تحذير ثقة ينطوي على مخاطرة. تتجاوز حزم ClawHub الرسمية ومصادر Plugins المضمّنة في OpenClaw مطالبة الثقة بالإصدار هذه.
  </Accordion>
</AccordionGroup>

## الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

يعرض الفحص الهوية وحالة التحميل والمصدر وإمكانات البيان وأعلام السياسة وبيانات التشخيص وبيانات تعريف التثبيت وإمكانات الحزمة وأي دعم مكتشف لخادم MCP أو LSP، من دون استيراد وقت تشغيل Plugin افتراضيًا. يتضمن ناتج JSON عقود بيان Plugin، مثل `contracts.agentToolResultMiddleware` و`contracts.trustedToolPolicies`، كي يتمكن المشغّلون من تدقيق إعلانات الأسطح الموثوقة قبل تمكين Plugin أو إعادة تشغيله. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وأساليب Gateway ومسارات HTTP المسجّلة. يُبلغ فحص وقت التشغيل مباشرةً عن تبعيات Plugin المفقودة؛ وتبقى عمليات التثبيت والإصلاح ضمن `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبّت أوامر CLI المملوكة لـ Plugin عادةً كمجموعات أوامر جذرية ضمن `openclaw`، لكن يمكن لـ Plugins أيضًا تسجيل أوامر متداخلة تحت أمر أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ فعلى سبيل المثال، يمكن التحقق من Plugin يسجّل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin وفق ما يسجّله فعليًا في وقت التشغيل:

| الشكل               | المعنى                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `plain-capability`  | نوع إمكانية واحد بالضبط (مثل Plugin مخصص لمزوّد فقط)         |
| `hybrid-capability` | أكثر من نوع إمكانية واحد (مثل النص + الكلام + الصور)       |
| `hook-only`         | خطافات فقط، بلا إمكانات أو أدوات أو أوامر أو خدمات أو مسارات |
| `non-capability`    | أدوات/أوامر/خدمات، لكن بلا إمكانات                       |

راجع [أشكال Plugins](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج الإمكانات.

<Note>
يُخرج العلم `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرامج النصية والتدقيق. يعرض `inspect --all` جدولًا يشمل المجموعة بأكملها مع أعمدة للشكل وأنواع الإمكانات وإشعارات التوافق وإمكانات الحزمة وملخص الخطافات. يُعد `info` اسمًا مستعارًا لـ `inspect`.
</Note>

## التشخيص

```bash
openclaw plugins doctor
```

يُبلغ `doctor` عن أخطاء تحميل Plugins وبيانات تشخيص البيان/الاكتشاف وإشعارات التوافق ومراجع إعداد Plugins القديمة، مثل خانات Plugins المفقودة. عندما تكون شجرة التثبيت وإعداد Plugins نظيفين، يطبع `No plugin issues detected.`. وإذا بقي إعداد قديم مع سلامة شجرة التثبيت فيما عدا ذلك، يذكر الملخص هذا الأمر بدلًا من الإيحاء بسلامة Plugins الكاملة.

إذا كان Plugin مضبوطًا وموجودًا على القرص لكنه محظور بفحوص أمان المسار الخاصة بالمحمّل، يحتفظ التحقق من صحة الإعداد بإدخال Plugin ويُبلغ عنه بالحالة `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة المتاحة للجميع، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى حالات فشل شكل الوحدة، مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص موجز لشكل الصادرات في ناتج التشخيص.

## السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugins المحلي هو نموذج القراءة البارد المحفوظ في OpenClaw لهوية Plugins المثبّتة وحالة تمكينها وبيانات تعريف مصادرها وملكية مساهماتها. يمكن لبدء التشغيل العادي والبحث عن مالك المزوّد وتصنيف إعداد القنوات وجرد Plugins قراءته من دون استيراد وحدات وقت تشغيل Plugins.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا أو حاليًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugins المحفوظ وسياسة الإعداد وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تنشيط في وقت التشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستعادة، ضمن مشروع npm مُدار لـ Plugin أو جذر npm المُدار المسطح القديم، Plugin مضمّنًا، يزيل `doctor` تلك الحزمة القديمة ويعيد بناء السجل لكي يتحقق بدء التشغيل من البيان المضمّن. كما يعيد `doctor` ربط حزمة المضيف `openclaw` داخل Plugins المُدارة عبر npm التي تعلن `peerDependencies.openclaw`، بحيث تُحل استيرادات وقت التشغيل المحلية للحزمة، مثل `openclaw/plugin-sdk/*`، بعد التحديثات أو إصلاحات npm.

<Warning>
إن `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق مهمل للاستخدام الاضطراري عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ ولا يُستخدم الرجوع عبر متغير البيئة إلا لاستعادة بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
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

يسرد `plugins marketplace entries` الإدخالات من موجز سوق OpenClaw المُهيّأ. يحاول افتراضيًا استخدام الموجز المستضاف، ثم يعود إلى أحدث لقطة مقبولة أو إلى البيانات المضمّنة عند تعذّر ذلك. استخدم `--feed-profile <name>` لقراءة ملف تعريف مُهيّأ محدد، و`--feed-url <url>` لقراءة عنوان URL صريح لموجز مستضاف، و`--offline` لقراءة أحدث لقطة مقبولة دون جلب الموجز.

يحدّث `plugins marketplace refresh` لقطة الموجز المستضاف المُهيّأ، ويُبلغ عمّا إذا كان OpenClaw قد قبل البيانات المستضافة، أو لقطة مستضافة، أو بيانات احتياطية مضمّنة. استخدم `--expected-sha256` عندما يحتاج المستدعي إلى فشل الأمر ما لم تتطابق حمولة مستضافة حديثة مع قيمة تحقق مثبّتة.

يقبل أمر السوق `list` مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر التي جرى حلّها، بالإضافة إلى بيان السوق المحلّل وإدخالات Plugins.

يحمّل تحديث السوق موجز سوق OpenClaw مستضافًا ويحفظ الاستجابة التي جرى التحقق منها كلقطة محلية للموجز المستضاف. من دون خيارات، يستخدم ملف تعريف الموجز الافتراضي المُهيّأ. استخدم `--feed-profile <name>` لتحديث ملف تعريف مُهيّأ محدد، و`--feed-url <url>` لتحديث عنوان URL صريح لموجز مستضاف، و`--expected-sha256 <sha256>` لاشتراط قيمة تحقق مطابقة للحمولة (`sha256:<hex>` أو ملخص سداسي عشري مجرد من 64 محرفًا)، و`--json` للحصول على مخرجات قابلة للقراءة آليًا. يجب ألا تتضمن عناوين URL الصريحة للموجز المستضاف بيانات اعتماد، أو سلاسل استعلام، أو أجزاء. يمكن لعمليات التحديث غير المثبّتة الإبلاغ عن نتيجة لقطة مستضافة أو بيانات احتياطية مضمّنة دون إفشال الأمر. تفشل عمليات التحديث المثبّتة ما لم تقبل حمولة مستضافة حديثة، كما تفشل عمليات التحديث المستضافة الناجحة إذا تعذّر على OpenClaw حفظ اللقطة التي جرى التحقق منها.

## ذو صلة

- [إنشاء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/clawhub)

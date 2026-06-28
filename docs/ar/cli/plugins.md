---
read_when:
    - تريد تثبيت أو إدارة Pluginات Gateway أو الحزم المتوافقة
    - تريد إنشاء هيكل أولي أو التحقق من صحة Plugin أداة بسيطة
    - تريد استكشاف حالات فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: الإضافات
x-i18n:
    generated_at: "2026-06-28T20:43:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والسرد، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تقوية الأمان لتثبيتات Plugin.
  </Card>
</CardGroup>

## الأوامر

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

لتحقيقات التثبيت البطيء، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [استكشاف الأخطاء وإصلاحها](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون عمليات تغيير دورة حياة Plugin معطلة. استخدم مصدر Nix لهذا التثبيت بدلا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ بالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) القائم على الوكيل أولا.
</Note>

<Note>
تأتي Plugins المضمّنة مع OpenClaw. بعضها مُمكّن افتراضيا (على سبيل المثال موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ ويتطلب البعض الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية في OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغا). تستخدم الحزم المتوافقة بيانات حزمها الخاصة بدلا من ذلك.

يعرض `plugins list` إما `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطولة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

### المؤلف

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ينشئ `plugins init` افتراضيا Plugin أداة TypeScript بسيطا. الوسيطة الأولى
هي معرّف Plugin؛ مرّر `--name` لاسم العرض. يستخدم OpenClaw المعرّف
لدليل الإخراج الافتراضي وتسمية الحزمة. تستخدم قوالب الأدوات
`defineToolPlugin`.
يستورد `plugins build` نقطة الدخول المبنية، ويقرأ بيانات الأداة الوصفية الثابتة، ويكتب
`openclaw.plugin.json`، ويحافظ على اتساق `openclaw.extensions` في `package.json`.
يتحقق `plugins validate` من أن البيان المُنشأ، وبيانات الحزمة الوصفية، وتصدير
نقطة الدخول الحالية لا تزال متطابقة. راجع [Plugins الأدوات](/ar/plugins/tool-plugins) للاطلاع على
سير عمل تأليف الأدوات الكامل.

يكتب القالب مصدر TypeScript لكنه ينشئ البيانات الوصفية من نقطة الدخول المبنية
`./dist/index.js` بحيث يعمل سير العمل أيضا مع CLI المنشور. استخدم
`--entry <path>` عندما لا تكون نقطة الدخول هي نقطة دخول الحزمة الافتراضية. استخدم
`plugins build --check` في CI للفشل عندما تكون البيانات الوصفية المُنشأة قديمة دون
إعادة كتابة الملفات.

### قالب الموفر

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

تنشئ قوالب الموفر Plugin موفر نص/نموذج عام مع توصيل مفتاح API متوافق مع OpenAI،
وسكربت `npm run validate` مدمج لـ `clawhub package
validate`، وبيانات حزمة ClawHub الوصفية، وسير عمل GitHub يُشغّل يدويا
للنشر الموثوق مستقبلا عبر GitHub Actions OIDC. لا تنشئ قوالب الموفر
Skills ولا تستخدم `openclaw plugins build` أو
`openclaw plugins validate`؛ فهذه الأوامر مخصصة لمسار البيانات الوصفية المُنشأة
لقالب الأداة.

قبل النشر، استبدل عنوان URL الأساسي المؤقت لـ API، وفهرس النماذج، ومسار
المستندات، ونص بيانات الاعتماد، ونسخة README بتفاصيل الموفر الحقيقية. استخدم
README المُنشأ للنشر الأول على ClawHub وإعداد الناشر الموثوق.

### التثبيت

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

يمكن للمشرفين الذين يختبرون تثبيتات وقت الإعداد تجاوز مصادر تثبيت Plugin
التلقائية باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبّت أسماء الحزم المجردة من npm افتراضيا أثناء مرحلة الانتقال عند الإطلاق، ما لم تطابق معرّف Plugin رسمي. تستخدم مواصفات حزم `@openclaw/*` الخام التي تطابق Plugins مضمّنة النسخة المضمّنة التي شُحنت مع بناء OpenClaw الحالي. استخدم `npm:<package>` عندما تريد عمدا حزمة npm خارجية بدلا من ذلك. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيتات Plugin مثل تشغيل الشيفرة. فضّل الإصدارات المثبتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مسار تثبيت مباشر واحتياطيا مدعوما. تُنشر حزم Plugin المملوكة لـ OpenClaw
ذات النمط `@openclaw/*` على npm مرة أخرى؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة beta وسم توزيع npm `beta` عندما يكون ذلك الوسم
متاحا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="إدراجات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعوما بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المدرج وتترك `openclaw.json` دون تغيير. تفشل إدراجات الجذر، ومصفوفات الإدراج، والإدراجات ذات التجاوزات الشقيقة بشكل مغلق بدلا من التسطيح. راجع [إدراجات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، فإن `plugins install` يفشل عادة بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي إعدادات أخرى غير صالحة؛ يمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن يختار صراحة `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة مسبقا في مكانها. استخدمه عندما تتعمد إعادة تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبّع مسبقا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يكون مدعوما مع تثبيتات `git:`؛ استخدم مرجع git صريحا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرا مثبتا. ولا يكون مدعوما مع `--marketplace`، لأن تثبيتات marketplace تحتفظ ببيانات وصفية لمصدر marketplace بدلا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    صار `--dangerously-force-unsafe-install` مهملا وأصبح الآن بلا تأثير. لم يعد OpenClaw يشغّل حظر الشيفرة الخطرة المدمج في وقت التثبيت لتثبيتات Plugin.

    استخدم سطح `security.installPolicy` المشترك المملوك للمشغّل عندما تكون سياسة تثبيت خاصة بالمضيف مطلوبة. خطافات `before_install` في Plugin هي خطافات دورة حياة وقت تشغيل Plugin وليست حد السياسة الأساسي لتثبيتات CLI.

    إذا كان Plugin نشرته على ClawHub مخفيا أو محظورا بفحص السجل، فاستخدم خطوات الناشر في [النشر على ClawHub](/ar/clawhub/publishing). لا يطلب `--dangerously-force-unsafe-install` من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عاما.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    تتحقق تثبيتات ClawHub المجتمعية من سجل ثقة الإصدار المحدد قبل تنزيل الحزمة. إذا عطّل ClawHub التنزيل للإصدار، أو أبلغ عن نتائج فحص خبيثة، أو وضع الإصدار في حالة إشراف حاجبة مثل الحجر، يرفض OpenClaw الإصدار. بالنسبة إلى حالات الفحص الخطرة غير الحاجبة، أو حالات الإشراف الخطرة، أو أسباب السجل، يعرض OpenClaw تفاصيل الثقة ويطلب التأكيد قبل المتابعة.

    استخدم `--acknowledge-clawhub-risk` فقط بعد مراجعة تحذير ClawHub واتخاذ قرار بالمتابعة دون مطالبة تفاعلية. سجلات الثقة النظيفة المعلّقة أو القديمة تُصدر تحذيرا لكنها لا تتطلب إقرارا. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw مطالبة ثقة الإصدار هذه.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة والتمكين لكل خطاف، وليس لتثبيت الحزم.

    مواصفات npm هي **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات تثبيت التبعيات في مشروع npm مُدار واحد لكل Plugin مع `--ignore-scripts` للسلامة، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة. ترث مشاريع npm المُدارة للـ Plugin إعدادات npm `overrides` على مستوى حزمة OpenClaw، لذلك تنطبق تثبيتات الأمان في المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حلّ npm صريحًا. مواصفات الحزم العارية تُثبَّت أيضًا مباشرة من npm أثناء انتقال الإطلاق ما لم تطابق معرّف Plugin رسميًا.

    مواصفات حزم `@openclaw/*` الخام التي تطابق Plugins المضمّنة تُحل إلى النسخة المضمّنة المملوكة للصورة قبل الرجوع إلى npm. على سبيل المثال، يستخدم `openclaw plugins install @openclaw/discord@2026.5.20 --pin` Plugin Discord المضمّن من بناء OpenClaw الحالي بدلًا من إنشاء تجاوز npm مُدار. لفرض استخدام حزمة npm الخارجية، استخدم `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    تبقى المواصفات العارية و`@latest` على مسار الإصدار المستقر. إصدارات تصحيح OpenClaw المختومة بالتاريخ مثل `2026.5.3-1` تُعد إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا من هذين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحة باستخدام وسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    بالنسبة إلى عمليات تثبيت npm دون إصدار دقيق (`npm:<package>` أو `npm:<package>@latest`)، يفحص OpenClaw بيانات تعريف الحزمة المحلولة قبل التثبيت. إذا كانت أحدث حزمة مستقرة تتطلب واجهة API أحدث لـ Plugin في OpenClaw أو حدًا أدنى أحدث لإصدار المضيف، يفحص OpenClaw الإصدارات المستقرة الأقدم ويثبت أحدث إصدار متوافق بدلًا من ذلك. تبقى الإصدارات الدقيقة ووسوم dist-tags الصريحة مثل `@beta` صارمة: إذا كانت الحزمة المحددة غير متوافقة، يفشل الأمر ويطلب منك ترقية OpenClaw أو اختيار إصدار متوافق.

    إذا طابقت مواصفة تثبيت عارية معرّف Plugin رسميًا (مثل `diffs`)، يثبت OpenClaw إدخال الفهرس مباشرة. لتثبيت حزمة npm تحمل الاسم نفسه، استخدم مواصفة scoped صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وعناوين الاستنساخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاختيار branch أو tag أو commit قبل التثبيت.

    تستنسخ عمليات تثبيت Git إلى دليل مؤقت، وتنتقل إلى المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن التحقق من manifest، وسياسة تثبيت المشغّل، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل عمليات تثبيت npm. تتضمن عمليات تثبيت git المسجلة عنوان URL/المرجع للمصدر إضافة إلى commit المحلول حتى يستطيع `openclaw plugins update` إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، نفّذ ذلك الأمر مباشرة عبر CLI الجذر لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي على `package.json` فقط قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف tarball من npm-pack وتريد
    اختبار مسار مشروع npm المُدار لكل Plugin نفسه المستخدم بواسطة عمليات تثبيت
    السجل، بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة،
    وسجلات تثبيت npm. ما زالت مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر إضافات Plugin.

    عمليات التثبيت من سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم عمليات تثبيت ClawHub محدد `clawhub:<package>` صريحًا:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin العارية الصالحة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق ما لم تطابق معرّف Plugin رسميًا:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل المحصور بـ npm صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يفحص OpenClaw توافق واجهة API المعلنة لـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw ملف npm-pack `.tgz` ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبته عبر مسار الأرشيف العادي. ما زالت إصدارات ClawHub الأقدم دون بيانات تعريف ClawPack تُثبَّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ عمليات التثبيت المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وتكامل npm، وnpm shasum، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ عمليات تثبيت ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار حتى يستطيع `openclaw plugins update` متابعة إصدارات ClawHub الأحدث؛ تبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار Marketplace

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة سجل Claude المحلية عند `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر السوق صراحة:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - اسم known-marketplace من Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="Remote marketplace rules">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المسارية من manifest البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

يجب أن تكون عمليات التثبيت المحلية المُدارة أدلة Plugins أو أرشيفات. لا تُنسخ ملفات Plugin
المستقلة `.js` و`.mjs` و`.cjs` و`.ts` إلى جذر Plugin المُدار
بواسطة `plugins install`؛ ادرجها صراحة في `plugins.load.paths` بدلًا من ذلك.

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. حاليًا، تُدعم Skills الخاصة بالحزم، وcommand-skills الخاصة بـ Claude، وافتراضات `settings.json` الخاصة بـ Claude، وافتراضات `.lsp.json` / `lspServers` المعلنة في manifest الخاصة بـ Claude، وcommand-skills الخاصة بـ Cursor، وأدلة hook المتوافقة مع Codex؛ تظهر قدرات الحزم الأخرى المكتشفة في التشخيصات/المعلومات لكنها لم تُوصَّل بعد إلى تنفيذ وقت التشغيل.
</Note>

### القائمة

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  اعرض Plugins المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا إضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المستمر أولًا، مع رجوع مشتق من manifest فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت تشغيل عملية Gateway تعمل بالفعل. بعد تغيير كود Plugin أو التفعيل أو سياسة hook أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو hooks جديدة. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على طول مسار بحث Node `node_modules` العادي للـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، أو يشغّل مدير حزم، أو يصلح التبعيات
المفقودة.
</Note>

إذا سجّلت سجلات بدء التشغيل `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
فشغّل `openclaw plugins list --enabled --verbose` أو
`openclaw plugins inspect <id>` باستخدام معرّف Plugin مدرج لتأكيد معرّفات Plugin
وانسخ المعرّفات الموثوقة إلى `plugins.allow` في `openclaw.json`. عندما يستطيع
التحذير سرد كل Plugin مكتشف، يطبع مقتطف
`plugins.allow` جاهزًا للصق ويتضمن تلك المعرّفات بالفعل. إذا حمّل Plugin
دون مصدر تثبيت/مسار تحميل، فافحص معرّف ذلك Plugin، ثم إما ثبّت
المعرّف الموثوق في `plugins.allow` أو أعد تثبيت Plugin من مصدر موثوق
حتى يسجل OpenClaw مصدر التثبيت.

`plugins search` هو بحث بعيد في فهرس ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص،
وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

بالنسبة إلى عمل Plugin المضمّن داخل صورة Docker مُغلّفة، اربط دليل مصدر Plugin
فوق مسار المصدر المُغلّف المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر
المركّبة تلك قبل `/app/dist/extensions/synology-chat`؛ ويبقى دليل المصدر
المنسوخ العادي غير فعّال بحيث تظل عمليات التثبيت المُغلّفة العادية تستخدم dist المترجم.

لتصحيح أخطاء hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من مرور فحص محمّل للوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل المفقودة والمشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` عنوان URL/الملف الشخصي القابل للوصول لـ Gateway، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثة غير المضمّنة (`llm_input` و`llm_output` و`before_model_resolve` و`before_agent_reply` و`before_agent_run` و`before_agent_finalize` و`agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل Plugin محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

يجب إدراج ملفات Plugin المستقلة في `plugins.load.paths` بدلًا من
تثبيتها باستخدام `plugins install` أو وضعها مباشرة في `~/.openclaw/extensions`
أو `<workspace>/.openclaw/extensions`. تحمّل تلك الجذور المكتشفة تلقائيًا
أدلة حزم Plugin أو الحزم المتوافقة، بينما تُعامل ملفات السكربت على المستوى الأعلى
كمساعدات محلية ويتم تخطيها.

<Note>
لا يتم استيراد أو تنفيذ Plugins ذات منشأ مساحة العمل المكتشفة من جذر امتدادات مساحة العمل
إلى أن يتم تفعيلها صراحة. للتطوير المحلي،
شغّل `openclaw plugins enable <plugin-id>` أو عيّن
`plugins.entries.<plugin-id>.enabled: true`؛ إذا كان تكوينك يستخدم
`plugins.allow`، فأدرج معرّف Plugin نفسه هناك أيضًا. تنطبق قاعدة الفشل المغلق هذه
أيضًا عندما يستهدف إعداد القناة صراحة Plugin ذا منشأ مساحة عمل
للتحميل الخاص بالإعداد فقط، لذلك لن يعمل كود إعداد Plugin القناة المحلي ما دام
Plugin مساحة العمل ذاك معطّلًا أو مستبعدًا من قائمة السماح. تتبع التثبيتات المرتبطة
وإدخالات `plugins.load.paths` الصريحة السياسة المعتادة لمنشأ Plugin
الذي تم حله. راجع
[تكوين سياسة Plugin](/ar/tools/plugin#configure-plugin-policy)
و[مرجع التكوين](/ar/gateway/configuration-reference#plugins).

لا يكون `--force` مدعومًا مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة التي تم حلها (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة تُدار آليًا، وليست تكوين مستخدم. تكتبها عمليات التثبيت والتحديث إلى قاعدة بيانات حالة SQLite المشتركة ضمن دليل حالة OpenClaw النشط. يخزن صف `installed_plugin_index` بيانات تعريف `installRecords` الدائمة، بما في ذلك سجلات بيانات تعريف Plugins المعطلة أو المفقودة، إضافة إلى ذاكرة تخزين مؤقتة باردة للسجل مشتقة من البيان يستخدمها `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugins البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة ومشحونة في التكوين، تتعامل قراءات وقت التشغيل معها كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح التكوين عندما تكون كتابات التكوين مسموحة؛ إذا فشلت أي من الكتابتين، تُبقى سجلات التكوين حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قائمة السماح/الرفض الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم تعيين `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر امتدادات Plugin في OpenClaw. بالنسبة إلى Plugins الخاصة بـ Active Memory، تُعاد خانة الذاكرة إلى `memory-core`.

<Note>
`--keep-config` مدعوم كاسم مستعار مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. يعني ذلك أن وسوم التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة يستمر استخدامها في عمليات `update <id>` اللاحقة.

    أثناء `update <id> --dry-run`، تبقى تثبيتات npm الدقيقة المثبتة مثبتة. إذا استطاع OpenClaw أيضًا حل خط السجل الافتراضي للحزمة وكان ذلك الخط الافتراضي أحدث من الإصدار المثبت المركب، فإن التشغيل التجريبي يبلّغ عن التثبيت ويطبع أمر تحديث الحزمة الصريح `@latest` لاتباع خط السجل الافتراضي.

    تختلف قاعدة التحديث المستهدف هذه عن مسار الصيانة الجماعي `openclaw plugins update --all`. ما تزال التحديثات الجماعية تحترم مواصفات التثبيت المتتبعة العادية، لكن سجلات Plugins الرسمية الموثوقة من OpenClaw يمكن أن تتزامن مع هدف الكتالوج الرسمي الحالي بدلًا من البقاء على حزمة رسمية دقيقة قديمة. استخدم `update <id>` المستهدف عندما تريد عمدًا إبقاء مواصفة رسمية دقيقة أو موسومة من دون تغيير.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة عائدًا إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرّف.

    تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضًا عائدًا إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد نقله عائدًا إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update <id-or-npm-spec>` المستهدف استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يستخدم `openclaw plugins update --all` الجماعي `update.channel` المكوّن عندما يزامن سجلات Plugins الرسمية الموثوقة مع هدف الكتالوج الرسمي، لذلك يمكن لتثبيتات قناة بيتا أن تبقى على خط إصدار بيتا بدلًا من تسويتها صامتًا إلى المستقر/الأحدث.

    يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: في قناة بيتا، تحاول سجلات npm ذات الخط الافتراضي وسجلات Plugin في ClawHub استخدام `@beta` أولًا. وتعود إلى مواصفة الافتراضي/الأحدث المسجلة إذا لم يوجد إصدار بيتا لذلك Plugin؛ كما تعود Plugins الخاصة بـ npm عند وجود حزمة بيتا لكن فشلها في تحقق التثبيت. يُبلّغ عن ذلك الرجوع كتحذير ولا يفشل تحديث النواة. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد للتحديثات المستهدفة.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm حي، يفحص OpenClaw إصدار الحزمة المثبت مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة سلامة مخزنة وتتغير بصمة الأثر المجلب، يتعامل OpenClaw مع ذلك كانحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية فشلًا مغلقًا ما لم يقدم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يُقبل `--dangerously-force-unsafe-install` أيضًا في `plugins update` للتوافق، لكنه مهمل ولم يعد يغيّر سلوك تحديث Plugin. ما يزال بإمكان `security.installPolicy` الخاص بالمشغل حظر التحديثات؛ ولا تنطبق خطافات Plugin `before_install` إلا في العمليات التي يتم فيها تحميل خطافات Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk عند التحديث">
    تشغل تحديثات Plugins المجتمعية المدعومة من ClawHub فحص الثقة نفسه للإصدار الدقيق كما في التثبيتات قبل تنزيل الحزمة البديلة. استخدم `--acknowledge-clawhub-risk` للأتمتة المراجعة التي ينبغي أن تواصل عندما يحتوي إصدار ClawHub المحدد على تحذير ثقة خطر. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw مطالبة ثقة الإصدار هذه.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP من دون استيراد وقت تشغيل Plugin افتراضيًا. يتضمن خرج JSON عقود بيان Plugin، مثل `contracts.agentToolResultMiddleware` و`contracts.trustedToolPolicies`، حتى يتمكن المشغلون من تدقيق إعلانات الأسطح الموثوقة قبل تفعيل Plugin أو إعادة تشغيله. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل مباشرة عن اعتماديات Plugin المفقودة؛ تبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً ما تُثبّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية ضمن `openclaw`، لكن قد تسجل Plugins أيضًا أوامر متداخلة تحت أصل نواة مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاص بالمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد حول نموذج القدرات.

<Note>
يطبع العلم `--json` تقريرًا مقروءًا آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يحتوي على أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### التشخيص

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق، ومراجع تكوين Plugin القديمة مثل خانات Plugin المفقودة. عندما تكون شجرة التثبيت وتكوين Plugin نظيفين يطبع `No plugin issues detected.` إذا بقي تكوين قديم لكن شجرة التثبيت سليمة بخلاف ذلك، يقول الملخص ذلك بدلًا من الإيحاء بصحة Plugin كاملة.

إذا كان Plugin مكوّن موجودًا على القرص لكنه محظور بفحوصات أمان المسار في المحمّل، يحتفظ تحقق التكوين بإدخال Plugin ويبلّغ عنه على أنه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للجميع، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل صادرات `register`/`activate` المفقودة، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في خرج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمر في OpenClaw لهوية Plugin، والتفعيل، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، وبحث مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته من دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حاليًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة التكوين، وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت تشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستعادة تحت مشروع npm Plugin مُدار أو جذر npm المُدار المسطح القديم تحجب Plugin مضمّنًا، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل البيان المضمّن. يعيد Doctor أيضًا ربط حزمة المضيف `openclaw` داخل Plugins الخاصة بـ npm المُدارة التي تصرّح بـ `peerDependencies.openclaw`، حتى تُحل استيرادات وقت التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` بعد التحديثات أو إصلاحات npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل للطوارئ عند إخفاقات قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ رجوع env مخصص فقط لاستعادة بدء التشغيل الطارئة أثناء طرح الهجرة.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

يحمّل تحديث السوق موجز سوق OpenClaw مستضافًا ويستبقي الاستجابة
المتحقق منها كلقطة موجز مستضاف محلية. من دون خيارات، يستخدم
ملف تعريف الموجز الافتراضي المضبوط. استخدم `--feed-profile <name>` لتحديث
ملف تعريف مضبوط محدد، و`--feed-url <url>` لتحديث عنوان URL صريح لموجز
مستضاف، و`--expected-sha256 <sha256>` لاشتراط مجموع تحقق مطابق للحمولة
(`sha256:<hex>` أو ملخص hex مجرد بطول 64 حرفًا)، و`--json` للحصول على
مخرجات قابلة للقراءة آليًا. يجب ألا تتضمن عناوين URL الصريحة للموجزات المستضافة
بيانات اعتماد، أو سلاسل استعلام، أو أجزاء. يمكن للتحديثات غير المثبتة الإبلاغ عن
لقطة مستضافة أو نتيجة احتياطية مضمّنة من دون إفشال الأمر. تفشل التحديثات
المثبتة ما لم تقبل حمولة مستضافة حديثة، وتفشل التحديثات المستضافة الناجحة
إذا تعذر على OpenClaw استبقاء اللقطة المتحقق منها.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

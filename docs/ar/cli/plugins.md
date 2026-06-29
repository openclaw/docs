---
read_when:
    - تريد تثبيت أو إدارة Plugins لـ Gateway أو حزم متوافقة
    - تريد إنشاء هيكل أولي أو التحقق من Plugin أداة بسيط
    - تريد تصحيح أخطاء إخفاقات تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T22:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط التكوين.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تقوية الأمان لعمليات تثبيت Plugin.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

لاستقصاء بطء التثبيت أو الفحص أو إلغاء التثبيت أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون عمليات تعديل دورة حياة Plugin معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المعتمد على الوكيل أولًا.
</Note>

<Note>
تُشحن Plugins المضمّنة مع OpenClaw. يكون بعضها مُمكّنًا افتراضيًا (مثل مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تُشحن Plugins الأصلية في OpenClaw مع `openclaw.plugin.json` يتضمن JSON Schema مضمنًا (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` إما `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات التفصيلية النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

### المؤلف

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ينشئ `plugins init` افتراضيًا Plugin أدوات TypeScript بسيطًا. الوسيط الأول
هو معرّف Plugin؛ مرّر `--name` لاسم العرض. يستخدم OpenClaw
المعرّف لمجلد الإخراج الافتراضي وتسمية الحزمة. تستخدم قوالب الأدوات
`defineToolPlugin`.
يستورد `plugins build` نقطة الدخول المبنية، ويقرأ بيانات تعريف الأدوات الثابتة، ويكتب
`openclaw.plugin.json`، ويحافظ على اتساق `package.json` `openclaw.extensions`.
يتحقق `plugins validate` من استمرار توافق البيان المُنشأ، وبيانات تعريف الحزمة،
وتصدير نقطة الدخول الحالية. راجع [Plugins الأدوات](/ar/plugins/tool-plugins) للاطلاع على
سير عمل تأليف الأدوات الكامل.

يكتب القالب مصدر TypeScript لكنه ينشئ بيانات التعريف من نقطة الدخول المبنية
`./dist/index.js` حتى يعمل سير العمل أيضًا مع CLI المنشور. استخدم
`--entry <path>` عندما لا تكون نقطة الدخول هي نقطة دخول الحزمة الافتراضية. استخدم
`plugins build --check` في CI للفشل عندما تكون بيانات التعريف المُنشأة قديمة دون
إعادة كتابة الملفات.

### قالب المزوّد

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

تنشئ قوالب المزوّد Plugin مزوّد نص/نموذج عامًا مع توصيل مفتاح API متوافق مع OpenAI،
وسكربت `npm run validate` مدمج لـ `clawhub package
validate`، وبيانات تعريف حزمة ClawHub، وسير عمل GitHub يُشغّل يدويًا
للنشر الموثوق مستقبلًا عبر GitHub Actions OIDC. لا تنشئ قوالب المزوّد
Skills ولا تستخدم `openclaw plugins build` أو
`openclaw plugins validate`؛ فهذه الأوامر مخصصة لمسار بيانات التعريف المُنشأة
لقالب الأدوات.

قبل النشر، استبدل عنوان URL الأساسي لواجهة API النائب، وكتالوج النماذج، ومسار الوثائق،
ونص بيانات الاعتماد، ونسخة README بتفاصيل المزوّد الحقيقية. استخدم
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

يمكن للمشرفين الذين يختبرون عمليات التثبيت وقت الإعداد تجاوز مصادر تثبيت Plugin
التلقائية باستخدام متغيرات بيئة محروسة. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق، ما لم تطابق معرّف Plugin رسمي. تستخدم مواصفات حزم `@openclaw/*` الخام التي تطابق Plugins مضمّنة النسخة المضمّنة التي شُحنت مع بناء OpenClaw الحالي. استخدم `npm:<package>` عندما تريد عمدًا حزمة npm خارجية بدلًا من ذلك. استخدم `clawhub:<package>` من أجل ClawHub. تعامل مع تثبيت Plugins مثل تشغيل التعليمات البرمجية. فضّل الإصدارات المثبتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مسارًا احتياطيًا ومدعومًا للتثبيت المباشر. أُعيد نشر حزم Plugin المملوكة لـ OpenClaw
`@openclaw/*` على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث في قناة بيتا وسم توزيع npm `beta` عندما يكون ذلك الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات التكوين وإصلاح التكوين غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بتضمين `$include` لملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بإغلاق بدلًا من التسطيح. راجع [تضمينات التكوين](/ar/gateway/configuration) للاطلاع على الأشكال المدعومة.

    إذا كان التكوين غير صالح أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، يفشل تكوين Plugin غير الصالح بإغلاق مثل أي تكوين غير صالح آخر؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن خاص بـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبع مسبقًا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت مسبقًا، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` لترقية عادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    أصبح `--dangerously-force-unsafe-install` مهملًا وهو الآن بلا تأثير. لم يعد OpenClaw يشغّل حظر التعليمات البرمجية الخطرة المدمج وقت التثبيت لعمليات تثبيت Plugin.

    استخدم سطح `security.installPolicy` المشترك المملوك للمشغّل عندما تكون سياسة تثبيت خاصة بالمضيف مطلوبة. خطافات Plugin `before_install` هي خطافات دورة حياة وقت تشغيل Plugin وليست حد السياسة الأساسي لتثبيتات CLI.

    إذا كان Plugin نشرته على ClawHub مخفيًا أو محظورًا بفحص سجل، فاستخدم خطوات الناشر في [نشر ClawHub](/ar/clawhub/publishing). لا يطلب `--dangerously-force-unsafe-install` من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    تتحقق تثبيتات مجتمع ClawHub من سجل ثقة الإصدار المحدد قبل تنزيل الحزمة. إذا عطّل ClawHub التنزيل للإصدار، أو أبلغ عن نتائج فحص خبيثة، أو وضع الإصدار في حالة إشراف حاجبة مثل الحجر، يرفض OpenClaw الإصدار. بالنسبة إلى حالات الفحص الخطرة غير الحاجبة، أو حالات الإشراف الخطرة، أو أسباب السجل، يعرض OpenClaw تفاصيل الثقة ويطلب التأكيد قبل المتابعة.

    استخدم `--acknowledge-clawhub-risk` فقط بعد مراجعة تحذير ClawHub واتخاذ قرار بالمتابعة دون مطالبة تفاعلية. تحذّر سجلات الثقة النظيفة المعلقة أو القديمة لكنها لا تتطلب إقرارًا. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw مطالبة ثقة الإصدار هذه.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع** اختياري). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل عمليات تثبيت التبعيات في مشروع npm مُدار واحد لكل Plugin مع `--ignore-scripts` للسلامة، حتى عندما تكون لدى الصدفة لديك إعدادات تثبيت npm عامة. ترث مشاريع npm المُدارة للـ Plugins إعدادات npm على مستوى حزمة OpenClaw الخاصة بـ `overrides`، لذلك تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. مواصفات الحزم العارية تُثبَّت أيضًا مباشرةً من npm أثناء انتقال الإطلاق ما لم تطابق معرّف Plugin رسميًا.

    مواصفات حزم `@openclaw/*` الخام التي تطابق Plugins المضمّنة تُحل إلى النسخة المضمّنة المملوكة للصورة قبل الرجوع إلى npm. على سبيل المثال، يستخدم `openclaw plugins install @openclaw/discord@2026.5.20 --pin` Plugin Discord المضمّن من بناء OpenClaw الحالي بدلًا من إنشاء تجاوز npm مُدار. لفرض استخدام حزمة npm الخارجية، استخدم `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    تبقى المواصفات العارية و`@latest` على المسار المستقر. إصدارات التصحيح المؤرخة في OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حل npm أيًا منها إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    بالنسبة إلى تثبيتات npm دون إصدار دقيق (`npm:<package>` أو `npm:<package>@latest`)، يفحص OpenClaw بيانات تعريف الحزمة المحلولة قبل التثبيت. إذا كانت أحدث حزمة مستقرة تتطلب واجهة API أحدث لـ Plugin في OpenClaw أو حدًا أدنى أحدث لإصدار المضيف، يفحص OpenClaw الإصدارات المستقرة الأقدم ويثبّت أحدث إصدار متوافق بدلًا من ذلك. تظل الإصدارات الدقيقة ووسوم التوزيع الصريحة مثل `@beta` صارمة: إذا كانت الحزمة المحددة غير متوافقة، يفشل الأمر ويطلب منك ترقية OpenClaw أو اختيار إصدار متوافق.

    إذا طابقت مواصفة تثبيت عارية معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تشمل الصيغ المدعومة عناوين استنساخ `git:github.com/owner/repo` و`git:owner/repo` و`https://` الكاملة و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git في دليل مؤقت، وتستخرج المرجع المطلوب عند وجوده، ثم تستخدم مُثبّت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وسياسة تثبيت المشغّل، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف أرشيف tarball من npm-pack وتريد
    اختبار مسار مشروع npm المُدار لكل Plugin نفسه المستخدم في تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة،
    وسجلات تثبيت npm. لا تزال مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر امتدادات Plugin.

    تثبيتات سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محددًا صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugins العارية الآمنة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق ما لم تطابق معرّف Plugin رسميًا:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل مقتصرًا على npm صراحةً:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يفحص OpenClaw التوافق المُعلن لواجهة API الخاصة بـ Plugin / الحد الأدنى لـ Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw ملف npm-pack `.tgz` ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبّته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم دون بيانات ClawPack الوصفية تُثبَّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحافظ تثبيتات ClawHub غير محددة الإصدار على مواصفة مسجلة غير محددة الإصدار حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة Claude المحلية لسجل الأسواق عند `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر السوق صراحةً:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="Remote marketplace rules">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugins داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugins غير المسارية من البيانات الظاهرة البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّنات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

يجب أن تكون التثبيتات المحلية المُدارة دلائل Plugins أو أرشيفات. لا تُنسخ ملفات Plugin المستقلة
`.js` و`.mjs` و`.cjs` و`.ts` إلى جذر Plugin المُدار
بواسطة `plugins install`؛ أدرجها صراحةً في `plugins.load.paths` بدلًا من ذلك.

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. اليوم، تُدعم bundle skills، وcommand-skills الخاصة بـ Claude، وافتراضات `settings.json` الخاصة بـ Claude، وافتراضات `.lsp.json` الخاصة بـ Claude / `lspServers` المعلنة في البيان، وcommand-skills الخاصة بـ Cursor، وأدلة hooks المتوافقة مع Codex؛ وتظهر قدرات الحزم المكتشفة الأخرى في diagnostics/info لكنها لم تُوصَّل بعد إلى تنفيذ وقت التشغيل.
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
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugins المحلي المستمر أولًا، مع رجوع مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو تفعيله أو سياسة hooks أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو hooks الجديدة. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل الابن الفعلي `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يفحص OpenClaw ما إذا كانت أسماء الحزم هذه
موجودة على طول مسار بحث `node_modules` العادي الخاص بـ Node للـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، أو يشغّل مدير حزم، أو يصلح التبعيات
المفقودة.
</Note>

إذا سجّلت سجلات بدء التشغيل `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
فشغّل `openclaw plugins list --enabled --verbose` أو
`openclaw plugins inspect <id>` مع معرّف Plugin مُدرج لتأكيد معرّفات Plugin
ونسخ المعرّفات الموثوقة إلى `plugins.allow` في `openclaw.json`. عندما يستطيع
التحذير سرد كل Plugin مكتشف، فإنه يطبع مقتطف `plugins.allow`
جاهزًا للصق ويتضمن تلك المعرّفات مسبقًا. إذا حُمّل Plugin
دون مصدر تثبيت/مسار تحميل، فافحص معرّف ذلك Plugin، ثم إما ثبّت
المعرّف الموثوق في `plugins.allow` أو أعد تثبيت Plugin من مصدر موثوق
حتى يسجل OpenClaw مصدر التثبيت.

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبّت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص،
وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

بالنسبة إلى عمل Plugin المضمّن داخل صورة Docker مُحزّمة، اربط دليل مصدر Plugin
فوق مسار المصدر المُحزّم المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة تلك
قبل `/app/dist/extensions/synology-chat`؛ ويبقى دليل المصدر المنسوخ العادي
غير فعّال بحيث تستمر التثبيتات المُحزّمة العادية في استخدام dist المجمّع.

لتصحيح أخطاء hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من مرور فحص محمّل كوحدة. لا يثبّت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل المفقودة والمشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` عنوان URL/الملف الشخصي القابل للوصول لـ Gateway، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل Plugin محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

يجب إدراج ملفات Plugin المستقلة في `plugins.load.paths` بدلًا من
تثبيتها باستخدام `plugins install` أو وضعها مباشرةً في `~/.openclaw/extensions`
أو `<workspace>/.openclaw/extensions`. تحمّل تلك الجذور المكتشفة تلقائيًا
دلائل حزم Plugin أو الحزم المتوافقة، بينما تُعامَل ملفات السكربتات في المستوى الأعلى
كمساعدات محلية ويتم تخطيها.

<Note>
لا يتم استيراد أو تنفيذ Plugins ذات أصل مساحة العمل المكتشفة من جذر امتدادات مساحة العمل حتى يتم تمكينها صراحة. للتطوير المحلي،
شغّل `openclaw plugins enable <plugin-id>` أو عيّن
`plugins.entries.<plugin-id>.enabled: true`؛ وإذا كان تكوينك يستخدم
`plugins.allow`، فأدرج معرف Plugin نفسه هناك أيضًا. تنطبق قاعدة الإغلاق الآمن هذه
أيضًا عندما يستهدف إعداد القناة صراحة Plugin ذا أصل مساحة العمل للتحميل الخاص بالإعداد فقط، لذلك لن يعمل كود إعداد Plugin القناة المحلي بينما يظل Plugin مساحة العمل
ذلك معطلًا أو مستبعدًا من قائمة السماح. تتبع التثبيتات المرتبطة
ومدخلات `plugins.load.paths` الصريحة السياسة العادية لأصل Plugin
المحلول الخاص بها. راجع
[تكوين سياسة Plugin](/ar/tools/plugin#configure-plugin-policy)
و[مرجع التكوين](/ar/gateway/configuration-reference#plugins).

لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة تديرها الآلة، وليست تكوينًا للمستخدم. تكتبها التثبيتات والتحديثات إلى قاعدة بيانات حالة SQLite المشتركة ضمن دليل حالة OpenClaw النشط. يخزن صف `installed_plugin_index` بيانات `installRecords` الوصفية الدائمة، بما في ذلك السجلات الخاصة ببيانات تعريف Plugin المعطوبة أو المفقودة، إضافة إلى ذاكرة تخزين مؤقت باردة للسجل مشتقة من بيان التعريف تستخدمها `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في التكوين، تتعامل قراءات وقت التشغيل معها كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح التكوين عندما تكون كتابات التكوين مسموحة؛ وإذا فشلت أي من الكتابتين، تُبقى سجلات التكوين حتى لا تُفقد بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، ومدخلات قائمة السماح/الحظر لـ Plugin، ومدخلات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم تعيين `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر امتدادات Plugin في OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، يُعاد تعيين خانة الذاكرة إلى `memory-core`.

<Note>
يُدعم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.
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
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عند تمرير معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن علامات التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

    أثناء `update <id> --dry-run`، تظل تثبيتات npm الدقيقة المثبتة مثبتة. إذا استطاع OpenClaw أيضًا حل خط السجل الافتراضي للحزمة وكان ذلك الخط الافتراضي أحدث من الإصدار المثبت المنصب، فإن التشغيل الجاف يبلغ عن التثبيت ويطبع أمر تحديث الحزمة الصريح `@latest` لاتباع خط السجل الافتراضي.

    تختلف قاعدة التحديث المستهدف هذه عن مسار الصيانة الجماعي `openclaw plugins update --all`. لا تزال التحديثات الجماعية تحترم مواصفات التثبيت المتتبعة العادية، لكن سجلات Plugin الرسمية الموثوقة لـ OpenClaw يمكنها المزامنة إلى هدف الكتالوج الرسمي الحالي بدلًا من البقاء على حزمة رسمية دقيقة قديمة. استخدم `update <id>` المستهدف عندما تريد عمدًا إبقاء مواصفة رسمية دقيقة أو موسومة من دون تغيير.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع علامة توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذلك عائدًا إلى سجل Plugin المتتبع، ويحدث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرف.

    تمرير اسم حزمة npm من دون إصدار أو علامة يحل أيضًا عائدًا إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update <id-or-npm-spec>` المستهدف استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يستخدم `openclaw plugins update --all` الجماعي `update.channel` المكوّن عندما يزامن سجلات Plugin الرسمية الموثوقة إلى هدف الكتالوج الرسمي، بحيث يمكن لتثبيتات قناة بيتا أن تبقى على خط إصدار بيتا بدلًا من تسويتها بصمت إلى المستقر/الأحدث.

    يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة بيتا، تحاول سجلات Plugin الافتراضية لـ npm وClawHub استخدام `@beta` أولًا. وتعود إلى المواصفة الافتراضية/الأحدث المسجلة إذا لم يوجد إصدار بيتا لـ Plugin؛ كما تعود Plugins npm أيضًا عندما تكون حزمة بيتا موجودة لكنها تفشل في تحقق التثبيت. يُبلغ عن هذا الرجوع كتحذير ولا يفشل تحديث النواة. تبقى الإصدارات الدقيقة والعلامات الصريحة مثبتة على ذلك المحدد للتحديثات المستهدفة.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات السجل الوصفية لـ npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما يوجد تجزئة سلامة مخزنة وتتغير تجزئة الأثر المجلب، يعامل OpenClaw ذلك كانحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بإغلاق آمن ما لم يوفر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يُقبل `--dangerously-force-unsafe-install` أيضًا في `plugins update` للتوافق، لكنه مهمل ولم يعد يغير سلوك تحديث Plugin. لا تزال سياسة المشغل `security.installPolicy` قادرة على حظر التحديثات؛ ولا تنطبق خطافات Plugin `before_install` إلا في العمليات التي يتم فيها تحميل خطافات Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk عند التحديث">
    تُجري تحديثات Plugin المجتمعية المدعومة من ClawHub فحص الثقة نفسه للإصدار الدقيق كما في التثبيتات قبل تنزيل الحزمة البديلة. استخدم `--acknowledge-clawhub-risk` للأتمتة المراجعة التي ينبغي أن تستمر عندما يتضمن إصدار ClawHub المحدد تحذير ثقة عالي المخاطر. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمنة في OpenClaw مطالبة ثقة الإصدار هذه.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات بيان التعريف، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP من دون استيراد وقت تشغيل Plugin افتراضيًا. يتضمن خرج JSON عقود بيان تعريف Plugin، مثل `contracts.agentToolResultMiddleware` و`contracts.trustedToolPolicies`، حتى يتمكن المشغلون من تدقيق تصريحات الأسطح الموثوقة قبل تمكين Plugin أو إعادة تشغيله. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ وتبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً ما تُثبّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية في `openclaw`، لكن يمكن لـ Plugins أيضًا تسجيل أوامر متداخلة تحت أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا تحت `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin وفق ما يسجله فعليًا في وقت التشغيل:

- **قدرة-عادية** — نوع قدرة واحد (مثل Plugin لمزود فقط)
- **قدرة-هجينة** — عدة أنواع قدرات (مثل نص + كلام + صور)
- **خطافات-فقط** — خطافات فقط، بلا قدرات أو أسطح
- **بلا-قدرات** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد عن نموذج القدرات.

<Note>
ينتج العلم `--json` تقريرًا مقروءًا آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات بيان التعريف/الاكتشاف، وإشعارات التوافق، ومراجع تكوين Plugin القديمة مثل خانات Plugin المفقودة. عندما تكون شجرة التثبيت وتكوين Plugin نظيفين، يطبع `No plugin issues detected.` إذا بقي تكوين قديم لكن شجرة التثبيت سليمة بخلاف ذلك، يوضح الملخص ذلك بدلًا من الإيحاء بصحة Plugin كاملة.

إذا كان Plugin مكوّن موجودًا على القرص لكنه محظور بفحوصات أمان المسار في المحمّل، فإن تحقق التكوين يُبقي مدخل Plugin ويبلغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في خرج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المستمر في OpenClaw لهوية Plugin وتمكينه وبيانات المصدر الوصفية وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزود، وتصنيف إعداد القناة، وجرد Plugin قراءته من دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حاليًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة التكوين، وبيانات بيان التعريف/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت تشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستردة ضمن مشروع npm Plugin مُدار أو جذر npm المُدار المسطح القديم Plugin مضمنًا، يزيل Doctor تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل بيان التعريف المضمن. يعيد Doctor أيضًا ربط حزمة المضيف `openclaw` داخل Plugins npm المُدارة التي تعلن `peerDependencies.openclaw`، بحيث تُحل استيرادات وقت التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` بعد التحديثات أو إصلاحات npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الزجاج عند إخفاقات قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاسترداد بدء التشغيل الطارئ أثناء طرح الترحيل.
</Warning>

### السوق

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

يعرض `plugins marketplace entries` الإدخالات من موجز سوق OpenClaw المُكوَّن. يحاول افتراضيًا استخدام الموجز المستضاف، ثم يعود إلى أحدث لقطة مقبولة أو البيانات المضمّنة. استخدم `--feed-profile <name>` لقراءة ملف تعريف مُكوَّن محدد، و`--feed-url <url>` لقراءة عنوان URL صريح لموجز مستضاف، و`--offline` لقراءة أحدث لقطة مقبولة دون جلب الموجز.

يحدّث `plugins marketplace refresh` لقطة الموجز المستضاف المُكوَّن، ويبلّغ عمّا إذا كان OpenClaw قد قبل البيانات المستضافة، أو لقطة مستضافة، أو بيانات احتياطية مضمّنة. استخدم `--expected-sha256` عندما يحتاج المستدعي إلى فشل الأمر ما لم تطابق حمولة مستضافة حديثة مجموعًا اختباريًا مثبّتًا.

يقبل `list` في سوق الإضافات مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلّل وإدخالات Plugin.

يحمّل تحديث السوق موجز سوق OpenClaw مستضافًا ويحتفظ بالاستجابة
المتحقق منها كلقطة محلية للموجز المستضاف. من دون خيارات، يستخدم
ملف تعريف الموجز الافتراضي المُكوَّن. استخدم `--feed-profile <name>` لتحديث
ملف تعريف مُكوَّن محدد، و`--feed-url <url>` لتحديث عنوان URL صريح
لموجز مستضاف، و`--expected-sha256 <sha256>` لاشتراط مجموع اختباري مطابق للحمولة
(`sha256:<hex>` أو ملخص سداسي عشري مجرد بطول 64 حرفًا)، و`--json` للحصول على
مخرجات قابلة للقراءة آليًا. يجب ألا تتضمن عناوين URL الصريحة للموجزات المستضافة
بيانات اعتماد، أو سلاسل استعلام، أو أجزاء. يمكن للتحديثات غير المثبّتة الإبلاغ عن
نتيجة لقطة مستضافة أو نتيجة احتياطية مضمّنة دون إفشال الأمر. تفشل
التحديثات المثبّتة ما لم تقبل حمولة مستضافة حديثة، وتفشل التحديثات المستضافة
الناجحة إذا تعذّر على OpenClaw الاحتفاظ باللقطة المتحقق منها.

## ذو صلة

- [بناء Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

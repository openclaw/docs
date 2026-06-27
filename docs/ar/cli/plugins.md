---
read_when:
    - تريد تثبيت Plugins الخاصة بـ Gateway أو الحزم المتوافقة أو إدارتها
    - تريد إنشاء هيكل أولي أو التحقق من Plugin أداة بسيط
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:23:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

إدارة إضافات Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت الإضافات وتمكينها واستكشاف أخطائها وإصلاحها.
  </Card>
  <Card title="إدارة الإضافات" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تقوية الأمان لعمليات تثبيت الإضافات.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

لاستقصاء بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [استكشاف الأخطاء وإصلاحها](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix ‏(`OPENCLAW_NIX_MODE=1`)، تكون عمليات تغيير دورة حياة الإضافات معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install`، أو `plugins update`، أو `plugins uninstall`، أو `plugins enable`، أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start) التي تبدأ بالوكيل.
</Note>

<Note>
تُشحن الإضافات المضمّنة مع OpenClaw. يكون بعضها ممكّنًا افتراضيًا (على سبيل المثال مزوّدو النماذج المضمّنون، ومزوّدو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن إضافات OpenClaw الأصلية ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطوّلة النوع الفرعي للحزمة (`codex`، أو `claude`، أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
</Note>

### المؤلف

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

ينشئ `plugins init` إضافة أداة TypeScript حدّية افتراضيًا. الوسيط الأول هو معرّف الإضافة؛ مرّر `--name` لاسم العرض. يستخدم OpenClaw المعرّف لدليل الإخراج الافتراضي وتسمية الحزمة. تستخدم قوالب الأدوات `defineToolPlugin`.
يستورد `plugins build` نقطة الدخول المبنية، ويقرأ بيانات الأداة الوصفية الثابتة، ويكتب `openclaw.plugin.json`، ويحافظ على محاذاة `package.json` `openclaw.extensions`.
يتحقق `plugins validate` من أن البيان المُنشأ، وبيانات الحزمة الوصفية، وتصدير نقطة الدخول الحالي ما زالت متفقة. راجع [إضافات الأدوات](/ar/plugins/tool-plugins) للاطلاع على سير عمل تأليف الأدوات الكامل.

يكتب القالب مصدر TypeScript لكنه ينشئ البيانات الوصفية من نقطة الدخول المبنية `./dist/index.js`، لذا يعمل سير العمل أيضًا مع CLI المنشور. استخدم `--entry <path>` عندما لا تكون نقطة الدخول هي نقطة دخول الحزمة الافتراضية. استخدم `plugins build --check` في CI للفشل عندما تكون البيانات الوصفية المُنشأة قديمة دون إعادة كتابة الملفات.

### قالب المزوّد

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

تنشئ قوالب المزوّد Plugin مزوّد نص/نموذج عامًا مع توصيل مفتاح API متوافق مع OpenAI، وسكربت `npm run validate` مدمج لـ `clawhub package validate`، وبيانات وصفية لحزمة ClawHub، وسير عمل GitHub يُشغّل يدويًا للنشر الموثوق مستقبلًا عبر GitHub Actions OIDC. لا تنشئ قوالب المزوّد Skills ولا تستخدم `openclaw plugins build` أو `openclaw plugins validate`؛ فهذه الأوامر مخصصة لمسار البيانات الوصفية المُنشأة لقالب الأداة.

قبل النشر، استبدل عنوان URL الأساسي لواجهة API المؤقت، وكتالوج النماذج، ومسار التوثيق، ونص بيانات الاعتماد، ونسخة README بتفاصيل المزوّد الحقيقية. استخدم README المُنشأ للنشر لأول مرة في ClawHub وإعداد الناشر الموثوق.

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

يمكن للمشرفين الذين يختبرون عمليات التثبيت وقت الإعداد تجاوز مصادر تثبيت Plugin التلقائية باستخدام متغيرات بيئة محروسة. راجع [تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق، ما لم تطابق معرّف Plugin رسميًا. مواصفات حزم `@openclaw/*` الخام التي تطابق الإضافات المضمّنة تستخدم النسخة المضمّنة التي شُحنت مع بناء OpenClaw الحالي. استخدم `npm:<package>` عندما تريد عمدًا حزمة npm خارجية بدلًا من ذلك. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت الإضافات مثل تشغيل كود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin، وليس في Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم الإضافات. يبقى Npm مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. نُشرت حزم Plugin التي تملكها OpenClaw ضمن `@openclaw/*` على npm مرة أخرى؛ راجع القائمة الحالية على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو [جرد الإضافات](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`. تفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` في npm عندما يكون ذلك الوسم متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` في ملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل التضمينات الجذرية، ومصفوفات التضمين، والتضمينات مع تجاوزات شقيقة بإغلاق محكم بدلًا من تسطيحها. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق محكم ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، تفشل إعدادات Plugin غير الصالحة بإغلاق محكم مثل أي إعدادات غير صالحة أخرى؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثّق وقت التثبيت هو مسار استرداد ضيق لإضافة مضمّنة للإضافات التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبّع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يوقف OpenClaw العملية ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات marketplace تحتفظ ببيانات مصدر marketplace الوصفية بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    تم إهمال `--dangerously-force-unsafe-install` وأصبح الآن بلا تأثير. لم يعد OpenClaw يشغّل حظر الكود الخطِر المدمج وقت التثبيت لعمليات تثبيت الإضافات.

    استخدم سطح `security.installPolicy` المشترك والمملوك للمشغّل عندما تكون سياسة تثبيت خاصة بالمضيف مطلوبة. خطافات Plugin `before_install` هي خطافات دورة حياة وقت تشغيل Plugin وليست حدّ السياسة الأساسي لتثبيتات CLI.

    إذا كانت Plugin نشرتها على ClawHub مخفية أو محظورة بفحص سجل، فاستخدم خطوات الناشر في [نشر ClawHub](/ar/clawhub/publishing). لا يطلب `--dangerously-force-unsafe-install` من ClawHub إعادة فحص Plugin أو جعل إصدار محظور عامًا.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    تتحقق تثبيتات ClawHub المجتمعية من سجل ثقة الإصدار المحدد قبل تنزيل الحزمة. إذا عطّل ClawHub التنزيل للإصدار، أو أبلغ عن نتائج فحص خبيثة، أو وضع الإصدار في حالة إشراف حاجزة مثل الحجر، يرفض OpenClaw الإصدار. بالنسبة إلى حالات الفحص الخطرة غير الحاجزة، أو حالات الإشراف الخطرة، أو أسباب السجل، يعرض OpenClaw تفاصيل الثقة ويطلب التأكيد قبل المتابعة.

    استخدم `--acknowledge-clawhub-risk` فقط بعد مراجعة تحذير ClawHub واتخاذ قرار المتابعة دون مطالبة تفاعلية. سجلات الثقة النظيفة المعلّقة أو القديمة تحذّر لكنها لا تتطلب إقرارًا. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw مطالبة ثقة الإصدار هذه.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات في مشروع npm مُدار واحد لكل Plugin مع `--ignore-scripts` للأمان، حتى عندما تحتوي الصدفة لديك على إعدادات تثبيت npm عامة. ترث مشاريع npm المُدارة للإضافات `overrides` على مستوى حزمة OpenClaw في npm، لذا تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. كما تُثبّت مواصفات الحزم المجردة مباشرةً من npm أثناء انتقال الإطلاق ما لم تطابق معرّف Plugin رسميًا.

    تُحل مواصفات حزم `@openclaw/*` الخام التي تطابق Plugins المضمّنة إلى النسخة المضمّنة المملوكة للصورة قبل الرجوع إلى npm. على سبيل المثال، يستخدم `openclaw plugins install @openclaw/discord@2026.5.20 --pin` Plugin Discord المضمّن من بناء OpenClaw الحالي بدلا من إنشاء تجاوز npm مُدار. لفرض استخدام حزمة npm الخارجية، استخدم `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إصدارات التصحيح المؤرخة في OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حل npm أيا منها إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحة بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    بالنسبة إلى تثبيتات npm بدون إصدار دقيق (`npm:<package>` أو `npm:<package>@latest`)، يتحقق OpenClaw من بيانات تعريف الحزمة المحلولة قبل التثبيت. إذا كانت أحدث حزمة مستقرة تتطلب واجهة Plugin API أحدث في OpenClaw أو حدًا أدنى أحدث لإصدار المضيف، يفحص OpenClaw الإصدارات المستقرة الأقدم ويثبت أحدث إصدار متوافق بدلا من ذلك. تبقى الإصدارات الدقيقة ووسوم التوزيع الصريحة مثل `@beta` صارمة: إذا كانت الحزمة المحددة غير متوافقة، يفشل الأمر ويطلب منك ترقية OpenClaw أو اختيار إصدار متوافق.

    إذا طابقت مواصفة تثبيت مجردة معرف Plugin رسميًا (على سبيل المثال `diffs`)، يثبت OpenClaw إدخال الكتالوج مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وعناوين الاستنساخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو التزام قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتستخرج المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وسياسة تثبيت المشغل، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر إضافة إلى الالتزام المحلول بحيث يستطيع `openclaw plugins update` إعادة حل المصدر لاحقا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجل Plugin جذر CLI باستخدام `api.registerCli`، فنفذ ذلك الأمر مباشرة عبر CLI الجذري لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية في OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف كرة tarball من npm-pack وتريد
    اختبار مسار مشروع npm المُدار لكل Plugin نفسه المستخدم في تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة،
    وسجلات تثبيت npm. لا تزال مسارات الأرشيف العادية تثبت كأرشيفات محلية
    ضمن جذر إضافات Plugin.

    تثبيتات سوق Claude مدعومة أيضا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق ما لم تطابق معرف Plugin رسميًا:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الحصري عبر npm صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق Plugin API المعلن / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزل OpenClaw ملف npm-pack `.tgz` ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير ذات الإصدار بمواصفة مسجلة غير ذات إصدار حتى يستطيع `openclaw plugins update` متابعة إصدارات ClawHub الأحدث؛ تبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم الاختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي في Claude عند `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="مصادر السوق">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد السوق البعيد">
    بالنسبة إلى الأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المسارية من البيانات الظاهرة البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية من OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

يجب أن تكون التثبيتات المحلية المُدارة أدلة Plugins أو أرشيفات. لا تُنسخ ملفات Plugin
المستقلة `.js` و`.mjs` و`.cjs` و`.ts` إلى جذر Plugin المُدار
بواسطة `plugins install`؛ أدرجها صراحة في `plugins.load.paths` بدلا من ذلك.

<Note>
تُثبت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الحزم، وSkills أوامر Claude، وافتراضات Claude في `settings.json`، وافتراضات Claude في `.lsp.json` / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة؛ تظهر قدرات الحزم الأخرى المكتشفة في التشخيصات/المعلومات لكنها غير موصولة بعد بتنفيذ وقت التشغيل.
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
  اعرض Plugins الممكّنة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا إضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولا، مع رجوع مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس مسبار وقت تشغيل حيًا لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin، أو حالة تمكينه، أو سياسة الخطافات، أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو الخطافات الجديدة. بالنسبة إلى عمليات النشر البعيدة/الحاوية، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية تغليف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على طول مسار بحث `node_modules` العادي الخاص بـ Node لذلك Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، أو يشغل مدير حزم، أو يصلح التبعيات
المفقودة.
</Note>

إذا سجل بدء التشغيل `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`،
فشغل `openclaw plugins list --enabled --verbose` أو
`openclaw plugins inspect <id>` مع معرف Plugin مدرج لتأكيد معرفات Plugin
وانسخ المعرفات الموثوقة إلى `plugins.allow` في `openclaw.json`. عندما يستطيع
التحذير سرد كل Plugin مكتشف، فإنه يطبع مقتطف `plugins.allow`
جاهزًا للصق ويتضمن تلك المعرفات بالفعل. إذا تم تحميل Plugin
بدون أصل تثبيت/مسار تحميل، فافحص معرف ذلك Plugin، ثم إما ثبت
المعرف الموثوق في `plugins.allow` أو أعد تثبيت Plugin من مصدر موثوق
حتى يسجل OpenClaw أصل التثبيت.

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغير الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، و
تلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة
هذه قبل `/app/dist/extensions/synology-chat`؛ أما دليل مصدر منسوخ عادي
فيبقى غير نشط بحيث تظل التثبيتات المعبأة العادية تستخدم dist المترجم.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من مرور فحص محمّل كوحدة. لا يثبت فحص وقت التشغيل التبعيات مطلقًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل المفقودة التي تشير إليها الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` عنوان URL/الملف الشخصي القابل للوصول لـ Gateway، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل Plugin محلي (يُضاف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

يجب إدراج ملفات Plugin المستقلة في `plugins.load.paths` بدلا من
تثبيتها باستخدام `plugins install` أو وضعها مباشرة في `~/.openclaw/extensions`
أو `<workspace>/.openclaw/extensions`. تحمّل تلك الجذور المكتشفة تلقائيًا
أدلة حزم أو حزم Plugin، بينما تُعامل ملفات السكربت ذات المستوى الأعلى كمساعدات
محلية ويتم تخطيها.

<Note>
لا يتم استيراد Plugins ذات أصل مساحة العمل المكتشفة من جذر إضافات مساحة العمل
أو تنفيذها حتى يتم تمكينها صراحة. للتطوير المحلي،
شغّل `openclaw plugins enable <plugin-id>` أو عيّن
`plugins.entries.<plugin-id>.enabled: true`؛ إذا كان إعدادك يستخدم
`plugins.allow`، فأدرج معرّف Plugin نفسه هناك أيضًا. تنطبق قاعدة الإخفاق المغلق هذه
أيضًا عندما يستهدف إعداد القناة صراحة Plugin ذا أصل مساحة عمل
للتحميل الخاص بالإعداد فقط، لذلك لن يعمل كود إعداد Plugin القناة المحلي ما دام
Plugin مساحة العمل ذلك معطّلًا أو مستبعدًا من قائمة السماح. تتبع التثبيتات المرتبطة
وإدخالات `plugins.load.paths` الصريحة السياسة العادية لأصل Plugin
المحلول الخاص بها. راجع
[تكوين سياسة Plugin](/ar/tools/plugin#configure-plugin-policy)
و[مرجع الإعدادات](/ar/gateway/configuration-reference#plugins).

الخيار `--force` غير مدعوم مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبّت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة تُدار آليًا، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث إلى قاعدة بيانات حالة SQLite المشتركة ضمن دليل حالة OpenClaw النشط. يخزّن صف `installed_plugin_index` بيانات تعريف `installRecords` المتينة، بما في ذلك سجلات لبيانات manifest الخاصة بـ Plugin المعطوبة أو المفقودة، إضافة إلى ذاكرة تخزين مؤقت باردة للسجل مشتقة من manifest تُستخدم بواسطة `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، تتعامل قراءات وقت التشغيل معها كمدخل توافق دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعداد عندما تكون كتابات الإعداد مسموحة؛ وإذا فشلت أي من الكتابتين، تُحفظ سجلات الإعداد حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin الدائم، وإدخالات قوائم سماح/حظر Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم تعيين `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر إضافات Plugin في OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تُعاد خانة الذاكرة إلى `memory-core`.

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
    عند تمرير معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تظل مستخدمة في تشغيلات `update <id>` اللاحقة.

    تختلف قاعدة التحديث الموجّه هذه عن مسار الصيانة الجماعي `openclaw plugins update --all`. لا تزال التحديثات الجماعية تحترم مواصفات التثبيت المتتبعة العادية، لكن سجلات Plugin الرسمية الموثوقة من OpenClaw يمكنها المزامنة إلى هدف الكتالوج الرسمي الحالي بدلًا من البقاء على حزمة رسمية دقيقة قديمة. استخدم `update <id>` الموجّه عندما تريد عمدًا إبقاء مواصفة رسمية دقيقة أو موسومة دون تغيير.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرّف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضًا إلى الحل إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة Beta">
    يعيد `openclaw plugins update <id-or-npm-spec>` الموجّه استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يستخدم `openclaw plugins update --all` الجماعي `update.channel` المُكوَّن عندما يزامن سجلات Plugin الرسمية الموثوقة إلى هدف الكتالوج الرسمي، لذلك يمكن أن تبقى تثبيتات قناة beta على خط إصدار beta بدلًا من تسويتها بصمت إلى stable/latest.

    يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات Plugin الافتراضية لـ npm وClawHub استخدام `@beta` أولًا. وتتراجع إلى مواصفة default/latest المسجلة إذا لم يوجد إصدار beta لذلك Plugin؛ كما تتراجع Plugins الخاصة بـ npm عندما تكون حزمة beta موجودة لكنها تفشل في تحقق التثبيت. يُبلَّغ عن ذلك التراجع كتحذير ولا يفشل تحديث النواة. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد للتحديثات الموجّهة.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يفحص OpenClaw إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عند وجود تجزئة سلامة مخزنة وتغيّر تجزئة الأثر المجلب، يتعامل OpenClaw مع ذلك كانحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بشكل مغلق ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يُقبل `--dangerously-force-unsafe-install` أيضًا في `plugins update` للتوافق، لكنه مهمل ولم يعد يغيّر سلوك تحديث Plugin. لا يزال بإمكان `security.installPolicy` الخاص بالمشغّل حظر التحديثات؛ ولا تنطبق خطافات `before_install` الخاصة بـ Plugin إلا في العمليات التي يتم فيها تحميل خطافات Plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk عند التحديث">
    تشغّل تحديثات Plugin المدعومة من ClawHub المجتمعي فحص الثقة نفسه للإصدار الدقيق كما في التثبيتات قبل تنزيل الحزمة البديلة. استخدم `--acknowledge-clawhub-risk` للأتمتة المراجعة التي يجب أن تستمر عندما يحتوي إصدار ClawHub المحدد على تحذير ثقة محفوف بالمخاطر. تتجاوز حزم ClawHub الرسمية ومصادر Plugin المضمّنة في OpenClaw مطالبة الثقة بالإصدار هذه.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات manifest، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. يتضمن خرج JSON عقود manifest الخاصة بـ Plugin، مثل `contracts.agentToolResultMiddleware` و`contracts.trustedToolPolicies`، حتى يتمكن المشغلون من تدقيق إعلانات السطح الموثوق قبل تمكين Plugin أو إعادة تشغيله. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن اعتماديات Plugin المفقودة مباشرة؛ وتبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً ما تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية لـ `openclaw`، لكن يمكن لـ Plugins أيضًا تسجيل أوامر متداخلة ضمن أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ فمثلًا يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin وفقًا لما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin لمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج القدرات.

<Note>
ينتج علم `--json` تقريرًا مقروءًا آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول مع أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات manifest/الاكتشاف، وإشعارات التوافق، ومراجع إعدادات Plugin القديمة مثل خانات Plugin المفقودة. عندما تكون شجرة التثبيت وإعدادات Plugin نظيفة، يطبع `No plugin issues detected.` وإذا بقيت إعدادات قديمة لكن شجرة التثبيت سليمة بخلاف ذلك، يقول الملخص ذلك بدلًا من الإيحاء بسلامة Plugin الكاملة.

إذا كان Plugin المُكوَّن موجودًا على القرص لكنه محظور بواسطة فحوصات سلامة المسار في المحمّل، فإن تحقق الإعداد يحتفظ بإدخال Plugin ويبلّغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة العامة، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في خرج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد الدائم في OpenClaw لهوية Plugin، والتمكين، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل الدائم موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin الدائم، وسياسة الإعداد، وبيانات تعريف manifest/package. هذا مسار إصلاح، وليس مسار تنشيط وقت تشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستعادة ضمن مشروع npm مُدار لـ Plugin أو جذر npm المُدار المسطح القديم Plugin مضمّنًا، يزيل الطبيب تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل manifest المضمّن. يعيد الطبيب أيضًا ربط حزمة المضيف `openclaw` داخل Plugins npm المُدارة التي تعلن `peerDependencies.openclaw`، حتى تُحل استيرادات وقت التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` بعد التحديثات أو إصلاحات npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق مهمل لكسر الزجاج عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فتراجع env مخصص فقط لاستعادة بدء التشغيل الطارئة أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى manifest السوق المحللة وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

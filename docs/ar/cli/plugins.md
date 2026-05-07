---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد تصحيح أخطاء فشل تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T01:51:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c43d51a8ecc2d420991e7beb585cbf3046d44cd6dca755377f4c050c7a155064
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
```

للتحقيق في بطء التثبيت أو الفحص أو إلغاء التثبيت أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويبقي مخرجات JSON قابلة للتحليل. راجع [استكشاف الأخطاء وإصلاحها](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون معدِّلات دورة حياة Plugin معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) الذي يبدأ بالوكيل.
</Note>

<Note>
تُشحن Plugins المضمّنة مع OpenClaw. بعضها مفعّل افتراضيًا (مثل مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمّن (`configSchema`، حتى إن كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` السطر `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات السرد/المعلومات المفصلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) إلى جانب قدرات الحزمة المكتشفة.
</Note>

### التثبيت

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
تُثبَّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيتات Plugin كما تتعامل مع تشغيل الكود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو واجهة التوزيع والاكتشاف الأساسية لمعظم Plugins. يبقى Npm
مسارًا احتياطيًا ومسار تثبيت مباشرًا مدعومًا. عادت حزم Plugin المملوكة لـ OpenClaw
ضمن `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
وتفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` الخاص بـ npm عندما يكون هذا الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بتضمين `$include` في ملف واحد، فإن `plugins install/update/enable/disable/uninstall` يكتب إلى ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بشكل مغلق بدلًا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي إعدادات غير صالحة أخرى؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثّق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن للـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة مسبقًا في موضعها. استخدمه عندما تعيد تثبيت المعرّف نفسه عمدًا من مسار محلي جديد أو أرشيف أو حزمة ClawHub أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبَّع مسبقًا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت مسبقًا، يتوقف OpenClaw ويوجّهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. وهو غير مدعوم مع `--marketplace`، لأن تثبيتات marketplace تحتفظ ببيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار كسر زجاج للحالات الإيجابية الكاذبة في ماسح الكود الخطر المضمّن. يسمح للتثبيت بالمتابعة حتى عندما يبلّغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز كتل سياسة خطاف `before_install` الخاصة بـ Plugin و**لا** يتجاوز فشل الفحص.

    ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا واجهة التثبيت لحزم الخطافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة والتمكين لكل خطاف، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا ضمن المشروع مع `--ignore-scripts` للأمان، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة. ترث جذور npm المُدارة لـ Plugin تجاوزات npm على مستوى حزمة OpenClaw، لذا تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. كما تُثبّت مواصفات الحزم المجردة مباشرةً من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. لا تزال إصدارات تصحيح OpenClaw القديمة مثل `2026.5.3-1` تُعامل كإصدارات مستقرة لهذا الفحص حتى تستمر الحزم الأقدم في التحديث بأمان. من المخطط أن يستخدم عمل خطوط الدعم الشهرية الجديد أرقام تصحيح SemVer العادية بدلًا من لواحق التصحيح بشرطة. إذا حلّ npm مواصفة من الخط الافتراضي إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة محددة النطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وروابط النسخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو commit قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص الكود الخطر، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر إضافةً إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذر لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي على `package.json` فقط قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف tarball من npm-pack وتريد
    اختبار مسار تثبيت جذر npm المُدار نفسه الذي تستخدمه تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة، و
    سجلات تثبيت npm. لا تزال مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر امتدادات Plugin.

    تثبيتات Claude marketplace مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدِّد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من API الـ Plugin المعلنة / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw حزمة npm-pack ذات الإصدار `.tgz`، ويتحقق من رأس بصمة ClawHub وبصمة الأثر، ثم يثبّتها عبر مسار الأرشيف العادي. تظل إصدارات ClawHub الأقدم التي لا تحتوي على بيانات ClawPack الوصفية تُثبَّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجّلة ببيانات مصدر ClawHub الوصفية، ونوع الأثر، وسلامة npm، و`shasum` الخاص بـ npm، واسم ملف tarball، وحقائق بصمة ClawPack للتحديثات اللاحقة.
تحافظ تثبيتات ClawHub غير محددة الإصدار على مواصفة مسجّلة غير محددة الإصدار كي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي الخاصة بـ Claude عند `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="مصادر السوق">
    - اسم سوق معروف لـ Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد الأسواق البعيدة">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S) والمسارات المطلقة وgit وGitHub وغيرها من مصادر Plugin غير المسارية من ملفات البيان البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- عناصر Plugin أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. تدعم اليوم Skills الحزمة، وSkills أوامر Claude، وافتراضيات Claude `settings.json`، وافتراضيات Claude `.lsp.json` / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة الخطافات المتوافقة مع Codex؛ أما قدرات الحزم المكتشفة الأخرى فتظهر في التشخيصات/المعلومات لكنها لم تُوصَل بعد بتنفيذ وقت التشغيل.
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
  اعرض عناصر Plugin المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التفعيل الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولًا، مع بديل مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد هذا في التحقق مما إذا كان Plugin مثبتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو التفعيل أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` جديد أو الخطافات. في عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` حالة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على مسار البحث العادي `node_modules` الخاص بـ Node للـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin أو يشغّل مدير حزم أو يصلح التبعيات
المفقودة.
</Note>

`plugins search` هو بحث بعيد في فهرس ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبّت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، و
تلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
كتركيب ربط فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة تلك
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ عاديًا
فيبقى غير نشط، لذلك تظل التثبيتات المعبأة العادية تستخدم `dist` المبنية.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجّلة والتشخيصات من جولة فحص حمّلت الوحدة. لا يثبّت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة عناصر Plugin القابلة للتنزيل المفقودة والمشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` الـ Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. خريطة `installRecords` ذات المستوى الأعلى هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك سجلات بيانات Plugin المكسورة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير، ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المرفقة في الإعدادات، تعاملها قراءات وقت التشغيل كمدخل توافق دون إعادة كتابة `openclaw.json`. تنقل عمليات كتابة Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعدادات عندما تكون كتابة الإعدادات مسموحة؛ وإذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات حتى لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قوائم السماح/المنع الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الانطباق. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. بالنسبة إلى عناصر Plugin الخاصة بـ Active Memory، تُعاد خانة الذاكرة إلى `memory-core`.

<Note>
يُدعم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجّلة لذلك الـ Plugin. يعني ذلك أن وسوم التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة هذا رجوعًا إلى سجل Plugin المتتبع، ويحدث ذلك الـ Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضًا إلى الحل رجوعًا إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة بيتا، تحاول سجلات Plugin الخاصة بخط الإصدار الافتراضي في npm وClawHub استخدام `@beta` أولًا، ثم تعود إلى المواصفة الافتراضية/الأحدث المسجّلة إذا لم يوجد إصدار بيتا للـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

    لا يعرّض OpenClaw بعد قنوات Plugin للدعم LTS أو الشهري. سيحتاج عمل خط الدعم المخطط إلى أن تتبع حزمة Plugin ووسوم ClawHub خط الدعم نفسه مثل الحزمة الأساسية.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجّلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد تجزئة سلامة مخزنة وتتغير تجزئة الأثر المجلب، يتعامل OpenClaw مع ذلك كانحراف أثر npm. يطبع الأمر التفاعلي `openclaw plugins update` التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بشكل مغلق ما لم يوفر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="`--dangerously-force-unsafe-install` عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الشيفرة الخطرة المدمج أثناء تحديثات Plugin. ما زال لا يتجاوز حظر سياسة Plugin `before_install` أو الحظر الناتج عن فشل الفحص، وينطبق فقط على تحديثات Plugin، لا على تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، ورايات السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد كود وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجّلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرةً؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة للـ Plugin كمجموعات أوامر جذرية لـ `openclaw`. بعد أن يعرض `inspect --runtime` أمرًا تحت `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع capability واحد (مثل Plugin مخصص للموفر فقط)
- **hybrid-capability** — أنواع capability متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، بلا capabilities أو surfaces
- **non-capability** — أدوات/أوامر/خدمات ولكن بلا capabilities

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج capability.

<Note>
يعرض علم `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الشكل، وأنواع capability، وإشعارات التوافق، وcapabilities الحزمة، وأعمدة ملخص hooks. يُعد `info` اسمًا مستعارًا لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات manifest/discovery، وإشعارات التوافق. عندما يكون كل شيء سليمًا، يطبع `No plugin issues detected.`

إذا كان Plugin مكوّن موجودًا على القرص ولكن تمنعه فحوصات سلامة المسار الخاصة بالمحمّل، فإن التحقق من صحة الإعدادات يبقي إدخال Plugin ويبلّغ عنه بأنه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعامة، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

لحالات فشل شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمرة في OpenClaw لهوية Plugins المثبتة، وتمكينها، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك الموفر، وتصنيف إعداد القناة، وجرد Plugins قراءته من دون استيراد وحدات runtime الخاصة بـ Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugins المستمر، وسياسة الإعدادات، وبيانات تعريف manifest/package. هذا مسار إصلاح، وليس مسار تفعيل runtime.

يقوم `openclaw doctor --fix` أيضًا بإصلاح الانحراف المدار المرتبط بالسجل في npm: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستردة ضمن جذر npm المدار الخاص بـ Plugin أحد Plugins المضمّنة، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل بحيث يتحقق بدء التشغيل مقابل manifest المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الزجاج عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ خيار env الاحتياطي مخصص فقط لاسترداد بدء التشغيل في الطوارئ أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة Marketplace مسار Marketplace محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى manifest Marketplace المحلل وإدخالات Plugin.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

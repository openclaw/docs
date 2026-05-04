---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد استكشاف حالات فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T07:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway وحزم الخطافات والحزم المتوافقة.

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
    حقول البيان ومخطط التكوين.
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

للتحقيق في بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويُبقي مخرجات JSON قابلة للتحليل. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها ممكّنًا افتراضيًا (مثل موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. وتعرض مخرجات القائمة/المعلومات المطوّلة أيضًا النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) إضافةً إلى إمكانات الحزمة المكتشفة.
</Note>

### التثبيت

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # npm by default
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
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
تُثبّت أسماء الحزم المجردة من npm افتراضيًا أثناء مرحلة التحويل عند الإطلاق. استخدم `clawhub:<package>` من أجل ClawHub. تعامل مع تثبيتات Plugin كما تتعامل مع تشغيل التعليمات البرمجية. يُفضّل استخدام الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس في Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مسارًا احتياطيًا ومدعومًا للتثبيت المباشر. عادت حزم Plugin المملوكة لـ OpenClaw
بصيغة `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
وتفضّل تثبيتات وتحديثات قناة beta وسم توزيع npm المسمى `beta` عندما يكون ذلك الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات التكوين وإصلاح التكوين غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بشكل مغلق بدلًا من تسطيحها. راجع [تضمينات التكوين](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كان التكوين غير صالح أثناء التثبيت، فعادةً يفشل `plugins install` بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، يفشل تكوين Plugin غير الصالح بشكل مغلق مثل أي تكوين غير صالح آخر؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن يتطلب أن تختار Plugins صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد تثبيت المعرّف نفسه عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات المعتادة لـ Plugin من npm متتبَّع مسبقًا، يُفضّل استخدام `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت مسبقًا، فسيتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع تثبيتات `git:`؛ استخدم مرجع Git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار طوارئ للإيجابيات الكاذبة في ماسح التعليمات البرمجية الخطرة المدمج. يسمح بمتابعة التثبيت حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز كتل سياسة خطاف Plugin `before_install` و**لا** يتجاوز إخفاقات الفحص.

    تنطبق علامة CLI هذه على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skills من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + اختياريًا **إصدار دقيق** أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا ضمن المشروع مع `--ignore-scripts` للسلامة، حتى إذا كانت لدى shell لديك إعدادات تثبيت npm عالمية.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. كما تُثبّت مواصفات الحزم المجردة مباشرةً من npm أثناء مرحلة التحويل عند الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة من OpenClaw مثل `2026.5.3-1` إصدارات مستقرة لهذا الفحص. إذا حل npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع Git. تتضمن الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وعناوين الاستنساخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو التزام قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتستخرج المرجع المطلوب عندما يكون موجودًا، ثم تستخدم مثبّت دليل Plugin المعتاد. يعني ذلك أن التحقق من البيان، وفحص التعليمات البرمجية الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات Git المسجلة عنوان URL/المرجع للمصدر إضافةً إلى الالتزام المحلول بحيث يمكن لـ `openclaw plugins update` إعادة حل المصدر لاحقًا.

    بعد التثبيت من Git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذرية لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ أما الأرشيفات التي تحتوي فقط على `package.json` فتُرفض قبل أن يكتب OpenClaw سجلات التثبيت.

    تثبيتات سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدِّد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبّت مواصفات Plugin الآمنة لـ npm والمجردة من npm افتراضيًا أثناء مرحلة التحويل عند الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API المعلن لـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw ملف `.tgz` الخاص بـ npm-pack المرقّم بالإصدار، ويتحقق من رأس بصمة ClawHub وبصمة الأثر، ثم يثبته عبر مسار الأرشيف المعتاد. ما زالت إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبّت عبر مسار التحقق من أرشيف الحزمة القديم. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وnpm integrity، وnpm shasum، واسم tarball، وحقائق بصمة ClawPack لاستخدامها في التحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير المرقّمة بإصدار بمواصفة مسجلة غير مرقّمة كي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبّتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي لدى Claude في `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="قواعد السوق البعيد">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S) والمسارات المطلقة وgit وGitHub وغيرها من المصادر غير المسارية من البيانات البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin المعتاد وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الحزم، وSkills أوامر Claude، وافتراضات `settings.json` الخاصة بـ Claude، وافتراضات `.lsp.json` الخاصة بـ Claude / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة hooks المتوافقة مع Codex؛ أما قدرات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها لم تُوصَل بعد بتنفيذ وقت التشغيل.
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
  مخزون قابل للقراءة آليًا مع تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المستدام أولًا، مع مسار احتياطي مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو التمكين أو سياسة hooks أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو hooks. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على مسار بحث Node المعتاد عن `node_modules` الخاص بـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح التبعيات
المفقودة.
</Note>

`plugins search` هو بحث في كتالوج ClawHub البعيد. لا يفحص الحالة المحلية،
ولا يغيّر التكوين، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص،
وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

لعمل Plugin مضمّن داخل صورة Docker معبأة، اعمل تحميل ربط لدليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة تلك
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ نسخًا عاديًا
فيبقى غير نشط بحيث تظل التثبيتات المعبأة المعتادة تستخدم dist المترجم.

لتصحيح hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من جولة فحص تُحمّل الوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو تثبيت Plugins القابلة للتنزيل المفقودة والمكوّنة.
- يؤكد `openclaw gateway status --deep --require-rpc` أن Gateway يمكن الوصول إليه، مع تلميحات الخدمة/العملية، ومسار التكوين، وصحة RPC.
- تتطلب hooks المحادثات غير المضمّنة (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` مع تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مقفل.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة تديرها الآلة، وليست تكوينًا للمستخدم. تكتبها عمليات التثبيت والتحديثات إلى `plugins/installs.json` تحت دليل حالة OpenClaw النشط. خريطة المستوى الأعلى `installRecords` هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك سجلات بيانات Plugin المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير ويستخدمه `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في التكوين، ينقلها إلى فهرس Plugin ويزيل مفتاح التكوين؛ وإذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات التكوين حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` وفهرس Plugin المستدام وإدخالات قوائم السماح/الحظر الخاصة بـ Plugin وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم ضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتعقب عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins Active Memory، تُعاد فتحة الذاكرة إلى `memory-core`.

<Note>
`--keep-config` مدعوم كاسم مستعار مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتعقبة في فهرس Plugin المُدار وتثبيتات حزم hooks المتعقبة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المقفلة تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة إلى سجل Plugin المتعقب، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية القائمة على المعرّف.

    تمرير اسم حزمة npm دون إصدار أو وسم يحل أيضًا إلى سجل Plugin المتعقب. استخدم هذا عندما يكون Plugin مقفلًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتعقبة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة بيتا، تجرب سجلات Plugin في npm وClawHub ذات الخط الافتراضي `@beta` أولًا، ثم تعود إلى مواصفة الافتراضي/الأحدث المسجلة إذا لم يكن هناك إصدار بيتا لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مقفلة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة سلامة مخزنة وتتغير بصمة الأثر المجلب، يتعامل OpenClaw مع ذلك كأنه انحراف أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمتين المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية على وضع الإيقاف الآمن ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الكود الخطر المدمج أثناء تحديثات Plugin. لكنه لا يزال لا يتجاوز حواجز سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات حزم hooks.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين hooks والأدوات والأوامر والخدمات وأساليب Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ وتظل عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية في `openclaw`. بعد أن يعرض `inspect --runtime` أمرًا تحت `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاص بمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، دون قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد حول نموذج القدرات.

<Note>
ينتج علم `--json` تقريرًا قابلًا للقراءة آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى المجموعة يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزم، وملخص hooks. `info` اسم مستعار لـ `inspect`.
</Note>

### التشخيص

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin وتشخيصات البيان/الاكتشاف وإشعارات التوافق. عندما يكون كل شيء سليمًا يطبع `No plugin issues detected.`

إذا كان Plugin مكوّنًا موجودًا على القرص لكنه محظور بفحوصات أمان المسار في المحمّل، فإن التحقق من التكوين يبقي إدخال Plugin ويبلّغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل تصديرات `register`/`activate` المفقودة، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مدمج لشكل التصديرات في خرج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المستدام في OpenClaw لهوية Plugin وتمكينه وبيانات تعريف المصدر وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القنوات، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا أو محدثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ، وسياسة الإعدادات، وبيانات تعريف manifest/package. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الحاجز عند فشل قراءة السجل. فضّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاسترداد بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر التي تم حلها بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

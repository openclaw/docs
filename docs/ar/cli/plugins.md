---
read_when:
    - تريد تثبيت إضافات Gateway أو الحِزم المتوافقة أو إدارتها
    - تريد استكشاف إخفاقات تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-03T21:29:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d854d052b0a012a86f9c775775676a9a8fe8ae86b2c38a18118f1abf0732174c
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
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
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبّع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمّنة مع OpenClaw. بعضها مفعّل افتراضياً (على سبيل المثال موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ بينما يتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية الخاصة بـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمّن (`configSchema`، حتى لو كان فارغاً). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلاً من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات التفصيلية نوع الحزمة الفرعي (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
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
تُثبَّت أسماء الحزم المجردة من npm افتراضياً أثناء انتقال الإطلاق. استخدم `clawhub:<package>` من أجل ClawHub. تعامل مع تثبيتات Plugin كأنها تشغيل كود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مساراً احتياطياً مدعوماً ومسار تثبيت مباشر. عادت حزم Plugin المملوكة لـ OpenClaw
ذات النطاق `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[جرد Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` الخاص بـ npm عندما يكون ذلك الوسم
متاحاً، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعوماً بـ `$include` أحادي الملف، فإن `plugins install/update/enable/disable/uninstall` تكتب عبر ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل التضمينات الجذرية، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بإغلاق آمن بدلاً من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولاً. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي إعدادات أخرى غير صالحة؛ يمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن من أجل Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة بالفعل في مكانها. استخدمه عندما تعيد عمداً تثبيت نفس المعرّف من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أداة npm. للترقيات الروتينية لـ Plugin خاص بـ npm تتم متابعته بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلاً استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحاً مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدراً مثبتاً. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحتفظ ببيانات تعريف مصدر السوق بدلاً من spec خاص بـ npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار كسر زجاج للحالات الإيجابية الخاطئة في ماسح الكود الخطير المضمّن. يسمح بمواصلة التثبيت حتى عندما يبلّغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاص بـ Plugin، و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` مسار تنزيل/تثبيت Skills منفصلاً من ClawHub.

    إذا حُظر Plugin نشرته على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضاً سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` للرؤية المفلترة للخطافات ولتفعيل كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محلياً على مستوى المشروع مع `--ignore-scripts` من أجل السلامة، حتى عندما تكون في صدفتك إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحاً. كما تُثبّت مواصفات الحزم المجردة مباشرة من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إذا حلّ npm أياً منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسمي (على سبيل المثال `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تتضمن الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وعناوين نسخ كاملة من `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لجلب فرع أو وسم أو commit قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتجلب المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. وهذا يعني أن التحقق من البيان، وفحص الكود الخطير، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقاً.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجّل Plugin جذراً لـ CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرة عبر CLI الجذري لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية الخاصة بـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي على `package.json` فقط قبل أن يكتب OpenClaw سجلات التثبيت.

    تُدعم أيضاً تثبيتات سوق Claude.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحاً `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبّت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضياً أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحاً:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API المعلن لـ Plugin / الحد الأدنى لتوافق gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أداة ClawPack، ينزّل OpenClaw ملف `.tgz` المعبأ من npm ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأداة، ثم يثبّته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub الخاصة بها، ونوع الأداة، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجوداً في ذاكرة التخزين المؤقت المحلية لسجل Claude في `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="مصادر Marketplace">
    - اسم Marketplace معروف في Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر Marketplace محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد Marketplace البعيد">
    بالنسبة إلى Marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع Marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugin غير المسارية من ملفات البيان البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّن Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعَم Skills الحزم، وSkills أوامر Claude، وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` / `lspServers` المعلنة في البيان في Claude، وSkills أوامر Cursor، ومجلدات hook المتوافقة مع Codex؛ وتُعرض إمكانات الحزم المكتشفة الأخرى في التشخيصات/المعلومات، لكنها ليست موصولة بعد بتنفيذ وقت التشغيل.
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
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل وحالة تثبيت اعتماديات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المستمر أولًا، مع خيار احتياطي مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبّتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو تمكينه أو سياسة hook أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو hooks الجديدة. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل عملية `openclaw gateway run` الفرعية الفعلية، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على مسار بحث `node_modules` العادي في Node الخاص بـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح
الاعتماديات المفقودة.
</Note>

`plugins search` هو بحث في فهرس ClawHub البعيد. لا يفحص الحالة المحلية، ولا يغيّر الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبّأة، اربط مجلد مصدر Plugin
فوق مسار المصدر المعبّأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة تلك
قبل `/app/dist/extensions/synology-chat`؛ ويبقى مجلد المصدر المنسوخ العادي
غير فعّال بحيث تظل عمليات التثبيت المعبّأة العادية تستخدم dist المترجم.

لتصحيح أخطاء hook وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من تمريرة فحص محمّلة كوحدة. لا يثبت فحص وقت التشغيل الاعتماديات مطلقًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة الاعتماديات القديمة أو تثبيت Plugins القابلة للتنزيل المفقودة والمكوّنة.
- يؤكد `openclaw gateway status --deep --require-rpc` قابلية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار الإعداد، وصحة RPC.
- تتطلب hooks المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ مجلد محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` غير مدعوم مع `--link` لأن عمليات التثبيت المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة تُدار آليًا، وليست إعداد مستخدم. تكتب عمليات التثبيت والتحديثات هذه البيانات إلى `plugins/installs.json` ضمن مجلد حالة OpenClaw النشط. خريطة `installRecords` في المستوى الأعلى هي المصدر المستمر لبيانات تعريف التثبيت، بما في ذلك السجلات الخاصة ببيانات Plugin المكسورة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير، ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعداد؛ وإذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات كي لا تُفقد بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قوائم السماح/الحظر لـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الانطباق. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا مجلد التثبيت المُدار المتتبع عندما يكون داخل جذر إضافات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تعود خانة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حزم hook المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. يعني ذلك أن وسوم dist المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تظل مستخدمة في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم dist أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذلك إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبّت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    كما أن تمرير اسم حزمة npm دون إصدار أو وسم يحل أيضًا إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة Beta">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: في قناة beta، تحاول سجلات npm وClawHub الخاصة بخط الإصدار الافتراضي استخدام `@beta` أولًا، ثم تعود إلى مواصفة default/latest المسجلة إذا لم يوجد إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يُتجاوز التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد قيمة تجزئة سلامة مخزنة وتتغير قيمة تجزئة الأثر المجلب، يتعامل OpenClaw مع ذلك على أنه انحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي قيمتي التجزئة المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بإغلاق آمن ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة في فحص الكود الخطر المدمج أثناء تحديثات Plugin. لكنه لا يزال لا يتجاوز حواجز سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، وينطبق فقط على تحديثات Plugin، وليس تحديثات حزم hook.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وإمكانات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين hooks، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن اعتماديات Plugin المفقودة مباشرة؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install`، و`openclaw plugins update`، و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر `openclaw` جذرية. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin حسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع إمكانية واحد (مثل Plugin لمزوّد فقط)
- **hybrid-capability** — عدة أنواع إمكانات (مثل نص + كلام + صور)
- **hook-only** — hooks فقط، بلا إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمعرفة المزيد عن نموذج الإمكانات.

<Note>
يخرج علم `--json` تقريرًا قابلًا للقراءة آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول مع أعمدة الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحزمة، وملخص hook. `info` اسم مستعار لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا يطبع `No plugin issues detected.`

إذا كان Plugin مكوّن موجودًا على القرص لكنه محظور بفحوصات أمان المسار الخاصة بالمحمّل، يُبقي تحقق الإعداد إدخال Plugin ويبلّغ عنه بأنه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى حالات فشل شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصدير في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المستمر في OpenClaw لهوية Plugin المثبّت، وتمكينه، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو محدثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر وسياسة الإعداد وبيانات manifest/package الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق قديم مخصص لحالات الطوارئ عند فشل قراءة السجل. فضّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع إلى env مخصص فقط لاستعادة بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر التي تم حلها إضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

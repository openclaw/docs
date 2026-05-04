---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد استكشاف إخفاقات تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T09:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway وحزم الخطافات والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف أخطائها وإصلاحها.
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
    تعزيز الأمان لعمليات تثبيت Plugin.
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
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (على سبيل المثال موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ ويتطلب البعض الآخر `plugins enable`.

يجب أن تتضمن Plugins الأصلية في OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمّن (`configSchema`، حتى لو كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطوّلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
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
تُثبَّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugin كما تتعامل مع تشغيل الكود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو واجهة التوزيع والاكتشاف الأساسية لمعظم Plugins. يظل Npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشر. عادت حزم Plugin المملوكة لـ OpenClaw
باسم `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث في قناة بيتا وسم التوزيع `beta` في npm عندما يكون ذلك الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعداد وإصلاح الإعداد غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` في ملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بشكل مغلق بدلًا من التسطيح. راجع [تضمينات الإعداد](/ar/gateway/configuration) للاطلاع على الأشكال المدعومة.

    إذا كان الإعداد غير صالح أثناء التثبيت، فإن `plugins install` يفشل عادةً بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء Gateway وإعادة التحميل الساخن، يفشل إعداد Plugin غير الصالح بشكل مغلق مثل أي إعداد غير صالح آخر؛ يمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن لـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة بالفعل في مكانها. استخدمه عندما تعيد تثبيت نفس المعرّف عمدًا من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin من npm متتبّع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، يوقف OpenClaw العملية ويوجّهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار كسر طوارئ للنتائج الإيجابية الكاذبة في ماسح الكود الخطير المضمّن. يسمح للتثبيت بالاستمرار حتى عندما يبلّغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز كتل سياسة خطاف `before_install` الخاصة بـ Plugin، و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` مسار تنزيل/تثبيت Skills منفصلًا في ClawHub.

    إذا حُظر Plugin نشرته على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا واجهة التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتفعيل كل خطاف، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا على مستوى المشروع مع `--ignore-scripts` للأمان، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تُثبَّت مواصفات الحزم المجردة أيضًا مباشرة من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على مسار الاستقرار. تُعد إصدارات التصحيح ذات الطابع الزمني في OpenClaw مثل `2026.5.3-1` إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا منها إلى إصدار تمهيدي، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحةً باستخدام وسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرة. لتثبيت حزمة npm تحمل الاسم نفسه، استخدم مواصفة نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الأشكال المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وروابط النسخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. وهذا يعني أن التحقق من البيان، وفحص الكود الخطير، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة رابط/مرجع المصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرة عبر CLI الجذرية لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية في OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    تُدعم أيضًا تثبيتات Claude marketplace.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin الآمنة لـ npm المجردة من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل حل npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق واجهة برمجة تطبيقات Plugin المعلن عنها / الحد الأدنى لتوافق gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw ملف `.tgz` المعبأ عبر npm والموسوم بالإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبّته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم من دون بيانات تعريف ClawPack تُثبَّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبّتة على ذلك المحدد.

#### اختصار Marketplace

استخدم اختصار `plugin@marketplace` عندما يكون اسم marketplace موجودًا في ذاكرة سجل Claude المحلية المؤقتة في `~/.claude/plugins/known_marketplaces.json`:

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

<Tabs>
  <Tab title="مصادر السوق">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد السوق البعيد">
    بالنسبة إلى الأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S) والمسارات المطلقة وgit وGitHub وغيرها من المصادر غير المسارية من البيانات التعريفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تثبت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليا، تكون Skills الخاصة بالحزم، وSkills أوامر Claude، وافتراضيات Claude `settings.json`، وافتراضيات Claude `.lsp.json` / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة مدعومة؛ أما قدرات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها لم توصل بعد بالتنفيذ وقت التشغيل.
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
  اعرض Plugins الممكنة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التفعيل الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليا مع تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugins المحلي المستمر أولا، مع بديل مشتق من البيانات التعريفية فقط عند فقدان السجل أو عدم صلاحيته. يفيد ذلك في التحقق مما إذا كان Plugin مثبتا وممكنا ومرئيا لتخطيط بدء التشغيل البارد، لكنه ليس فحصا مباشرا وقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو حالة التمكين أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو الخطافات الجديدة. بالنسبة إلى النشرات البعيدة/الحاوية، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على مسار بحث Node `node_modules` العادي الخاص بـ Plugin؛ ولا يستورد كود
تشغيل Plugin، أو يشغل مدير حزم، أو يصلح التبعيات المفقودة.
</Note>

`plugins search` هو بحث في كتالوج ClawHub البعيد. لا يفحص الحالة المحلية،
ولا يغير الإعدادات، ولا يثبت الحزم، ولا يحمل كود تشغيل Plugin. تتضمن نتائج
البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل
`openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة تلك
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ العادي
فيبقى خاملا بحيث تستمر التثبيتات المعبأة العادية في استخدام dist المترجم.

لتصحيح خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من تمريرة فحص محملة كوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو تثبيت Plugins القابلة للتنزيل والمهيأة المفقودة.
- يؤكد `openclaw gateway status --deep --require-rpc` إمكانية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمنة (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضاف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` غير مدعوم مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلا من النسخ فوق هدف تثبيت مدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مدارة آليا، وليست إعدادات مستخدم. تكتب عمليات التثبيت والتحديث هذه البيانات إلى `plugins/installs.json` تحت دليل حالة OpenClaw النشط. خريطة `installRecords` العلوية هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك سجلات بيانات Plugin التعريفية المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل التشغيل البارد المشتقة من البيانات التعريفية. يتضمن الملف تحذيرا بعدم التحرير ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعدادات؛ إذا فشلت أي من عمليتي الكتابة، تبقى سجلات الإعدادات حتى لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قوائم السماح/الرفض لـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم ضبط `--keep-files`، يزيل إلغاء التثبيت أيضا دليل التثبيت المدار المتتبع عندما يكون داخل جذر إضافات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، يعاد ضبط فتحة الذاكرة إلى `memory-core`.

<Note>
`--keep-config` مدعوم كاسم بديل مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المدار وتثبيتات حزم الخطافات المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. هذا يعني أن وسوم dist-tags المخزنة سابقا مثل `@beta` والإصدارات الدقيقة المثبتة تواصل استخدامها في عمليات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذلك مرة أخرى إلى سجل Plugin المتتبع، ويحدث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرف.

    تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضا مرة أخرى إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة beta">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضا قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات Plugin الافتراضية من npm وClawHub استخدام `@beta` أولا، ثم ترجع إلى المواصفة الافتراضية/الأحدث المسجلة إذا لم يوجد إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتخطى التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد قيمة تجزئة سلامة مخزنة وتتغير تجزئة الأثر المجلب، يتعامل OpenClaw مع ذلك بوصفه انحراف أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدينات التحديث غير التفاعلية بوضع مغلق ما لم يوفر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضا في `plugins update` كتجاوز طارئ لإيجابيات فحص الكود الخطر المضمنة الكاذبة أثناء تحديثات Plugin. ما زال لا يتجاوز حظر سياسة Plugin `before_install` أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيانات التعريفية، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP من دون استيراد تشغيل Plugin افتراضيا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ أما التثبيتات والإصلاحات فتبقى في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تثبت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر `openclaw` جذرية. بعد أن يعرض `inspect --runtime` أمرا ضمن `cliCommands`، شغله بصيغة `openclaw <command> ...`؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يصنف كل Plugin بحسب ما يسجله فعليا وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin لموفر فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، بلا قدرات أو واجهات
- **non-capability** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج القدرات.

<Note>
تخرج علامة `--json` تقريرا قابلا للقراءة آليا ومناسبا للبرمجة والتدقيق. يعرض `inspect --all` جدولا على مستوى المجموعة يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. `info` اسم بديل لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيانات التعريفية/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليما، يطبع `No plugin issues detected.`

إذا كان Plugin مهيأ موجودا على القرص لكنه محظور بفحوصات سلامة المسار الخاصة بالمحمل، تبقي عملية التحقق من الإعدادات إدخال Plugin وتبلغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلا من إزالة إعدادات `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمر الخاص بـ OpenClaw لهوية Plugin، والتمكين، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك الموفر، وتصنيف إعداد القناة، ومخزون Plugin قراءته من دون استيراد وحدات تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا أو حاليًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ وسياسة الإعدادات وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يصلح `openclaw doctor --fix` أيضًا الانحراف المُدار في npm المجاور للسجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستردة ضمن جذر npm المُدار الخاص بـ Plugin تحجب Plugin مضمّنًا، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل البيان المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الزجاج لحالات فشل قراءة السجل. يُفضَّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ والرجوع الاحتياطي عبر متغير البيئة مخصص فقط لاسترداد بدء التشغيل الطارئ أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلّل وإدخالات Plugin.

## ذات صلة

- [بناء Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugin المجتمع](/ar/plugins/community)

---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد استكشاف إخفاقات تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T09:02:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e584092c6cdaf87681aef2ed106c299e3bab0552305b669c66b05deb61bf25ce
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugin الخاصة بـ Gateway وحِزم الخطافات والحِزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت والعرض والتحديث وإلغاء التثبيت والنشر.
  </Card>
  <Card title="حِزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحِزم.
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

للتحقيق في بطء التثبيت أو الفحص أو إلغاء التثبيت أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تُشحن Plugins المضمّنة مع OpenClaw. يُمكَّن بعضها افتراضيًا (مثل موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح المضمّنة)؛ ويتطلب البعض الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية لـ OpenClaw الملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إن كان فارغًا). تستخدم الحِزم المتوافقة بيانات الحِزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطوّلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
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
تُثبَّت أسماء الحِزم المجرّدة من npm افتراضيًا أثناء الانتقال الأولي للإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugin كما تتعامل مع تشغيل الكود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حِزم Plugin القابلة للتثبيت ويطبع
أسماء حِزم جاهزة للتثبيت. يبحث في حِزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يبقى npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. عادت حِزم Plugin المملوكة لـ OpenClaw
ضمن `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[جرد Plugin](/ar/plugins/plugin-inventory). تستخدم عمليات التثبيت المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث في قناة Beta وسم التوزيع `beta` في npm عندما يكون
هذا الوسم متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمَّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات ذات التجاوزات الشقيقة بصورة مغلقة بدلًا من تسطيحها. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للاطلاع على الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بصورة مغلقة ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء Gateway وإعادة التحميل الساخنة، تفشل إعدادات Plugin غير الصالحة بصورة مغلقة مثل أي إعدادات أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّنة تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد أو أرشيف أو حزمة ClawHub أو أثر npm. للترقيات الروتينية لـ Plugin من npm متتبعة بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت مسبقًا، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` هو خيار لكسر القيود للحالات الإيجابية الكاذبة في ماسح الكود الخطِر المدمج. يسمح بمتابعة التثبيت حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسات خطاف `before_install` الخاص بـ Plugin ولا **يتجاوز** إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم عمليات تثبيت تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` مسارًا منفصلًا لتنزيل/تثبيت Skills من ClawHub.

    إذا حُظرت Plugin نشرتها على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حِزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا سطح التثبيت لحِزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المصفّاة وتمكين كل خطاف على حدة، لا لتثبيت الحِزم.

    مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تُنفَّذ عمليات تثبيت التبعيات محليًا داخل المشروع مع `--ignore-scripts` للسلامة، حتى عندما تتضمن صدفتك إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تُثبّت مواصفات الحِزم المجرّدة أيضًا مباشرة من npm أثناء الانتقال الأولي للإطلاق.

    تبقى المواصفات المجرّدة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة من OpenClaw مثل `2026.5.3-1` إصدارات مستقرة لهذا الفحص. إذا حل npm أيًا من هذين إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وعناوين النسخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` للتحويل إلى فرع أو وسم أو التزام قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتتحول إلى المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن تحقق البيان، وفحص الكود الخطِر، وعمل تثبيت مدير الحِزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان/مرجع المصدر بالإضافة إلى الالتزام المحلول بحيث يستطيع `openclaw plugins update` إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجّلت Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرة عبر CLI الجذرية لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف tarball من npm-pack وتريد
    اختبار مسار تثبيت npm-root المُدار نفسه الذي تستخدمه تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة، وسجلات
    تثبيت npm. لا تزال مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر امتدادات Plugin.

    تُدعم أيضًا تثبيتات سوق Claude.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محددًا صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin الآمنة لـ npm والمجرّدة من npm افتراضيًا أثناء الانتقال الأولي للإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل المحصور في npm صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق Plugin API المعلَن / الحد الأدنى لتوافق gateway قبل التثبيت. عندما تنشر نسخة ClawHub المحددة أثر ClawPack، ينزّل OpenClaw ملف npm-pack `.tgz` ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبّته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار بحيث يستطيع `openclaw plugins update` متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتبقى مثبتة بذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت المحلية لسجل Claude في `~/.claude/plugins/known_marketplaces.json`:

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
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد الأسواق البعيدة">
    بالنسبة للأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugin غير المسارية من بيانات البيان البعيدة.
  </Tab>
</Tabs>

بالنسبة للمسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيا:

- Plugins أصلية لـ OpenClaw ‏(`openclaw.plugin.json`)
- حزم متوافقة مع Codex ‏(`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude ‏(`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor ‏(`.cursor-plugin/plugin.json`)

<Note>
تثبت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليا، تدعم Skills الخاصة بالحزم، وSkills أوامر Claude، وافتراضات `settings.json` في Claude، وافتراضات `.lsp.json` في Claude / ‏`lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة؛ تظهر إمكانات الحزم المكتشفة الأخرى في التشخيصات/المعلومات لكنها لم توصل بعد إلى تنفيذ وقت التشغيل.
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
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليا مع تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولا، مع بديل مشتق من البيان فقط عند فقدان السجل أو عدم صلاحيته. يفيد ذلك في التحقق مما إذا كان Plugin مثبتا وممكنا ومرئيا لتخطيط بدء التشغيل البارد، لكنه ليس فحصا حيا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو حالة التمكين أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو الخطافات. بالنسبة لعمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية تغليف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على مسار البحث العادي `node_modules` الخاص بـ Node لـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، أو يشغل مدير حزم، أو يصلح
التبعيات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغير التهيئة، ولا يثبت الحزم، ولا يحمل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، و
تلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

لعمل Plugin مضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة هذه
قبل `/app/dist/extensions/synology-chat`؛ ويبقى دليل المصدر المنسوخ العادي
خاملا بحيث تستمر التثبيتات المعبأة العادية في استخدام dist المترجم.

لتصحيح خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من تمريرة فحص محملة كوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل المفقودة المشار إليها في التهيئة.
- يؤكد `openclaw gateway status --deep --require-rpc` إمكانية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار التهيئة، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` غير مدعوم مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلا من النسخ فوق هدف تثبيت مدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة مدارة آليا وليست تهيئة مستخدم. تكتبها عمليات التثبيت والتحديث إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. خريطة `installRecords` على المستوى الأعلى هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك السجلات الخاصة ببيانات بيان Plugin المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من البيان. يتضمن الملف تحذيرا بعدم التحرير ويستخدمه `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة في التهيئة، ينقلها إلى فهرس Plugin ويزيل مفتاح التهيئة؛ وإذا فشلت أي من عمليتي الكتابة، تبقى سجلات التهيئة حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قوائم السماح/المنع لـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم تضبط `--keep-files`، يزيل إلغاء التثبيت أيضا دليل التثبيت المدار المتتبع عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تعاد خانة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المدار وتثبيتات حزم الخطافات المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عند تمرير معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم التوزيع المخزنة سابقا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

    بالنسبة لتثبيتات npm، يمكنك أيضا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة هذا إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة لتحديثات المعرف المستقبلية.

    تمرير اسم حزمة npm بدون إصدار أو وسم يحل أيضا إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` بالإضافة إلى ذلك قناة تحديث OpenClaw النشطة: على قناة بيتا، تحاول سجلات Plugin الخاصة بـ npm وClawHub على الخط الافتراضي `@beta` أولا، ثم تعود إلى مواصفة الافتراضي/الأحدث المسجلة إذا لم يكن هناك إصدار بيتا لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتخطى التحديث بدون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عند وجود تجزئة سلامة مخزنة وتغير تجزئة الأثر المجلب، يعامل OpenClaw ذلك على أنه انحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بشكل مغلق ما لم يقدم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضا في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الكود الخطر المدمج أثناء تحديثات Plugin. لكنه لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، وينطبق فقط على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وإمكانات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP بدون استيراد وقت تشغيل Plugin افتراضيا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ تبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تثبت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية لـ `openclaw`. بعد أن يعرض `inspect --runtime` أمرا ضمن `cliCommands`، شغله بصيغة `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يصنف كل Plugin بحسب ما يسجله فعليا في وقت التشغيل:

- **plain-capability** — نوع إمكانية واحد (مثلا Plugin لموفر فقط)
- **hybrid-capability** — أنواع إمكانات متعددة (مثلا نص + كلام + صور)
- **hook-only** — خطافات فقط، بلا إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد حول نموذج الإمكانات.

<Note>
يخرج علم `--json` تقريرا قابلا للقراءة آليا مناسبا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولا شاملا للأسطول مع أعمدة الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحزم، وملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليما يطبع `No plugin issues detected.`

إذا كان Plugin مهيأ موجودا على القرص لكنه محظور بواسطة فحوصات أمان المسار في المحمل، تحتفظ عملية التحقق من التهيئة بإدخال Plugin وتبلغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعامة، بدلا من إزالة تهيئة `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة لإخفاقات شكل الوحدة مثل غياب تصديرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصديرات في إخراج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المستمر في OpenClaw لهوية Plugin المثبتة، وتمكينها، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو محدثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة التكوين، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يقوم `openclaw doctor --fix` أيضًا بإصلاح الانحراف المدار المرتبط بسجل npm: إذا كانت حزمة `@openclaw/*` يتيمة أو مستردة ضمن جذر npm المدار لـ Plugin تحجب Plugin مضمّنة، فإن doctor يزيل تلك الحزمة القديمة ويعيد بناء السجل بحيث يتحقق بدء التشغيل مقابل البيان المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الحاجز عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع إلى متغير البيئة مخصص فقط لاستعادة بدء التشغيل الطارئة أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة Marketplace مسار Marketplace محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان Marketplace المحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

---
read_when:
    - تريد تثبيت أو إدارة إضافات Gateway أو الحزم المتوافقة
    - تريد استكشاف حالات فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T20:43:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
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
    تعزيز الأمان لتثبيت Plugins.
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
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها ممكّنًا افتراضيًا (مثل موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح المضمّنة)؛ بينما يتطلب البعض الآخر `plugins enable`.

يجب أن تتضمن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمنة (`configSchema`، حتى لو كانت فارغة). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` إما `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المفصلة نوع الحزمة الفرعي (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
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
تثبّت أسماء الحزم المجرّدة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` من أجل ClawHub. تعامل مع تثبيت Plugins كما تتعامل مع تشغيل التعليمات البرمجية. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` من أجل Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل Npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. أثناء الترحيل إلى
ClawHub، ما زال OpenClaw يوفّر بعض حزم Plugin المملوكة لـ OpenClaw بصيغة `@openclaw/*`
على npm؛ وقد تتأخر إصدارات تلك الحزم عن المصدر المضمّن بين قطارات إصدار Plugin.
إذا أبلغ npm أن حزمة Plugin مملوكة لـ OpenClaw مهملة، فإن ذلك
الإصدار المنشور أثر خارجي قديم؛ استخدم Plugin المضمّنة مع
OpenClaw الحالي أو نسخة محلية إلى أن تُنشر حزمة npm أحدث.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات واسترداد الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` لملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بشكل مغلق بدلًا من تسطيحها. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway، تُعزل الإعدادات غير الصالحة الخاصة بـ Plugin واحدة إلى تلك Plugin حتى تتمكن القنوات وPlugins الأخرى من متابعة العمل؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّنة خاصة بـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة بالفعل في مكانها. استخدمه عندما تتعمد إعادة تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبعة بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد حقًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبتًا. وهو غير مدعوم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار لكسر الحظر عند وجود نتائج إيجابية كاذبة في ماسح التعليمات البرمجية الخطرة المدمج. يسمح بمتابعة التثبيت حتى عندما يبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاص بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    تنطبق علامة CLI هذه على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات اعتماد Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skills من ClawHub.

    إذا حُظرت Plugin نشرتها على ClawHub بواسطة فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات الاعتمادات محليًا على مستوى المشروع مع `--ignore-scripts` للسلامة، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تثبّت مواصفات الحزم المجرّدة أيضًا مباشرةً من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجرّدة و`@latest` على المسار المستقر. إذا حل npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسمية (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وعناوين النسخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو commit قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص التعليمات البرمجية الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع المصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّلت Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً من خلال CLI الجذر لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    تثبيتات Claude marketplace مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تثبّت مواصفات Plugin الآمنة لـ npm والمجرّدة من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API المعلنة لـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw ملف `.tgz` المحزوم من npm والمحدد الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم من دون بيانات تعريف ClawPack تُثبّت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وسلامة npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار حتى يتمكن `openclaw plugins update` من تتبع إصدارات ClawHub الأحدث؛ وتبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار Marketplace

استخدم اختصار `plugin@marketplace` عندما يكون اسم marketplace موجودًا في ذاكرة السجل المحلية المؤقتة لـ Claude في `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="مصادر Marketplace">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر Marketplace محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد Marketplace البعيد">
    بالنسبة إلى Marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع Marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin التي تستخدم HTTP(S)، أو المسارات المطلقة، أو git، أو GitHub، أو غيرها من المصادر غير المسارية من البيانات الوصفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّنات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. حاليًا، تُدعَم Skills الخاصة بالحزم، وSkills أوامر Claude، وافتراضات `settings.json` في Claude، وافتراضات `.lsp.json` في Claude / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة؛ أما إمكانات الحزم الأخرى المكتشفة فتظهر في التشخيصات/info لكنها لم تُوصَل بعد بالتنفيذ وقت التشغيل.
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
  أظهر Plugins المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا مع تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولًا، مع رجوع مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. وهو مفيد للتحقق مما إذا كان Plugin مثبتًا ومفعّلًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin، أو التفعيل، أو سياسة الخطافات، أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو الخطافات الجديدة. بالنسبة إلى عمليات النشر البعيدة/داخل الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `dependencies` و`optionalDependencies` في `package.json`. يتحقق OpenClaw مما إذا كانت أسماء الحزم تلك موجودة على مسار بحث `node_modules` العادي الخاص بـ Plugin في Node؛ ولا يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح التبعيات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية، ولا يغيّر الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin فوق مسار المصدر المعبأ المطابق، مثل `/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة تلك قبل `/app/dist/extensions/synology-chat`؛ ويبقى دليل المصدر المنسوخ العادي غير فعّال بحيث تظل التثبيتات المعبأة العادية تستخدم dist المترجم.

لتصحيح خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من مرور فحص محمّل للوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو تثبيت Plugins القابلة للتنزيل والمكوّنة المفقودة.
- يؤكد `openclaw gateway status --deep --require-rpc` قابلية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتب التثبيتات والتحديثات هذه البيانات إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. خريطة `installRecords` ذات المستوى الأعلى هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك السجلات الخاصة ببيانات Plugin الوصفية المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل التشغيل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير ويُستخدم بواسطة `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعدادات؛ وإذا فشلت أي من عمليتي الكتابة، تُحفَظ سجلات الإعدادات حتى لا تُفقد بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قوائم السماح/الحظر الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الانطباق. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر إضافات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تعود فتحة الذاكرة إلى `memory-core`.

<Note>
يُدعَم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عند تمرير معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذاك إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية القائمة على المعرف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضًا إلى حله إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة beta">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. كما يعرف `openclaw update` قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات Plugin الخاصة بـ npm وClawHub على الخط الافتراضي استخدام `@beta` أولًا، ثم ترجع إلى المواصفة الافتراضية/الأحدث المسجلة إذا لم يوجد إصدار beta لذلك Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد تجزئة سلامة مخزنة وتتغير تجزئة الأثر المجلوب، يتعامل OpenClaw مع ذلك باعتباره انحرافًا في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بشكل مغلق ما لم يوفّر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الكود الخطر المضمّن أثناء تحديثات Plugin. لا يزال لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، وينطبق فقط على تحديثات Plugin، لا على تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وإمكانات الحزم، وأي دعم مكتشف لخوادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ تبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر `openclaw` جذرية. بعد أن يعرض `inspect --runtime` أمرًا تحت `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin حسب ما يسجله فعليًا وقت التشغيل:

- **plain-capability** — نوع إمكانات واحد (مثل Plugin خاص بمزوّد فقط)
- **hybrid-capability** — عدة أنواع إمكانات (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، دون إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن دون إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج الإمكانات.

<Note>
يخرج العلم `--json` تقريرًا قابلًا للقراءة آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحزم، وأعمدة ملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا يطبع `No plugin issues detected.`

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المحفوظ في OpenClaw لهوية Plugin المثبت، وتفعيله، وبيانات مصدره الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ، وسياسة الإعدادات، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل للحالات الطارئة عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع الاحتياطي عبر متغير البيئة مخصص فقط لاستعادة بدء التشغيل في الطوارئ أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر التي تم حلها بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذات صلة

- [إنشاء Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

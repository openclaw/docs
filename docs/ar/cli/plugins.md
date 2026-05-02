---
read_when:
    - تريد تثبيت Plugins الخاصة بـ Gateway أو الحزم المتوافقة أو إدارتها
    - تريد تصحيح أخطاء حالات فشل تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T22:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والقائمة، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
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
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

للتحقيق في بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (على سبيل المثال موفرو النماذج المضمنون، وموفرو الكلام المضمنون، وPlugin المتصفح المضمن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية الخاصة بـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إذا كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. وتعرض مخرجات القائمة/المعلومات المطولة أيضًا النوع الفرعي للحزمة (`codex`، أو `claude`، أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
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
تُثبَّت أسماء الحزم المجرّدة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugin كما تتعامل مع تشغيل كود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل Npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشر. عادت حزم Plugin المملوكة لـ OpenClaw
ذات النمط `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` في npm عندما يكون ذلك الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات واسترداد الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` لملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بإغلاق آمن بدل التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway، تُعزل الإعدادات غير الصالحة لـ Plugin واحد إلى ذلك الـ Plugin حتى تتمكن القنوات وPlugins الأخرى من الاستمرار في العمل؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمن لPlugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت نفس المعرّف من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبّع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعليًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` هو خيار طارئ للحالات الإيجابية الكاذبة في ماسح الكود الخطِر المدمج. يسمح باستمرار التثبيت حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسات خطاف `before_install` الخاصة بـ Plugin و**لا** يتجاوز حالات فشل الفحص.

    تنطبق راية CLI هذه على تدفقات تثبيت/تحديث Plugin. تستخدم عمليات تثبيت تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المصفّاة وتفعيل كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات Npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا ضمن المشروع مع `--ignore-scripts` للأمان، حتى إذا كانت صدفتك تحتوي على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. كما تُثبَّت مواصفات الحزم المجرّدة مباشرةً من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجرّدة و`@latest` على مسار الاستقرار. إذا حلّ npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (على سبيل المثال `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تتضمن الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وعناوين الاستنساخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` للتحويل إلى فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتحوّل إلى المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. هذا يعني أن التحقق من البيان، وفحص الكود الخطِر، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع المصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية الخاصة بـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    كما تُدعم تثبيتات سوق Claude.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل حل npm-only صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من واجهة برمجة تطبيقات Plugin المعلنة / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw حزمة npm-pack ذات الإصدار `.tgz`، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبّته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبَّت عبر مسار التحقق من أرشيف الحزمة القديم. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأثر، وسلامة npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير ذات الإصدار بمواصفة مسجلة غير ذات إصدار حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتبقى مثبّتة على ذلك المحدد.

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
  <Tab title="مصادر السوق">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد السوق البعيد">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المسارية من البيانات الوصفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيا:

- إضافات OpenClaw الأصلية (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التفعيل/التعطيل نفسه. حاليا، تُدعم Skills الحزم، وSkills أوامر Claude، وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` / `lspServers` المعلنة في البيان في Claude، وSkills أوامر Cursor، وأدلة خطافات Codex المتوافقة؛ وتُعرض إمكانات الحزم المكتشفة الأخرى في التشخيصات/المعلومات لكنها لم تُوصل بعد بتنفيذ وقت التشغيل.
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
  اعرض الإضافات المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليا، إضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المستمر أولا، مع رجوع مشتق من البيان فقط عندما يكون السجل مفقودا أو غير صالح. وهو مفيد للتحقق مما إذا كانت Plugin مثبّتة ومفعّلة ومرئية لتخطيط بدء التشغيل البارد، لكنه ليس فحصا مباشرا لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو التفعيل أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` جديد أو الخطافات. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء الحزم تلك
موجودة على طول مسار بحث `node_modules` العادي في Node الخاص بـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح التبعيات
المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح
تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّنة داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة
تلك قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ
ببساطة فيبقى خاملا لكي تظل التثبيتات المعبأة العادية تستخدم التوزيعة المترجمة.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من مرور فحص محمّل للوحدة. لا يثبّت فحص وقت التشغيل التبعيات أبدا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو تثبيت الإضافات القابلة للتنزيل المهيأة والمفقودة.
- يؤكد `openclaw gateway status --deep --require-rpc` قابلية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار الإعداد، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مُدارة آليا، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث إلى `plugins/installs.json` تحت دليل حالة OpenClaw النشط. خريطة `installRecords` في المستوى الأعلى هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك السجلات الخاصة ببيانات Plugin الوصفية المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل التشغيل البارد المشتقة من البيان. يتضمن الملف تحذيرا بعدم التحرير ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعداد؛ وإذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات حتى لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قوائم السماح/المنع الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضا دليل التثبيت المُدار المتتبَّع عندما يكون داخل جذر إضافات Plugin الخاص بـ OpenClaw. بالنسبة إلى إضافات Active Memory، تُعاد خانة الذاكرة إلى `memory-core`.

<Note>
يُدعم `--keep-config` كاسم مستعار متقادم لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبَّعة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتتبَّعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عند تمرير معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لتلك Plugin. يعني ذلك أن وسوم التوزيعة المخزنة سابقا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام عند تشغيل `update <id>` لاحقا.

    بالنسبة إلى تثبيتات npm، يمكنك أيضا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة هذا مرة أخرى إلى سجل Plugin المتتبَّع، ويحدّث تلك Plugin المثبتة، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضا إلى الحل مرة أخرى إلى سجل Plugin المتتبَّع. استخدم هذا عندما تكون Plugin مثبتة على إصدار دقيق وتريد إعادتها إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبَّعة ما لم تمرر مواصفة جديدة. ويعرف `openclaw update` بالإضافة إلى ذلك قناة تحديث OpenClaw النشطة: في قناة بيتا، تحاول سجلات npm وClawHub الخاصة بخط الإصدار الافتراضي `@beta` أولا، ثم تعود إلى مواصفة default/latest المسجلة إذا لم يوجد إصدار بيتا لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة سلامة مخزنة وتتغير بصمة الأثر المجلوب، يتعامل OpenClaw مع ذلك باعتباره انحرافا في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث المساعدة غير التفاعلية بإغلاق آمن ما لم يوفر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة في فحص الكود الخطِر المدمج أثناء تحديثات Plugin. ولا يزال لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص، وينطبق فقط على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وإمكانات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرائق Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر `openclaw` جذرية. بعد أن يعرض `inspect --runtime` أمرا ضمن `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ فعلى سبيل المثال، يمكن التحقق من Plugin تسجل `demo-git` باستخدام `openclaw demo-git ping`.

تُصنَّف كل Plugin حسب ما تسجله فعليا في وقت التشغيل:

- **plain-capability** — نوع إمكان واحد (مثل Plugin خاصة بمزود فقط)
- **hybrid-capability** — عدة أنواع إمكانات (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، بلا إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج الإمكانات.

<Note>
يعرض علم `--json` تقريرا قابلا للقراءة آليا ومناسبا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحزمة، وملخص الخطافات. `info` اسم مستعار لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليما يطبع `No plugin issues detected.`

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمر في OpenClaw لهوية Plugin المثبتة، وتفعيلها، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزود، وتصنيف إعداد القنوات، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودا أو محدثا أو قديما. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة الإعدادات، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل مخصص للحالات الطارئة عند فشل قراءة السجل. يُفضّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع إلى متغير البيئة مخصص فقط لاسترداد بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

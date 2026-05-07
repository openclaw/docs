---
read_when:
    - تريد تثبيت أو إدارة Plugins الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد استكشاف حالات فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI الخاص بـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:15:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73023d11309c5dc4fe9fab9cffc0f7d96de1e1c22ce1ec4d2cd22d2aa4808f1a
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف أخطائها وإصلاحها.
  </Card>
  <Card title="Manage plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والسرد، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="Plugin bundles" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="Plugin manifest" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
  </Card>
  <Card title="Security" href="/ar/gateway/security">
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

للتحقيق في بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون عمليات تغيير دورة حياة Plugin معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المرتكز على الوكيل أولًا.
</Note>

<Note>
تأتي Plugins المضمّنة مع OpenClaw. بعضها مفعّل افتراضيًا (على سبيل المثال موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ ويتطلب البعض الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إذا كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات حزمها الخاصة بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطوّلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
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
تُثبَّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugins مثل تشغيل التعليمات البرمجية. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin، وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل Npm مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. عادت حزم Plugin المملوكة لـ OpenClaw بصيغة `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو [مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`. تفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` في npm عندما يكون ذلك الوسم متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` أحادي الملف، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` من دون تغيير. تفشل التضمينات الجذرية، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بإغلاق آمن بدلًا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، تفشل إعدادات Plugin غير الصالحة بإغلاق آمن مثل أي إعدادات أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن لـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة بالفعل في موضعها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin npm متتبَّع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، يوقف OpenClaw العملية ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="--pin scope">
    ينطبق `--pin` على تثبيتات npm فقط. وهو غير مدعوم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. كما أنه غير مدعوم مع `--marketplace`، لأن تثبيتات السوق تحتفظ ببيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار طوارئ للحالات الإيجابية الكاذبة في ماسح التعليمات البرمجية الخطرة المدمج. يسمح بمتابعة التثبيت حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاص بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skill من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تُشغَّل تثبيتات التبعيات محليًا داخل المشروع مع `--ignore-scripts` للسلامة، حتى عندما تحتوي صدفتك على إعدادات تثبيت npm عالمية. ترث جذور npm المدارة لـ Plugin قيم `overrides` الخاصة بمستوى حزمة OpenClaw، لذلك تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. كما تُثبَّت مواصفات الحزم المجردة مباشرة من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة من OpenClaw مثل `2026.5.3-1` إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا من ذلك إلى إصدار تمهيدي، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحةً باستخدام وسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (على سبيل المثال `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وعناوين الاستنساخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو تثبيتة قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتستخرج المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص التعليمات البرمجية الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى التثبيتة المحلولة بحيث يستطيع `openclaw plugins update` إعادة حلّ المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل أساليب Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرة عبر CLI الجذري لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف كرة tar من npm-pack وتريد اختبار مسار تثبيت جذر npm المُدار نفسه الذي تستخدمه تثبيتات السجل، بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة، وسجلات تثبيت npm. لا تزال مسارات الأرشيف العادية تُثبّت كأرشيفات محلية تحت جذر إضافات Plugin.

    تثبيتات سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل حل npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من واجهة API المعلنة للـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أداة ClawPack، ينزل OpenClaw حزمة npm المرقمة `.tgz`، ويتحقق من ترويسة ملخص ClawHub وملخص الأداة، ثم يثبتها عبر مسار الأرشيف المعتاد. تظل إصدارات ClawHub الأقدم التي لا تتضمن بيانات تعريف ClawPack تثبت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع الأداة، وتكامل npm، وملخص npm، واسم ملف tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير المرقمة بمواصفة مسجلة غير مرقمة حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتظل مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي لدى Claude في `~/.claude/plugins/known_marketplaces.json`:

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
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="Remote marketplace rules">
    بالنسبة إلى الأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugin غير المسارية من بيانات manifest البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- إضافات OpenClaw الأصلية (`openclaw.plugin.json`)
- الحزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- الحزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تثبت الحزم المتوافقة داخل جذر Plugin المعتاد وتشارك في تدفق العرض/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الحزم، وSkills أوامر Claude، وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` / `lspServers` المعلنة في manifest لدى Claude، وSkills أوامر Cursor، وأدلة hook المتوافقة مع Codex؛ أما قدرات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها غير موصولة بعد بتنفيذ وقت التشغيل.
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
  اعرض الإضافات الممكّنة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا إضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولًا، مع رجوع مشتق من manifest فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد هذا للتحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin، أو التمكين، أو سياسة hook، أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو hook. في عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم موجودة على طول مسار بحث `node_modules` المعتاد في Node الخاص بالـ Plugin؛ ولا يستورد كود وقت تشغيل Plugin، ولا يشغل مدير حزم، ولا يصلح التبعيات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية، ولا يغير الإعدادات، ولا يثبت حزمًا، ولا يحمل كود وقت تشغيل Plugin. تتضمن نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

لعمل Plugin المضمن داخل صورة Docker معبأة، اربط دليل مصدر Plugin فوق مسار المصدر المعبأ المطابق، مثل `/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة هذه قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ فقط فيبقى غير فعال حتى تظل التثبيتات المعبأة المعتادة تستخدم dist المترجم.

لتصحيح أخطاء hook وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` وحدات hook المسجلة والتشخيصات من تمريرة فحص محملة كوحدة. لا يثبت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة الإضافات القابلة للتنزيل المفقودة المشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hook المحادثات غير المضمنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتبها التثبيتات والتحديثات إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. تعد خريطة `installRecords` ذات المستوى الأعلى المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك سجلات بيانات manifest الخاصة بالـ Plugin المكسورة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من manifest. يتضمن الملف تحذيرًا بعدم التحرير ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، تعاملها قراءات وقت التشغيل كمدخلات توافق دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعدادات عندما تكون كتابات الإعدادات مسموحة؛ وإذا فشلت أي من الكتابتين، تُحفظ سجلات الإعدادات حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قوائم السماح/الرفض للـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يُعيّن `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر إضافات Plugin في OpenClaw. بالنسبة إلى إضافات الذاكرة النشطة، تعاد خانة الذاكرة إلى `memory-core`.

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

تُطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حزم hook المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك الـ Plugin. وهذا يعني أن وسوم dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل Plugin المتتبع، ويحدّث ذلك الـ Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرف.

    تمرير اسم حزمة npm دون إصدار أو وسم يحل أيضًا مرة أخرى إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="Beta channel updates">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات npm وClawHub الافتراضية للـ Plugin استخدام `@beta` أولًا، ثم تعود إلى مواصفة default/latest المسجلة إذا لم يوجد إصدار beta للـ Plugin. تظل الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأداة المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد تجزئة تكامل مخزنة وتتغير تجزئة الأداة المحضرة، يتعامل OpenClaw مع ذلك كانحراف أداة npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات مساعدة التحديث غير التفاعلية بإغلاق آمن ما لم يوفر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة لفحص الكود الخطير المدمج أثناء تحديثات Plugin. لكنه لا يزال لا يتجاوز كتل سياسة `before_install` الخاصة بالـ Plugin أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات حزم hook.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات manifest، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين hook المسجلة، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP. يبلغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ وتبقى التثبيتات والإصلاحات في `openclaw plugins install`، و`openclaw plugins update`، و`openclaw doctor --fix`.

عادة ما تُثبت أوامر CLI المملوكة للـ Plugin كمجموعات أوامر جذرية تحت `openclaw`، لكن يمكن للإضافات أيضًا تسجيل أوامر متداخلة تحت أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع capability واحد (مثل Plugin خاص بالمزود فقط)
- **hybrid-capability** — أنواع capability متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، من دون capabilities أو surfaces
- **non-capability** — أدوات/أوامر/خدمات لكن من دون capabilities

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج capability.

<Note>
ينتج العلم `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع capability، وإشعارات التوافق، وcapabilities الحزمة، وملخص hooks. `info` هو اسم بديل لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات manifest/discovery، وإشعارات التوافق. عندما يكون كل شيء سليمًا، يطبع `No plugin issues detected.`

إذا كان Plugin مكوّن موجودًا على القرص لكنه محظور بواسطة فحوصات أمان المسار في المحمّل، فإن التحقق من صحة الإعدادات يبقي إدخال Plugin ويبلغ عنه بوصفه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى حالات فشل شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص موجز لشكل الصادرات في مخرجات التشخيص.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمر في OpenClaw لهوية Plugins المثبتة، وتمكينها، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزود، وتصنيف إعداد القنوات، وجرد Plugins قراءته من دون استيراد وحدات تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حاليًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugins المستمر، وسياسة الإعدادات، وبيانات manifest/package الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستعادة ضمن جذر npm المدار لـ Plugin تحجب Plugin مضمّنًا، فإن doctor يزيل تلك الحزمة القديمة ويعيد بناء السجل بحيث يتحقق بدء التشغيل من manifest المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لحالات الطوارئ عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاستعادة بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة Marketplace مسار Marketplace محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى manifest Marketplace المحللة وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

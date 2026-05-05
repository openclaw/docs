---
read_when:
    - تريد تثبيت Pluginات Gateway أو الحزم المتوافقة أو إدارتها
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-05T01:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 24d274f33213231eaed48ac848a9266802a2179ba0311ab18462ad783219095a
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف مشكلاتها وإصلاحها.
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
    تعزيز الأمان لتثبيتات Plugin.
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
تُشحن Plugins المضمّنة مع OpenClaw. بعضها مفعّل افتراضيًا (مثل مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تُشحن Plugins الأصلية لـ OpenClaw مع `openclaw.plugin.json` يتضمن JSON Schema مضمنًا (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المفصلة نوع الحزمة الفرعي (`codex` أو `claude` أو `cursor`) إضافة إلى إمكانات الحزمة المكتشفة.
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
تُثبَّت أسماء الحزم المجردة من npm افتراضيًا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` من أجل ClawHub. تعامل مع تثبيتات Plugin مثل تشغيل كود. يُفضّل استخدام الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يبقى Npm
مسارًا احتياطيًا ومدعومًا للتثبيت المباشر. عادت حزم Plugin المملوكة لـ OpenClaw
بالنطاق `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة بيتا dist-tag باسم `beta` في npm عندما تكون هذه الوسمة
متاحة، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بشكل مغلق بدلًا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي إعدادات أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن لـ Plugins التي تختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبّتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. للترقيات الروتينية لـ Plugin npm متتبع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="--pin scope">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار لكسر الحماية عند الإيجابيات الكاذبة في ماسح الكود الخطِر المدمج. يسمح للتثبيت بالمتابعة حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسات خطاف `before_install` الخاصة بـ Plugin و**لا** يتجاوز حالات فشل الفحص.

    تنطبق علامة CLI هذه على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skills من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` هو أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتفعيل كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا داخل المشروع مع `--ignore-scripts` حفاظًا على السلامة، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تثبّت مواصفات الحزم المجردة أيضًا مباشرةً من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إصدارات التصحيح المؤرخة من OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا من هذه إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً بوسمة إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تتضمن الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وروابط الاستنساخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاختيار فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتنتقل إلى المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. هذا يعني أن التحقق من البيان، وفحص الكود الخطِر، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة رابط/مرجع المصدر إضافة إلى commit المحلول حتى يستطيع `openclaw plugins update` إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، نفّذ ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ أما الأرشيفات التي تحتوي فقط على `package.json` فتُرفض قبل أن يكتب OpenClaw سجلات التثبيت.

    تثبيتات سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبّت مواصفات Plugin الآمنة لـ npm والمجردة من npm افتراضيًا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل حل npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق plugin API المعلن / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد عنصر ClawPack، ينزّل OpenClaw ملف npm-pack `.tgz` ذي الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص العنصر، ثم يثبّته عبر مسار الأرشيف العادي. أما إصدارات ClawHub الأقدم دون بيانات ClawPack الوصفية فلا تزال تُثبّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع العنصر، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack لاستخدامها في التحديثات اللاحقة.
تحافظ تثبيتات ClawHub غير ذات الإصدار على مواصفة مسجلة غير مؤرخة حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتبقى محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبّتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة سجل Claude المحلية المؤقتة في `~/.claude/plugins/known_marketplaces.json`:

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
    - اسم marketplace معروف في Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر marketplace محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد Marketplace البعيد">
    بالنسبة إلى marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin التي تكون HTTP(S)، أو مسارات مطلقة، أو git، أو GitHub، أو غيرها من مصادر Plugin غير المسارية من البيانات التعريفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائياً:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حالياً، تُدعَم Skills الحزم، وSkills أوامر Claude، وإعدادات Claude الافتراضية في `settings.json`، وإعدادات Claude الافتراضية في `.lsp.json` / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، ومجلدات خطافات Codex المتوافقة؛ وتُعرض قدرات الحزم الأخرى المكتشفة في التشخيصات/المعلومات لكنها لم تُوصَل بعد إلى تنفيذ وقت التشغيل.
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
  مخزون قابل للقراءة آلياً مع تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولاً، مع بديل مشتق من البيان فقط عندما يكون السجل مفقوداً أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبّتاً وممكّناً ومرئياً لتخطيط بدء التشغيل البارد، لكنه ليس فحصاً مباشراً لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو تمكينه أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو الخطافات. بالنسبة إلى النشرات البعيدة/الحاويات، تحقق من أنك تعيد تشغيل ابن `openclaw gateway run` الفعلي، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء هذه الحزم
موجودة على طول مسار البحث العادي لـ Node `node_modules` الخاص بـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح
التبعيات المفقودة.
</Note>

`plugins search` هو بحث في كتالوج ClawHub البعيد. لا يفحص الحالة المحلية،
ولا يغيّر التكوين، ولا يثبّت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، و
تلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبّأة، اربط مجلد مصدر Plugin
بالمسار المطابق للمصدر المعبّأ، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة هذه
قبل `/app/dist/extensions/synology-chat`؛ أما مجلد المصدر المنسوخ العادي
فيبقى غير فعّال بحيث تستمر التثبيتات المعبّأة العادية في استخدام dist المترجم.

لتصحيح خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من مرور فحص محمّل للوحدة. لا يثبّت فحص وقت التشغيل التبعيات أبداً؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استرداد Plugins القابلة للتنزيل المفقودة والمشار إليها في التكوين.
- يؤكد `openclaw gateway status --deep --require-rpc` إمكانية الوصول إلى Gateway، وتلميحات الخدمة/العملية، ومسار التكوين، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`، و`llm_output`، و`before_agent_finalize`، و`agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ مجلد محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلاً من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة مُدارة آلياً، وليست تكويناً للمستخدم. تكتب التثبيتات والتحديثات هذه البيانات إلى `plugins/installs.json` ضمن مجلد حالة OpenClaw النشط. خريطة `installRecords` ذات المستوى الأعلى هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك السجلات الخاصة ببيانات Plugin التعريفية المعطوبة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت للسجل البارد المشتقة من البيان. يتضمن الملف تحذيراً بعدم التعديل ويستخدمه `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في التكوين، ينقلها إلى فهرس Plugin ويزيل مفتاح التكوين؛ وإذا فشلت أي من عمليتي الكتابة، تُحفَظ سجلات التكوين كي لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` وفهرس Plugin المحفوظ وإدخالات قوائم السماح/الرفض لـ Plugin وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم تُعيَّن `--keep-files`، يزيل إلغاء التثبيت أيضاً مجلد التثبيت المُدار المتتبَّع عندما يكون داخل جذر إضافات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تعود فتحة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات hook-pack المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم التوزيع المخزنة سابقاً مثل `@beta` والإصدارات الدقيقة المثبتة تظل مستخدمة في عمليات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضاً تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة هذا مرة أخرى إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبّت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضاً إلى الحل مرة أخرى إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتاً على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="تحديثات قناة Beta">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضاً قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات Plugin الافتراضية من npm وClawHub استخدام `@beta` أولاً، ثم تعود إلى المواصفة الافتراضية/الأحدث المسجلة إذا لم يكن هناك إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف النزاهة">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبّتة مقابل بيانات سجل npm التعريفية. إذا كان الإصدار المثبّت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة نزاهة مخزنة وتتغير بصمة الأثر المجلوب، يتعامل OpenClaw مع ذلك على أنه انحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بإغلاق آمن ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضاً في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الكود الخطِر المضمّن أثناء تحديثات Plugin. لا يزال لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات hook-pack.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضياً. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرة؛ وتبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية لـ `openclaw`. بعد أن يعرض `inspect --runtime` أمراً ضمن `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin وفق ما يسجله فعلياً في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثلاً Plugin لمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثلاً نص + كلام + صور)
- **hook-only** — خطافات فقط، دون قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد عن نموذج القدرات.

<Note>
يعرض علم `--json` تقريراً قابلاً للقراءة آلياً ومناسباً للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولاً على مستوى المجموعة يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزم، وملخص الخطافات. `info` اسم بديل لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليماً يطبع `No plugin issues detected.`

إذا كان Plugin مكوَّن موجوداً على القرص لكن محظوراً بفحوصات أمان المسار الخاصة بالمحمّل، فإن التحقق من التكوين يُبقي إدخال Plugin ويبلغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة العالمية، بدلاً من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى إخفاقات شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المحفوظ في OpenClaw لهوية Plugin المثبّتة وتمكينها وبيانات تعريف المصدر وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجودًا أو محدّثًا أو متقادمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ، وسياسة التكوين، وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يصلح `openclaw doctor --fix` أيضًا انحراف npm المُدار المجاور للسجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستعادة ضمن جذر npm المُدار الخاص بـ Plugin تحجب Plugin مضمنًا، فإن doctor يزيل تلك الحزمة المتقادمة ويعيد بناء السجل بحيث يتحقق بدء التشغيل من البيان المضمن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق قديم لكسر الحاجز عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع إلى متغير البيئة مخصص فقط لاستعادة بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
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

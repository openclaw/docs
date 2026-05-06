---
read_when:
    - تريد تثبيت أو إدارة Plugin الخاصة بـ Gateway أو الحزم المتوافقة
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-06T17:55:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 734366b6bbee5f036fdc2cfac5197ae86d2e8fbc7c977ccc4e22add2f4206951
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugin الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugin وتفعيلها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugin" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تقوية الأمان لتثبيت Plugin.
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
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون عمليات تعديل دورة حياة Plugin معطلة. استخدم مصدر Nix لهذا التثبيت بدلا من `plugins install`، أو `plugins update`، أو `plugins uninstall`، أو `plugins enable`، أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start) المعتمدة على الوكيل أولا.
</Note>

<Note>
تأتي Plugin المضمنة مع OpenClaw. يكون بعضها مفعلا افتراضيا (على سبيل المثال مزودو النماذج المضمنون، ومزودو الكلام المضمنون، وPlugin المتصفح المضمنة)؛ بينما يتطلب بعضها الآخر `plugins enable`.

يجب أن تتضمن Plugin الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إن كان فارغا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطولة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
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
تثبّت أسماء الحزم المجردة من npm افتراضيا أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugin كما تتعامل مع تشغيل الكود. فضّل الإصدارات المثبتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو السطح الأساسي للتوزيع والاكتشاف لمعظم Plugin. يظل npm
مسارا احتياطيا مدعوما ومسارا للتثبيت المباشر. عادت حزم Plugin المملوكة لـ OpenClaw
ضمن `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[جرد Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة beta وسم التوزيع `beta` في npm عند توفر ذلك الوسم،
ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات وإصلاح الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعوما بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بشكل مغلق بدلا من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادة بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، تفشل إعدادات Plugin غير الصالحة بشكل مغلق مثل أي إعدادات أخرى غير صالحة؛ يمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمنة تختار صراحة استخدام `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin مثبتة مسبقا أو حزمة خطافات في مكانها. استخدمه عندما تقصد إعادة تثبيت المعرف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. للترقيات الروتينية لـ Plugin من npm متتبعة مسبقا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرف Plugin مثبت مسبقا، يوقف OpenClaw العملية ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يكون مدعوما مع تثبيتات `git:`؛ استخدم مرجع git صريحا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرا مثبتا. ولا يكون مدعوما مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار للطوارئ لحالات الإيجابيات الكاذبة في ماسح الكود الخطير المدمج. يسمح للتثبيت بالاستمرار حتى عندما يبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسات خطاف `before_install` الخاص بـ Plugin ولا **يتجاوز** فشل الفحص.

    تنطبق علامة CLI هذه على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` مسار تنزيل/تثبيت Skills منفصلا من ClawHub.

    إذا حُظرت Plugin نشرتها على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    `plugins install` هو أيضا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المرشحة وتمكين كل خطاف، وليس لتثبيت الحزم.

    مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار محدد** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليا داخل المشروع مع `--ignore-scripts` للأمان، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة. ترث جذور npm المدارة الخاصة بـ Plugin قيم `overrides` على مستوى حزمة OpenClaw، لذلك تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحا. كما تثبت مواصفات الحزم المجردة مباشرة من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إصدارات التصحيح المؤرخة في OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حل npm أيا من تلك إلى إصدار ما قبل الإصدار، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحة باستخدام وسم ما قبل الإصدار مثل `@beta`/`@rc` أو إصدار ما قبل الإصدار محدد مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرف Plugin رسمية (على سبيل المثال `diffs`)، يثبت OpenClaw إدخال الفهرس مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الأشكال المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وعناوين نسخ `https://` الكاملة، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو commit قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص الكود الخطير، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى commit الذي تم حله لكي يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجلت Plugin جذرا لـ CLI باستخدام `api.registerCli`، فنفذ ذلك الأمر مباشرة عبر CLI الجذر لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف كرة tarball من npm-pack وتريد
    اختبار مسار تثبيت جذر npm المدار نفسه المستخدم بواسطة تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة، و
    سجلات تثبيت npm. تظل مسارات الأرشيف العادية تثبت كأرشيفات محلية
    تحت جذر extensions الخاص بـ Plugin.

    تثبيتات سوق Claude مدعومة أيضا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبت مواصفات Plugin المجردة الآمنة لـ npm من npm افتراضيا أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل المقتصر على npm صريحا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من واجهة API المعلنة لـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزل OpenClaw ملف npm-pack المرقم بالإصدار `.tgz`، ويتحقق من ترويسة بصمة ClawHub وبصمة الأثر، ثم يثبته عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات ClawPack الوصفية تثبت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ عمليات التثبيت المسجلة ببيانات مصدر ClawHub الوصفية، ونوع الأثر، وتكامل npm، وshasum الخاص بـ npm، واسم ملف tarball، وحقائق بصمة ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير المرقمة بإصدار بمواصفة مسجلة غير مرقمة كي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتبقى مثبتة على ذلك المحدد.

#### الصيغة المختصرة للمتجر

استخدم الصيغة المختصرة `plugin@marketplace` عندما يكون اسم المتجر موجودًا في ذاكرة التخزين المؤقت المحلية لسجل Claude عند `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر المتجر صراحة:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace sources">
    - اسم متجر معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر متجر محلي أو مسار `marketplace.json`
    - صيغة مختصرة لمستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="Remote marketplace rules">
    بالنسبة إلى المتاجر البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع المتجر المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugin غير المسارية من البيانات التعريفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تثبت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الحزم، وSkills أوامر Claude، وافتراضيات `settings.json` الخاصة بـ Claude، وافتراضيات `.lsp.json` الخاصة بـ Claude / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة hook المتوافقة مع Codex؛ أما قدرات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها لم تُوصّل بعد إلى تنفيذ وقت التشغيل.
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
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التفعيل الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا مع تشخيصات السجل وحالة تثبيت اعتماديات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` أولًا سجل Plugin المحلي المستمر، مع بديل مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو التمكين أو سياسة hook أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو hooks. بالنسبة إلى النشر البعيد/الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء الحزم تلك موجودة على مسار بحث `node_modules` العادي الخاص بـ Node لذلك Plugin؛ ولا يستورد كود وقت تشغيل Plugin، ولا يشغل مدير حزم، ولا يصلح الاعتماديات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية، ولا يغير الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمن داخل صورة Docker معبأة، اربط دليل مصدر Plugin فوق مسار المصدر المعبأ المطابق، مثل `/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة تلك قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ عاديًا فيبقى غير فعال، لذلك تظل التثبيتات المعبأة العادية تستخدم dist المترجم.

لتصحيح أخطاء hook وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من جولة فحص محملة للوحدة. لا يثبت فحص وقت التشغيل الاعتماديات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة الاعتماديات القديمة أو استرداد Plugins القابلة للتنزيل المفقودة المشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` على Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثة غير المضمنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة التي جرى حلها (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتب عمليات التثبيت والتحديث هذه البيانات إلى `plugins/installs.json` تحت دليل حالة OpenClaw النشط. خريطة `installRecords` ذات المستوى الأعلى هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك السجلات الخاصة ببيانات Plugin التعريفية المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل التشغيل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير ويستخدمه `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، تعاملها قراءات وقت التشغيل كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعدادات عندما تكون كتابة الإعدادات مسموحة؛ وإذا فشلت أي كتابة، تُبقى سجلات الإعدادات حتى لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قوائم السماح/الرفض لـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبع عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تُعاد فتحة الذاكرة إلى `memory-core`.

<Note>
يُدعم `--keep-config` كاسم بديل مهجور لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار، وتثبيتات hook-pack المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تظل مستخدمة في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذلك عائدًا إلى سجل Plugin المتتبع، ويحدث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرف.

    تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضًا عائدًا إلى سجل Plugin المتتبع. استخدم ذلك عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="Beta channel updates">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` بالإضافة إلى ذلك قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات Plugin الافتراضية الخط في npm وClawHub استخدام `@beta` أولًا، ثم تعود إلى مواصفة default/latest المسجلة إذا لم يكن هناك إصدار beta لـ Plugin. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبت مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما تكون بصمة تكامل مخزنة موجودة وتتغير بصمة الأثر المجلب، يتعامل OpenClaw مع ذلك كانحراف في أثر npm. يطبع الأمر التفاعلي `openclaw plugins update` البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. يفشل مساعدو التحديث غير التفاعليين بإغلاق آمن ما لم يقدم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة لفحص الكود الخطر المضمن أثناء تحديثات Plugin. ولا يزال لا يتجاوز كتل سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات hook-pack.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP من دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين hooks المسجلة، والأدوات، والأوامر، والخدمات، وطرائق Gateway، ومسارات HTTP. يبلغ فحص وقت التشغيل عن اعتماديات Plugin المفقودة مباشرة؛ أما التثبيتات والإصلاحات فتبقى في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية لـ `openclaw`. بعد أن يعرض `inspect --runtime` أمرًا تحت `cliCommands`، شغّله بصيغة `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin لمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — الخطافات فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من التفاصيل حول نموذج القدرات.

<Note>
يُخرج العلم `--json` تقريرًا قابلًا للقراءة آليًا مناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. `info` هو اسم مستعار لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا يطبع `No plugin issues detected.`

إذا كان Plugin مكوّن موجودًا على القرص لكنه محظور بسبب فحوصات أمان المسار في المحمّل، فإن التحقق من صحة التكوين يُبقي إدخال Plugin ويبلّغ عنه بوصفه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعامة، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

في حالات فشل شكل الوحدة مثل فقدان صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص موجز لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المستمر في OpenClaw لهوية Plugin المثبتة، والتمكين، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة التكوين، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يقوم `openclaw doctor --fix` أيضًا بإصلاح الانحراف المدار في npm القريب من السجل: إذا حجبت حزمة `@openclaw/*` يتيمة أو مستعادة ضمن جذر npm المدار الخاص بـ Plugin حزمة Plugin مضمّنة، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل البيان المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل لكسر الزجاج عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاستعادة بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة Marketplace مسار Marketplace محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى بيان Marketplace المحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

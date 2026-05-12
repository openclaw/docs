---
read_when:
    - تريد تثبيت Plugins الخاصة بـ Gateway أو الحِزم المتوافقة أو إدارتها
    - تريد استكشاف أخطاء حالات فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI الخاص بـ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-12T08:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b51646a103e9e020f6e53cd08aa25e7291fb629741fd41bdab520d80b7416ff
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="إدارة Plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط التهيئة.
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
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع أزمنة المراحل
إلى stderr ويبقي مخرجات JSON قابلة للتحليل. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون أدوات تعديل دورة حياة Plugin معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) المبدوء بالوكيل.
</Note>

<Note>
تُشحن Plugins المضمّنة مع OpenClaw. يُمكَّن بعضها افتراضيًا (مثل موفّري النماذج المضمّنين، وموفّري الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ بينما تتطلب أخرى `plugins enable`.

يجب أن تُشحن Plugins الأصلية لـ OpenClaw بملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

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

يمكن للمشرفين الذين يختبرون التثبيتات وقت الإعداد تجاوز مصادر تثبيت Plugin
التلقائية باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبَّت أسماء الحزم المجردة من npm افتراضيًا أثناء مرحلة انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيتات Plugin كأنها تشغيل كود. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل Npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشر. تُنشر حزم Plugin المملوكة لـ OpenClaw
ذات النطاق `@openclaw/*` على npm مرة أخرى؛ راجع القائمة الحالية
في [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل تثبيتات وتحديثات قناة بيتا وسم التوزيع `beta` في npm عندما يكون ذلك الوسم
متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات التهيئة وإصلاح التهيئة غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب عبر ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات ذات التجاوزات الشقيقة بشكل مغلق بدلًا من تسطيحها. راجع [تضمينات التهيئة](/ar/gateway/configuration) للاطلاع على الأشكال المدعومة.

    إذا كانت التهيئة غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بشكل مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، تفشل تهيئة Plugin غير الصالحة بشكل مغلق مثل أي تهيئة أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثّق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن يختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تقصد إعادة تثبيت المعرف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. للترقيات الروتينية لـ Plugin من npm متتبَّع مسبقًا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرف Plugin مثبت مسبقًا، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار كسر للطوارئ للتعامل مع الإيجابيات الكاذبة في ماسح الكود الخطر المدمج. يسمح بمتابعة التثبيت حتى عندما يبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاصة بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` مسار تنزيل/تثبيت Skill منفصلًا من ClawHub.

    إذا حُظر Plugin نشرته على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/clawhub/security).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المصفّاة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات Npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **وسم توزيع**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا على مستوى المشروع مع `--ignore-scripts` للأمان، حتى عندما يحتوي shell لديك على إعدادات تثبيت npm عامة. ترث جذور npm المُدارة لـ Plugin قيم `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw، لذا تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تثبّت مواصفات الحزم المجردة أيضًا مباشرةً من npm أثناء مرحلة انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. تُعد إصدارات التصحيح المؤرخة من OpenClaw مثل `2026.5.3-1` إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا منها إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وروابط النسخ الكاملة `https://`، و`ssh://`، و`git://`، و`file://`، و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لاستخراج فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتستخرج المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. وهذا يعني أن التحقق من البيان، وفحص الكود الخطر، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف كما في تثبيتات npm. تتضمن تثبيتات git المسجّلة عنوان URL/المرجع للمصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّل Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ تُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف كرة tarball من npm-pack وتريد
    اختبار مسار تثبيت جذر npm المُدار نفسه المستخدم بواسطة تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة،
    وسجلات تثبيت npm. ما زالت مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر extensions الخاص بـ Plugin.

    تثبيتات Claude marketplace مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin الآمنة لـ npm المجردة من npm افتراضيًا أثناء مرحلة انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل المقتصر على npm صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق واجهة API المعلنة للـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد قطعة ClawPack أثرية، ينزّل OpenClaw حزمة npm ذات الإصدار `.tgz`، ويتحقق من ترويسة ملخص ClawHub وملخص القطعة الأثرية، ثم يثبتها عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تثبّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub، ونوع القطعة الأثرية، وتكامل npm، وملخص shasum في npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير ذات الإصدار بمواصفة مسجلة غير ذات إصدار كي يتمكن `openclaw plugins update` من تتبع إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتبقى مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي الخاصة بـ Claude في `~/.claude/plugins/known_marketplaces.json`:

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
    بالنسبة إلى الأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المسارية في البيانات الظاهرة البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبّت الحزم المتوافقة داخل جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعم Skills الخاصة بالحزم، وSkills أوامر Claude، وافتراضيات `settings.json` في Claude، وافتراضيات Claude `.lsp.json` / `lspServers` المصرح بها في البيان، وSkills أوامر Cursor، وأدلة الخطافات المتوافقة مع Codex؛ أما إمكانات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها غير موصولة بعد بتنفيذ وقت التشغيل.
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
  مخزون قابل للقراءة آليًا مع تشخيصات السجل وحالة تثبيت اعتماديات الحزمة.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugins المحلي المحفوظ أولًا، مع رجوع مشتق من البيانات الظاهرة فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin، أو حالة التمكين، أو سياسة الخطافات، أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو الخطافات الجديدة. بالنسبة إلى النشر البعيد/داخل الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء الحزم هذه
موجودة على طول مسار البحث العادي عن `node_modules` الخاص بالـ Plugin في Node؛ ولا
يستورد كود وقت تشغيل Plugin، أو يشغّل مدير حزم، أو يصلح
الاعتماديات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، و
تلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة هذه
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ فقط
فيبقى غير فعّال، بحيث تظل التثبيتات المعبأة العادية تستخدم dist المجمّع.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` الخطافات المسجلة والتشخيصات من تمريرة فحص حمّلت الوحدة. لا يثبت فحص وقت التشغيل الاعتماديات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة الاعتماديات القديمة أو استرداد Plugins القابلة للتنزيل المفقودة المشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
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

بيانات تعريف تثبيت Plugin هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. خريطة `installRecords` ذات المستوى الأعلى هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك السجلات الخاصة ببيانات Plugin الظاهرة المعطوبة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل البدء البارد المشتقة من البيانات الظاهرة. يتضمن الملف تحذيرًا بعدم التحرير ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugins البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة في الإعدادات، تتعامل قراءات وقت التشغيل معها كمدخلات توافق دون إعادة كتابة `openclaw.json`. تنقل عمليات الكتابة الصريحة لـ Plugin و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعدادات عندما تكون كتابة الإعدادات مسموحة؛ إذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات حتى لا تضيع بيانات تعريف التثبيت.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قوائم السماح/المنع الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم ضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبَّع عندما يكون داخل جذر امتدادات Plugin في OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تُعاد خانة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على تثبيتات Plugin المتتبَّعة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتتبَّعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. يعني ذلك أن وسوم التوزيع المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة يستمر استخدامها في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم توزيع أو إصدار دقيق. يحل OpenClaw اسم الحزمة هذا عائدًا إلى سجل Plugin المتتبَّع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة لتحديثات المعرف المستقبلية.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضًا إلى الحل عائدًا إلى سجل Plugin المتتبَّع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد نقله مرة أخرى إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة بيتا">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبَّعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` أيضًا قناة تحديث OpenClaw النشطة: على قناة بيتا، تحاول سجلات npm وClawHub الخاصة بخط الإصدار الافتراضي للـ Plugin استخدام `@beta` أولًا، ثم تعود إلى مواصفة الافتراضي/الأحدث المسجلة إذا لم يوجد إصدار بيتا للـ Plugin. يُبلغ عن هذا الرجوع كتحذير ولا يفشل تحديث النواة. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف التكامل">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية القطعة الأثرية المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما تكون قيمة تكامل مخزنة موجودة ويتغير تجزئة القطعة الأثرية المجلبة، يتعامل OpenClaw مع ذلك كانحراف في قطعة npm الأثرية. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث غير التفاعلية بوضع مغلق ما لم يقدم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة في فحص الكود الخطِر المدمج أثناء تحديثات Plugin. لا يزال لا يتجاوز كتل سياسة `before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيانات الظاهرة، وأعلام السياسة، والتشخيصات، وبيانات تعريف التثبيت، وإمكانات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين الخطافات، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن اعتماديات Plugin المفقودة مباشرةً؛ أما التثبيتات والإصلاحات فتبقى في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً ما تُثبّت أوامر CLI المملوكة للـ Plugin كمجموعات أوامر جذرية لـ `openclaw`، لكن يمكن للـ Plugins أيضًا تسجيل أوامر متداخلة تحت أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنّف كل Plugin حسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاص بالمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — hooks فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات حول نموذج القدرات.

<Note>
يُخرِج العلم `--json` تقريرًا مقروءًا آليًا ومناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص hooks. `info` هو اسم مستعار لـ `inspect`.
</Note>

### الفحص

```bash
openclaw plugins doctor
```

يُبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا، يطبع `No plugin issues detected.`

إذا كان Plugin مكوّنًا موجودًا على القرص لكنه محظور بسبب فحوص أمان المسار الخاصة بالمحمّل، فإن التحقق من التكوين يُبقي إدخال Plugin ويُبلّغ عنه كـ `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعامة، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

بالنسبة إلى حالات فشل شكل الوحدة مثل فقدان صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugins المحلي هو نموذج القراءة الباردة المستمر في OpenClaw لهوية Plugins المثبتة، وتمكينها، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugins قراءته من دون استيراد وحدات تشغيل Plugins.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugins المستمر، وسياسة التكوين، وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يُصلح `openclaw doctor --fix` أيضًا الانحراف المُدار في npm المجاور للسجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستعادة ضمن جذر npm المُدار الخاص بـ Plugins تحجب Plugin مضمّنًا، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل حتى يتحقق بدء التشغيل مقابل البيان المضمّن. يعيد Doctor أيضًا ربط حزمة المضيف `openclaw` داخل Plugins المُدارة عبر npm التي تُعلن `peerDependencies.openclaw`، بحيث تُحلّ استيرادات وقت التشغيل المحلية للحزمة مثل `openclaw/plugin-sdk/*` بعد التحديثات أو إصلاحات npm.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق مهمل للاستخدام الاضطراري عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاستعادة بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى بيان السوق المحلل وإدخالات Plugins.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

---
read_when:
    - تريد تثبيت أو إدارة Gateway Plugins أو الحِزم المتوافقة
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-11T20:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ad7d6341d6c2325bfef966b00ca1956f8b337fd0ffe40dba3384ed7eefd1285
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
    حقول البيان ومخطط التكوين.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
    تقوية الأمان لتثبيت Plugins.
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

للاستقصاء عن بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون عمليات تغيير دورة حياة Plugin معطّلة. استخدم مصدر Nix لهذا التثبيت بدلًا من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البدء السريع](https://github.com/openclaw/nix-openclaw#quick-start) المعتمد على الوكيل أولًا.
</Note>

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضُها مفعّلًا افتراضيًا (مثل موفري النماذج المضمّنين، وموفري الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية الخاصة بـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى إن كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات التفصيلية النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
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

يمكن للمشرفين الذين يختبرون عمليات التثبيت وقت الإعداد تجاوز مصادر تثبيت Plugin التلقائية
باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تثبّت أسماء الحزم المجرّدة من npm افتراضيًا أثناء الانتقال عند الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع تثبيت Plugins كما تتعامل مع تشغيل الشيفرة. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشر. أعيد نشر حزم Plugin
المملوكة لـ OpenClaw من نوع `@openclaw/*` على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث لقناة beta وسم التوزيع `beta` في npm عندما يكون
هذا الوسم متاحًا، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="إدراجات التكوين وإصلاح التكوين غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` ذي ملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب عبر ذلك الملف المدرج وتترك `openclaw.json` دون تغيير. تُغلق إدراجات الجذر، ومصفوفات الإدراج، والإدراجات ذات التجاوزات الشقيقة بدلًا من تسطيحها. راجع [إدراجات التكوين](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كان التكوين غير صالح أثناء التثبيت، يفشل `plugins install` عادةً في وضع مغلق ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway وإعادة التحميل الساخنة، يفشل تكوين Plugin غير الصالح في وضع مغلق مثل أي تكوين غير صالح آخر؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثّق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن تختار صراحةً الاشتراك في `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد عن قصد تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو عنصر npm. للترقيات الروتينية لـ Plugin npm متتبَّع مسبقًا، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت مسبقًا، يوقف OpenClaw العملية ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعَم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبّتًا. ولا يُدعَم مع `--marketplace`، لأن تثبيتات السوق تحتفظ ببيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    يُعد `--dangerously-force-unsafe-install` خيارًا لكسر الحظر عند النتائج الإيجابية الكاذبة في ماسح الشيفرة الخطرة المضمّن. يتيح للتثبيت المتابعة حتى عندما يبلّغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاص بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin. تستخدم عمليات تثبيت اعتماديات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفقًا منفصلًا لتنزيل/تثبيت Skill من ClawHub.

    إذا حُظرت Plugin نشرتها على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/clawhub/security).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المصفّاة وتمكين كل خطاف على حدة، وليس لتثبيت الحزم.

    مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات الاعتماديات محليًا داخل المشروع مع `--ignore-scripts` للأمان، حتى عندما تكون لدى shell إعدادات تثبيت npm عامة. ترث جذور npm المدارة الخاصة بـ Plugin قيم `overrides` على مستوى الحزمة في OpenClaw، لذلك تنطبق تثبيتات أمان المضيف على اعتماديات Plugin المرفوعة أيضًا.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحًا. تثبّت مواصفات الحزم المجرّدة أيضًا مباشرةً من npm أثناء الانتقال عند الإطلاق.

    تبقى المواصفات المجرّدة و`@latest` على المسار المستقر. إصدارات التصحيح المؤرخة في OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حلّ npm أيًا منها إلى إصدار تمهيدي، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحةً بوسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (مثل `diffs`)، يثبّت OpenClaw إدخال الفهرس مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تشمل الأشكال المدعومة `git:github.com/owner/repo` و`git:owner/repo` وروابط النسخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع، أو وسم، أو commit قبل التثبيت.

    تنسخ تثبيتات Git المستودع إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبّت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص الشيفرة الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق Gateway وأوامر CLI. إذا سجّلت Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذر لـ OpenClaw، مثل `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية الخاصة بـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف أرشيف tarball من npm-pack وتريد
    اختبار مسار تثبيت جذر npm المدار نفسه المستخدم في تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص الاعتماديات المرفوعة، و
    سجلات تثبيت npm. لا تزال مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر إضافات Plugin.

    تثبيتات سوق Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محددًا صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin الآمنة لـ npm من npm افتراضيًا أثناء الانتقال عند الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحًا:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API الخاص بـ Plugin المُعلَن / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أداة ClawPack، يقوم OpenClaw بتنزيل `.tgz` المعبأ من npm ذي الإصدار، ويتحقق من رأس ملخص ClawHub وملخص الأداة، ثم يثبته عبر مسار الأرشيف العادي. ما زالت إصدارات ClawHub الأقدم التي لا تحتوي على بيانات ClawPack الوصفية تُثبَّت عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات مصدر ClawHub الوصفية، ونوع الأداة، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير ذات الإصدار بمواصفة مسجلة غير ذات إصدار لكي يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ أما محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` فتبقى مثبتة على ذلك المحدد.

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
  <Tab title="قواعد السوق البعيد">
    بالنسبة للأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، ومصادر Plugin الأخرى غير المسارية من البيانات الوصفية البعيدة.
  </Tab>
</Tabs>

بالنسبة للمسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّنات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعَم Skills الخاصة بالحزم، وSkills الأوامر الخاصة بـ Claude، وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` الخاصة بـ Claude / `lspServers` المعلنة في البيان، وSkills الأوامر الخاصة بـ Cursor، ومجلدات hooks المتوافقة مع Codex؛ أما قدرات الحزم الأخرى المكتشفة فتظهر في التشخيصات/المعلومات لكنها لم تُوصَل بعد بتنفيذ وقت التشغيل.
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
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات المصدر/الأصل/الإصدار/التفعيل الوصفية.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المستمر أولًا، مع رجوع مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin، أو حالة تمكينه، أو سياسة hook، أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` الجديد أو hooks. بالنسبة لعمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل الابن الفعلي `openclaw gateway run`، وليس عملية مغلّفة فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على طول مسار البحث العادي لـ Node `node_modules` الخاص بـ Plugin؛ ولا
يستورد كود وقت تشغيل Plugin، ولا يشغّل مدير حزم، ولا يصلح
التبعيات المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يغيّر الإعدادات، ولا يثبّت الحزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص،
وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمن داخل صورة Docker مُعبأة، اربط مجلد مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة
هذه قبل `/app/dist/extensions/synology-chat`؛ ويبقى مجلد المصدر المنسوخ
بشكل عادي غير فعّال لكي تستمر التثبيتات المعبأة العادية في استخدام dist المترجم.

لتصحيح أخطاء hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من تمريرة فحص محملة كوحدة. لا يثبّت فحص وقت التشغيل التبعيات أبدًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة Plugins القابلة للتنزيل المفقودة المشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) وجود `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ مجلد محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة التي تم حلها (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتب عمليات التثبيت والتحديث هذه البيانات إلى `plugins/installs.json` تحت مجلد حالة OpenClaw النشط. خريطة `installRecords` في المستوى الأعلى هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك السجلات الخاصة ببيانات Plugin الوصفية المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة تخزين سجل باردة مشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير، ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، تعاملها قراءات وقت التشغيل كمدخلات توافق من دون إعادة كتابة `openclaw.json`. تنقل كتابات Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس Plugin وتزيل مفتاح الإعدادات عندما تكون كتابة الإعدادات مسموحة؛ إذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات لكي لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المستمر، وإدخالات قوائم السماح/الرفض الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم تعيين `--keep-files`، يزيل إلغاء التثبيت أيضًا مجلد التثبيت المُدار المتتبَّع عندما يكون داخل جذر امتدادات Plugin في OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تعاد فتحة الذاكرة إلى `memory-core`.

<Note>
يُدعَم `--keep-config` كاسم مستعار مهمل لـ `--keep-files`.
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
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. يعني ذلك أن وسوم dist-tags المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

    بالنسبة لتثبيتات npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع dist-tag أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة مرة أخرى إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضًا مرة أخرى إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="تحديثات قناة Beta">
    يعيد `openclaw plugins update` استخدام مواصفة Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` بالإضافة إلى ذلك قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات npm وClawHub الخاصة بـ Plugin على الخط الافتراضي استخدام `@beta` أولًا، ثم تعود إلى مواصفة default/latest المسجلة إذا لم يوجد إصدار beta لذلك Plugin. يُبلَّغ عن ذلك الرجوع كتحذير ولا يفشل تحديث النواة. تبقى الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف التكامل">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأداة المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة تكامل مخزنة وتتغير بصمة الأداة التي تم جلبها، يعامل OpenClaw ذلك كانحراف في أداة npm. يطبع أمر `openclaw plugins update` التفاعلي البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بشكل مغلق ما لم يقدّم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة في فحص الكود الخطير المضمن أثناء تحديثات Plugin. ما زال لا يتجاوز كتل سياسة `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، وينطبق فقط على تحديثات Plugin، لا على تحديثات حزم hook.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وقدرات البيان، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP من دون استيراد وقت تشغيل Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة Plugin وتضمين hooks، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلغ فحص وقت التشغيل عن تبعيات Plugin المفقودة مباشرةً؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً تُثبَّت أوامر CLI التي يملكها Plugin كمجموعات أوامر جذرية ضمن `openclaw`، لكن يمكن لـ Plugins أيضًا تسجيل أوامر متداخلة تحت أصل من النواة مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **إمكانة-بسيطة** — نوع إمكانة واحد (مثل Plugin خاص بالمزوّد فقط)
- **إمكانة-هجينة** — أنواع إمكانات متعددة (مثل النص + الكلام + الصور)
- **خطافات-فقط** — خطافات فقط، بلا إمكانات أو أسطح
- **بلا-إمكانة** — أدوات/أوامر/خدمات لكن بلا إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج الإمكانات.

<Note>
تُخرج الراية `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحزمة، وأعمدة ملخص الخطافات. `info` هو اسم بديل لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا يطبع `No plugin issues detected.`

إذا كان Plugin مكوّن موجودًا على القرص لكنه محجوب بسبب فحوصات أمان المسار في المُحمّل، فإن تحقق التكوين يُبقي إدخال Plugin ويبلّغ عنه باعتباره `present but blocked`. أصلح تشخيص Plugin المحجوب السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة تكوين `plugins.entries.<id>` أو `plugins.allow`.

في حالات فشل شكل الوحدة مثل غياب تصديرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصدير في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة الدائم في OpenClaw لهوية Plugin المثبّت، وحالة التمكين، وبيانات المصدر الوصفية، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل الدائم موجودًا أو محدثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin الدائم، وسياسة التكوين، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يُصلح `openclaw doctor --fix` أيضًا الانحراف المُدار المرتبط بـ npm والقريب من السجل: إذا كانت حزمة `@openclaw/*` يتيمة أو مستردة ضمن جذر npm الخاص بـ Plugin المُدار تحجب Plugin مضمّنًا، يزيل doctor تلك الحزمة القديمة ويعيد بناء السجل كي يتحقق بدء التشغيل مقابل البيان المضمّن.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق طارئ مهمل لحالات فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع عبر متغير البيئة مخصص فقط لاسترداد بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

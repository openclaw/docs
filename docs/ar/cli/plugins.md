---
read_when:
    - تريد تثبيت أو إدارة Plugins Gateway أو الحزم المتوافقة
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-10T19:31:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6afa3ff12b3672d321d16c831672340ccde70b153671f2c328f578b5c66348b
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway وحزم الخطافات والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="Manage plugins" href="/ar/plugins/manage-plugins">
    أمثلة سريعة للتثبيت، والعرض، والتحديث، وإلغاء التثبيت، والنشر.
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

للتحقيق في بطء التثبيت، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
في وضع Nix (`OPENCLAW_NIX_MODE=1`)، تكون معدِّلات دورة حياة Plugin معطلة. استخدم مصدر Nix لهذا التثبيت بدلاً من `plugins install` أو `plugins update` أو `plugins uninstall` أو `plugins enable` أو `plugins disable`؛ وبالنسبة إلى nix-openclaw، استخدم [البداية السريعة](https://github.com/openclaw/nix-openclaw#quick-start) التي تبدأ بالوكيل.
</Note>

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها مفعلاً افتراضياً (مثل مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ بينما يتطلب بعضها الآخر `plugins enable`.

يجب أن تأتي Plugins الأصلية لـ OpenClaw مع `openclaw.plugin.json` يتضمن JSON Schema مضمّناً (`configSchema`، حتى لو كان فارغاً). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلاً من ذلك.

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

يمكن للمشرفين الذين يختبرون عمليات التثبيت وقت الإعداد تجاوز مصادر تثبيت Plugin
التلقائية باستخدام متغيرات بيئة محمية. راجع
[تجاوزات تثبيت Plugin](/ar/plugins/install-overrides).

<Warning>
تُثبَّت أسماء الحزم المجردة من npm افتراضياً أثناء انتقال الإطلاق. استخدم `clawhub:<package>` لـ ClawHub. تعامل مع عمليات تثبيت Plugin مثل تشغيل التعليمات البرمجية. فضّل الإصدارات المثبّتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء حزم جاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يبقى Npm
مساراً احتياطياً مدعوماً ومساراً للتثبيت المباشر. عادت حزم Plugin المملوكة لـ OpenClaw
ضمن `@openclaw/*` إلى النشر على npm؛ راجع القائمة الحالية
على [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) أو
[مخزون Plugin](/ar/plugins/plugin-inventory). تستخدم التثبيتات المستقرة `latest`.
تفضّل عمليات التثبيت والتحديث عبر قناة Beta وسم التوزيع `beta` في npm عندما يكون ذلك الوسم
متاحاً، ثم تعود إلى `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    إذا كان قسم `plugins` لديك مدعوماً بـ `$include` ذي ملف واحد، فإن `plugins install/update/enable/disable/uninstall` يكتب إلى ذلك الملف المضمّن ويترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بصورة مغلقة بدلاً من التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، يفشل `plugins install` عادةً بصورة مغلقة ويطلب منك تشغيل `openclaw doctor --fix` أولاً. أثناء بدء تشغيل Gateway وإعادة التحميل الساخن، تفشل إعدادات Plugin غير الصالحة بصورة مغلقة مثل أي إعدادات أخرى غير صالحة؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن يختار صراحةً `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة مسبقاً في مكانها. استخدمه عندما تعيد عمداً تثبيت المعرّف نفسه من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات الروتينية لـ Plugin من npm متتبع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يوقف OpenClaw العملية ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلاً استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="--pin scope">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحاً مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدراً مثبتاً. ولا يُدعم مع `--marketplace`، لأن تثبيتات السوق تحفظ بيانات تعريف مصدر السوق بدلاً من spec لـ npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار طوارئ للحالات الإيجابية الكاذبة في ماسح التعليمات البرمجية الخطرة المدمج. يسمح بمتابعة التثبيت حتى عندما يبلّغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطاف `before_install` الخاص بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يبقى `openclaw skills install` مساراً منفصلاً لتنزيل/تثبيت Skills من ClawHub.

    إذا حُظر Plugin نشرته على ClawHub بسبب فحص سجل، فاستخدم خطوات الناشر في [ClawHub](/ar/clawhub/security).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` هو أيضاً سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطافات المفلترة وتمكين كل خطاف، وليس لتثبيت الحزم.

    تكون مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محلياً ضمن المشروع مع `--ignore-scripts` للسلامة، حتى عندما تحتوي صدفتك على إعدادات تثبيت npm عامة. ترث جذور npm المُدارة لـ Plugin قيم `overrides` الخاصة بـ npm على مستوى حزمة OpenClaw، لذلك تنطبق تثبيتات أمان المضيف على تبعيات Plugin المرفوعة أيضاً.

    استخدم `npm:<package>` عندما تريد جعل حل npm صريحاً. كما تُثبَّت مواصفات الحزم المجردة مباشرةً من npm أثناء انتقال الإطلاق.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إصدارات التصحيح المختومة بالتاريخ الخاصة بـ OpenClaw مثل `2026.5.3-1` هي إصدارات مستقرة لهذا الفحص. إذا حلّ npm أياً من هذين إلى إصدار تمهيدي، يوقف OpenClaw العملية ويطلب منك الاشتراك صراحةً بوسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسمي (مثل `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة scoped صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    استخدم `git:<repo>` للتثبيت مباشرةً من مستودع git. تتضمن الصيغ المدعومة `git:github.com/owner/repo`، و`git:owner/repo`، وروابط الاستنساخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` لسحب فرع أو وسم أو commit قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتسحب المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص التعليمات البرمجية الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى commit المحلول حتى يتمكن `openclaw plugins update` من إعادة حل المصدر لاحقاً.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل أساليب gateway وأوامر CLI. إذا سجّل Plugin جذراً لـ CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرةً عبر CLI الجذري لـ OpenClaw، مثلاً `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    الأرشيفات المدعومة: `.zip`، و`.tgz`، و`.tar.gz`، و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ أما الأرشيفات التي تحتوي على `package.json` فقط فتُرفض قبل أن يكتب OpenClaw سجلات التثبيت.

    استخدم `npm-pack:<path.tgz>` عندما يكون الملف كرة tarball من npm-pack وتريد
    اختبار مسار تثبيت جذر npm المُدار نفسه المستخدم في تثبيتات السجل،
    بما في ذلك التحقق من `package-lock.json`، وفحص التبعيات المرفوعة، و
    سجلات تثبيت npm. ما تزال مسارات الأرشيف العادية تُثبَّت كأرشيفات محلية
    تحت جذر إضافات Plugin.

    تُدعم أيضاً تثبيتات سوق Claude.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحاً `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

تُثبَّت مواصفات Plugin الآمنة لـ npm والمجردة من npm افتراضياً أثناء انتقال الإطلاق:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لجعل الحل الخاص بـ npm فقط صريحاً:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw يتحقق من توافق API المعلن للـ Plugin / الحد الأدنى لتوافق Gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أداة ClawPack، ينزّل OpenClaw ملف `.tgz` الخاص بحزمة npm ذات الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأداة، ثم يثبتها عبر مسار الأرشيف العادي. تظل إصدارات ClawHub الأقدم التي لا تحتوي على بيانات ClawPack الوصفية مثبتة عبر مسار التحقق القديم لأرشيف الحزمة. تحتفظ عمليات التثبيت المسجلة ببيانات مصدر ClawHub الوصفية، ونوع الأداة، وتكامل npm، وshasum الخاص بـ npm، واسم tarball، وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ عمليات تثبيت ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار بحيث يمكن لـ `openclaw plugins update` متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار السوق

استخدم اختصار `plugin@marketplace` عندما يكون اسم السوق موجودًا في ذاكرة التخزين المؤقت للسجل المحلي في Claude عند `~/.claude/plugins/known_marketplaces.json`:

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
  <Tab title="Marketplace sources">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="Remote marketplace rules">
    بالنسبة إلى الأسواق البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات الـ Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض مصادر الـ Plugin من HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من المصادر غير المسارية في البيانات الوصفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات والأرشيفات المحلية، يكتشف OpenClaw تلقائيًا:

- إضافات OpenClaw الأصلية (`openclaw.plugin.json`)
- حزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر الـ Plugin العادي وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعَم Skills الخاصة بالحزم، وSkills الأوامر في Claude، وافتراضات Claude `settings.json`، وافتراضات Claude `.lsp.json` / `lspServers` المعلنة في البيان، وSkills الأوامر في Cursor، وأدلة hooks المتوافقة في Codex؛ أما إمكانات الحزم المكتشفة الأخرى فتظهر في التشخيصات/المعلومات لكنها لم تُوصّل بعد إلى تنفيذ وقت التشغيل.
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
  انتقل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات المصدر/الأصل/الإصدار/التنشيط.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل وحالة تثبيت تبعيات الحزم.
</ParamField>

<Note>
يقرأ `plugins list` سجل الـ Plugin المحلي الدائم أولًا، مع بديل مشتق من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. يفيد ذلك في التحقق مما إذا كان الـ Plugin مثبتًا وممكّنًا ومرئيًا لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا مباشرًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود الـ Plugin، أو التمكين، أو سياسة hooks، أو `plugins.load.paths`، أعد تشغيل Gateway التي تخدم القناة قبل توقع تشغيل كود `register(api)` أو hooks الجديدة. بالنسبة إلى النشر البعيد/الحاويات، تحقق من أنك تعيد تشغيل الطفل الفعلي `openclaw gateway run`، وليس عملية غلاف فقط.

يتضمن `plugins list --json` قيمة `dependencyStatus` لكل Plugin من `package.json`
`dependencies` و`optionalDependencies`. يتحقق OpenClaw مما إذا كانت أسماء تلك الحزم
موجودة على طول مسار البحث العادي `node_modules` الخاص بالـ Plugin في Node؛ ولا
يستورد كود وقت تشغيل الـ Plugin، أو يشغّل مدير حزم، أو يصلح التبعيات
المفقودة.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية،
ولا يعدّل الإعدادات، ولا يثبت الحزم، ولا يحمّل كود وقت تشغيل الـ Plugin. تتضمن
نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح
تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمن داخل صورة Docker معبأة، اربط دليل مصدر الـ Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركّبة تلك
قبل `/app/dist/extensions/synology-chat`؛ ويظل دليل مصدر منسوخ عاديًا
غير نشط بحيث تستمر عمليات التثبيت المعبأة العادية في استخدام dist المترجم.

لتصحيح أخطاء hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من تمريرة فحص محمّلة بالوحدة. لا يثبت فحص وقت التشغيل التبعيات مطلقًا؛ استخدم `openclaw doctor --fix` لتنظيف حالة التبعيات القديمة أو استعادة الإضافات القابلة للتنزيل المفقودة المشار إليها في الإعدادات.
- يؤكد `openclaw gateway status --deep --require-rpc` الـ Gateway القابلة للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثات غير المضمنة (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) وجود `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يُضاف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن عمليات التثبيت المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في عمليات تثبيت npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس الـ Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس الـ Plugin

بيانات تثبيت الـ Plugin الوصفية هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتب عمليات التثبيت والتحديث هذه البيانات إلى `plugins/installs.json` تحت دليل حالة OpenClaw النشط. خريطة `installRecords` في المستوى الأعلى هي المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك السجلات الخاصة ببيانات Plugin وصفية معطلة أو مفقودة. مصفوفة `plugins` هي ذاكرة تخزين مؤقت للسجل البارد مشتقة من البيان. يتضمن الملف تحذيرًا بعدم التحرير ويُستخدم بواسطة `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل الـ Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة في الإعدادات، تتعامل قراءات وقت التشغيل معها كمدخلات توافق دون إعادة كتابة `openclaw.json`. تنقل عمليات كتابة الـ Plugin الصريحة و`openclaw doctor --fix` تلك السجلات إلى فهرس الـ Plugin وتزيل مفتاح الإعدادات عندما تكون كتابات الإعدادات مسموحة؛ وإذا فشلت أي من عمليتي الكتابة، تُحفَظ سجلات الإعدادات كي لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات الـ Plugin من `plugins.entries`، وفهرس الـ Plugin الدائم، وإدخالات قوائم السماح/الرفض الخاصة بالـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضًا دليل التثبيت المُدار المتتبَّع عندما يكون داخل جذر امتدادات الـ Plugin في OpenClaw. بالنسبة إلى إضافات الذاكرة النشطة، تُعاد فتحة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على عمليات تثبيت الـ Plugin المتتبعة في فهرس الـ Plugin المُدار وعمليات تثبيت hook-pack المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك الـ Plugin. يعني ذلك أن وسوم dist المخزنة سابقًا مثل `@beta` والإصدارات الدقيقة المثبتة تظل مستخدمة في عمليات `update <id>` اللاحقة.

    بالنسبة إلى عمليات تثبيت npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة مع وسم dist أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة رجوعًا إلى سجل الـ Plugin المتتبع، ويحدّث ذلك الـ Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المعتمدة على المعرف.

    تمرير اسم حزمة npm دون إصدار أو وسم يحل أيضًا رجوعًا إلى سجل الـ Plugin المتتبع. استخدم هذا عندما يكون الـ Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="Beta channel updates">
    يعيد `openclaw plugins update` استخدام مواصفة الـ Plugin المتتبعة ما لم تمرر مواصفة جديدة. يعرف `openclaw update` بالإضافة إلى ذلك قناة تحديث OpenClaw النشطة: على قناة beta، تحاول سجلات npm وClawHub الخاصة بالـ Plugin على الخط الافتراضي استخدام `@beta` أولًا، ثم تعود إلى المواصفة الافتراضية/الأحدث المسجلة إذا لم يوجد إصدار beta للـ Plugin. تظل الإصدارات الدقيقة والوسوم الصريحة مثبتة على ذلك المحدد.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبت مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأداة المسجلة يطابقان الهدف المحلول بالفعل، يُتخطى التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد قيمة تكامل مخزنة ويتغير تجزئة الأداة المجلبة، يتعامل OpenClaw مع ذلك كأنه انحراف في أداة npm. يطبع أمر `openclaw plugins update` التفاعلي القيم المتوقعة والفعلية للتجزئة ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث غير التفاعلية بشكل مغلق ما لم يقدم المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    يتوفر `--dangerously-force-unsafe-install` أيضًا في `plugins update` كتجاوز طارئ للنتائج الإيجابية الكاذبة في فحص الكود الخطر المدمج أثناء تحديثات الـ Plugin. لكنه لا يتجاوز حظر سياسة `before_install` الخاصة بالـ Plugin أو حظر فشل الفحص، وينطبق فقط على تحديثات الـ Plugin، وليس على تحديثات hook-pack.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض Inspect الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وإمكانات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد وقت تشغيل الـ Plugin افتراضيًا. أضف `--runtime` لتحميل وحدة الـ Plugin وتضمين hooks والأدوات والأوامر والخدمات وطرق Gateway ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن تبعيات الـ Plugin المفقودة مباشرةً؛ وتبقى عمليات التثبيت والإصلاح في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

عادةً ما تُثبَّت أوامر CLI المملوكة للـ Plugin كمجموعات أوامر جذرية في `openclaw`، لكن قد تسجل الإضافات أيضًا أوامر متداخلة تحت أصل أساسي مثل `openclaw nodes`. بعد أن يعرض `inspect --runtime` أمرًا ضمن `cliCommands`، شغّله في المسار المدرج؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin حسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin خاص بالمزوّد فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثل النص + الكلام + الصور)
- **hook-only** — خطافات فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات ولكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد حول نموذج القدرات.

<Note>
يعرض العلم `--json` تقريرًا قابلاً للقراءة آليًا ومناسبًا للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن أعمدة الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وملخص الخطافات. يُعد `info` اسمًا مستعارًا لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليمًا، يطبع `No plugin issues detected.`

إذا كان Plugin مكوّنًا موجودًا على القرص ولكنه محظور بفحوصات سلامة المسار في المحمّل، فإن التحقق من صحة الإعدادات يبقي إدخال Plugin ويبلّغ عنه بوصفه `present but blocked`. أصلح تشخيص Plugin المحظور السابق، مثل ملكية المسار أو أذونات الكتابة للعالم، بدلًا من إزالة إعداد `plugins.entries.<id>` أو `plugins.allow`.

في حالات فشل شكل الوحدة مثل غياب صادرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المستمر في OpenClaw لهوية Plugin المثبتة، وحالة تمكينها، وبيانات تعريف المصدر، وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، وجرد Plugin قراءته دون استيراد وحدات تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المستمر موجودًا أو حديثًا أو قديمًا. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المستمر، وسياسة الإعدادات، وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

يقوم `openclaw doctor --fix` أيضًا بإصلاح الانحراف المُدار المجاور للسجل في npm: إذا كانت حزمة `@openclaw/*` يتيمة أو مستعادة تحت جذر npm المُدار الخاص بـ Plugin تحجب Plugin مرفقًا، فإن doctor يزيل تلك الحزمة القديمة ويعيد بناء السجل بحيث يتحقق بدء التشغيل مقابل البيان المرفق.

<Warning>
يُعد `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق قديمًا لكسر الزجاج عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالرجوع إلى متغير البيئة مخصص فقط لاستعادة بدء التشغيل في حالات الطوارئ أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة بالإضافة إلى بيان السوق المحلل وإدخالات Plugin.

## ذات صلة

- [بناء Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ClawHub](/ar/clawhub)

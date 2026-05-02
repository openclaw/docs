---
read_when:
    - تريد تثبيت أو إدارة Pluginات Gateway أو الحزم المتوافقة
    - تريد استكشاف أخطاء فشل تحميل Plugin وإصلاحها
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T07:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 963a4292f86d651a23f06ee83fd82d7ad80cb99ff3397a665940d8247225252c
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway وحزم الخطافات والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتمكينها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعداد.
  </Card>
  <Card title="الأمان" href="/ar/gateway/security">
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

لاستقصاء بطء التثبيت أو الفحص أو إزالة التثبيت أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يُمكّن بعضها افتراضيًا (على سبيل المثال موفرو النماذج المضمّنون، وموفرو الكلام المضمّنون، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تتضمن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). تستخدم الحزم المتوافقة بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات المطوّلة النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

### التثبيت

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # ClawHub first, then npm
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
يتم التحقق من أسماء الحزم المجردة في ClawHub أولًا، ثم npm. تعامل مع تثبيتات Plugin كما تتعامل مع تشغيل التعليمات البرمجية. يُفضّل استخدام الإصدارات المثبتة.
</Warning>

يستعلم `plugins search` من ClawHub عن حزم Plugin القابلة للتثبيت ويطبع
أسماء الحزم الجاهزة للتثبيت. يبحث في حزم code-plugin وbundle-plugin،
وليس Skills. استخدم `openclaw skills search` للبحث عن Skills في ClawHub.

<Note>
ClawHub هو سطح التوزيع والاكتشاف الأساسي لمعظم Plugins. يظل npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. أثناء الترحيل إلى
ClawHub، لا يزال OpenClaw يوفّر بعض حزم Plugin المملوكة لـ OpenClaw بصيغة `@openclaw/*`
على npm؛ وقد تتأخر إصدارات تلك الحزم عن المصدر المضمّن بين
دورات إصدار Plugin. إذا أبلغ npm أن حزمة Plugin مملوكة لـ OpenClaw مهجورة، فهذا
الإصدار المنشور أثر خارجي قديم؛ استخدم Plugin المضمّنة مع
OpenClaw الحالي أو نسخة محلية حتى تُنشر حزمة npm أحدث.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعداد والاسترداد من الإعداد غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر ومصفوفات التضمين والتضمينات ذات التجاوزات الشقيقة بإغلاق آمن بدلًا من التسطيح. راجع [تضمينات الإعداد](/ar/gateway/configuration) للأشكال المدعومة.

    إذا كان الإعداد غير صالح أثناء التثبيت، يفشل `plugins install` عادةً بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway، يُعزل الإعداد غير الصالح لـ Plugin واحدة إلى تلك Plugin بحيث يمكن للقنوات وPlugins الأخرى الاستمرار في العمل؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّنة لPlugins التي تختار صراحةً استخدام `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطافات مثبتة بالفعل في مكانها. استخدمه عندما تعيد تثبيت المعرّف نفسه عمدًا من مسار محلي جديد أو أرشيف أو حزمة ClawHub أو أثر npm. للترقيات الاعتيادية لـ Plugin من npm يتم تتبعها بالفعل، يُفضّل استخدام `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. لا يُدعم مع تثبيتات `git:`؛ استخدم مرجع git صريحًا مثل `git:github.com/acme/plugin@v1.2.3` عندما تريد مصدرًا مثبتًا. ولا يُدعم مع `--marketplace`، لأن تثبيتات marketplace تحفظ بيانات تعريف مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    يُعد `--dangerously-force-unsafe-install` خيارًا لكسر الزجاج لحالات الإيجابيات الكاذبة في ماسح التعليمات البرمجية الخطرة المضمّن. يسمح للتثبيت بالاستمرار حتى عندما يبلّغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز كتل سياسة خطاف `before_install` الخاصة بـ Plugin و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على مسارات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` مسار تنزيل/تثبيت Skills منفصلًا من ClawHub.

    إذا حُظرت Plugin نشرتها على ClawHub بسبب فحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يُعد `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` للرؤية المفلترة للخطافات والتمكين لكل خطاف، وليس لتثبيت الحزم.

    مواصفات npm هي **للسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا داخل المشروع مع `--ignore-scripts` للأمان، حتى عندما تحتوي الصدفة لديك على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد تخطي البحث في ClawHub والتثبيت مباشرة من npm. لا تزال مواصفات الحزم المجردة تفضّل ClawHub ولا تعود إلى npm إلا عندما لا يحتوي ClawHub على تلك الحزمة أو ذلك الإصدار.

    تبقى المواصفات المجردة و`@latest` على المسار المستقر. إذا حل npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً بوسم تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin رسميًا (على سبيل المثال `diffs`)، يثبّت OpenClaw إدخال الكتالوج مباشرة. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريح (على سبيل المثال `@scope/diffs`).

  </Accordion>
  <Accordion title="مستودعات Git">
    استخدم `git:<repo>` للتثبيت مباشرة من مستودع git. تشمل الصيغ المدعومة `git:github.com/owner/repo` و`git:owner/repo` وعناوين الاستنساخ الكاملة `https://` و`ssh://` و`git://` و`file://` و`git@host:owner/repo.git`. أضف `@<ref>` أو `#<ref>` للتحقق من فرع أو وسم أو التزام قبل التثبيت.

    تستنسخ تثبيتات Git إلى دليل مؤقت، وتتحقق من المرجع المطلوب عند وجوده، ثم تستخدم مثبت دليل Plugin العادي. يعني ذلك أن التحقق من البيان، وفحص التعليمات البرمجية الخطرة، وعمل تثبيت مدير الحزم، وسجلات التثبيت تتصرف مثل تثبيتات npm. تتضمن تثبيتات git المسجلة عنوان URL/المرجع للمصدر بالإضافة إلى الالتزام المحلول بحيث يمكن لـ `openclaw plugins update` إعادة حل المصدر لاحقًا.

    بعد التثبيت من git، استخدم `openclaw plugins inspect <id> --runtime --json` للتحقق من تسجيلات وقت التشغيل مثل طرق gateway وأوامر CLI. إذا سجلت Plugin جذر CLI باستخدام `api.registerCli`، فنفّذ ذلك الأمر مباشرة عبر CLI الجذر لـ OpenClaw، على سبيل المثال `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي على `package.json` فقط قبل أن يكتب OpenClaw سجلات التثبيت.

    تثبيتات marketplace الخاصة بـ Claude مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا بصيغة `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات Plugin المجردة الآمنة لـ npm. ولا يعود إلى npm إلا إذا لم يكن لدى ClawHub تلك الحزمة أو ذلك الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لفرض الحل عبر npm فقط، على سبيل المثال عندما يتعذر الوصول إلى ClawHub أو عندما تعرف أن الحزمة موجودة على npm فقط:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

يتحقق OpenClaw من توافق API المعلنة لـ Plugin / الحد الأدنى لتوافق gateway قبل التثبيت. عندما ينشر إصدار ClawHub المحدد أثر ClawPack، ينزّل OpenClaw نسخة ClawPack ذات الإصدار، ويتحقق من ترويسة ملخص ClawHub وملخص الأثر، ثم يثبتها عبر مسار الأرشيف العادي. لا تزال إصدارات ClawHub الأقدم التي لا تحتوي على بيانات تعريف ClawPack تُثبت عبر مسار التحقق القديم من أرشيف الحزمة. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub وحقائق ملخص ClawPack للتحديثات اللاحقة.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار بحيث يمكن لـ `openclaw plugins update` متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

#### اختصار Marketplace

استخدم اختصار `plugin@marketplace` عندما يكون اسم marketplace موجودًا في ذاكرة التخزين المؤقت للسجل المحلي لـ Claude في `~/.claude/plugins/known_marketplaces.json`:

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
    - اسم Marketplace معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر Marketplace محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد Marketplace البعيد">
    بالنسبة إلى Marketplaces البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع Marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، وغيرها من مصادر Plugin غير المسارية من البيانات التعريفية البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائياً:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حِزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حِزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكونات Claude الافتراضي)
- حِزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحِزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. حالياً، تُدعَم Skills الخاصة بالحِزم، وSkills أوامر Claude، وافتراضيات Claude في `settings.json`، وافتراضيات Claude في `.lsp.json` / `lspServers` المعلنة في البيان، وSkills أوامر Cursor، وأدلة hooks المتوافقة مع Codex؛ وتظهر إمكانات الحِزم الأخرى المكتشفة في diagnostics/info لكنها لم تُوصَل بعد بتنفيذ وقت التشغيل.
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
  اعرض فقط Plugins المفعّلة.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آلياً مع تشخيصات السجل.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولاً، مع بديل مشتق من البيان فقط عندما يكون السجل مفقوداً أو غير صالح. وهو مفيد للتحقق مما إذا كان Plugin مثبتاً ومفعلاً ومرئياً لتخطيط بدء التشغيل البارد، لكنه ليس فحصاً حياً لوقت تشغيل عملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو تفعيله أو سياسة hook أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقّع تشغيل كود `register(api)` الجديد أو hooks الجديدة. بالنسبة إلى عمليات النشر البعيدة/داخل الحاويات، تحقق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس عملية غلاف فقط.
</Note>

`plugins search` هو بحث بعيد في كتالوج ClawHub. لا يفحص الحالة المحلية، ولا يغيّر الإعدادات، ولا يثبت الحِزم، ولا يحمّل كود وقت تشغيل Plugin. تتضمن نتائج البحث اسم حزمة ClawHub، والعائلة، والقناة، والإصدار، والملخص، وتلميح تثبيت مثل `openclaw plugins install clawhub:<package>`.

للعمل على Plugin مضمّن داخل صورة Docker مُغلّفة، اربط دليل مصدر Plugin فوق مسار المصدر المُغلّف المطابق، مثل `/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المركبة قبل `/app/dist/extensions/synology-chat`؛ ويبقى دليل المصدر المنسوخ نسخاً عادياً خاملاً بحيث تظل التثبيتات المُغلّفة العادية تستخدم dist المترجم.

لتصحيح أخطاء hooks وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --runtime --json` hooks المسجلة والتشخيصات من مرور فحص يحمّل الوحدة. لا يثبّت فحص وقت التشغيل الاعتماديات أبداً؛ استخدم `openclaw doctor --fix` لتنظيف حالة الاعتماديات القديمة أو تثبيت Plugins القابلة للتنزيل المفقودة والمهيأة.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب hooks المحادثات غير المضمّنة (`llm_input`، `llm_output`، `before_agent_finalize`، `agent_end`) ضبط `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعَم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلاً من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تثبيت Plugin الوصفية هي حالة مُدارة آلياً، وليست إعدادات مستخدم. تكتبها التثبيتات والتحديثات إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. تُعد خريطة `installRecords` ذات المستوى الأعلى المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك سجلات بيانات Plugins المعطلة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل البدء البارد المشتقة من البيان. يتضمن الملف تحذيراً بعدم التحرير، ويُستخدم بواسطة `openclaw plugins update` وإلغاء التثبيت والتشخيصات وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعدادات؛ إذا فشلت أي من عمليتي الكتابة، تُحفظ سجلات الإعدادات حتى لا تُفقد بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries` وفهرس Plugin المحفوظ وإدخالات قوائم السماح/الرفض لـ Plugin وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يُضبط `--keep-files`، يزيل إلغاء التثبيت أيضاً دليل التثبيت المُدار المتتبع عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. بالنسبة إلى Plugins الذاكرة النشطة، تُعاد خانة الذاكرة إلى `memory-core`.

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

تنطبق التحديثات على تثبيتات Plugin المتتبعة في فهرس Plugin المُدار وتثبيتات حِزم hooks المتتبعة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عند تمرير معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم dist-tags المخزنة سابقاً مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في تشغيلات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضاً تمرير مواصفة حزمة npm صريحة مع وسم dist-tag أو إصدار دقيق. يحل OpenClaw اسم تلك الحزمة رجوعاً إلى سجل Plugin المتتبع، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرّف.

    يؤدي تمرير اسم حزمة npm دون إصدار أو وسم أيضاً إلى الحل رجوعاً إلى سجل Plugin المتتبع. استخدم هذا عندما يكون Plugin مثبتاً على إصدار دقيق وتريد نقله مرة أخرى إلى خط الإصدار الافتراضي للسجل.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm حي، يفحص OpenClaw إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد تجزئة سلامة مخزنة وتتغير تجزئة الأثر المجلب، يتعامل OpenClaw مع ذلك بوصفه انحرافاً في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي التجزئات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل مساعدات التحديث غير التفاعلية بإغلاق آمن ما لم يوفّر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضاً في `plugins update` كتجاوز طارئ للإيجابيات الكاذبة في فحص الكود الخطر المدمج أثناء تحديثات Plugin. ومع ذلك، فهو لا يتجاوز حظر سياسات `before_install` الخاصة بـ Plugin أو حظر فشل الفحص، ولا ينطبق إلا على تحديثات Plugin، وليس تحديثات حِزم hooks.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

يعرض الفحص الهوية، وحالة التحميل، والمصدر، وإمكانات البيان، ورايات السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وإمكانات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP دون استيراد وقت تشغيل Plugin افتراضياً. أضف `--runtime` لتحميل وحدة Plugin وتضمين hooks، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP المسجلة. يبلّغ فحص وقت التشغيل عن اعتماديات Plugin المفقودة مباشرة؛ وتبقى التثبيتات والإصلاحات في `openclaw plugins install` و`openclaw plugins update` و`openclaw doctor --fix`.

تُثبَّت أوامر CLI المملوكة لـ Plugin كمجموعات أوامر جذرية ضمن `openclaw`. بعد أن يعرض `inspect --runtime` أمراً تحت `cliCommands`، شغّله كـ `openclaw <command> ...`؛ على سبيل المثال، يمكن التحقق من Plugin يسجل `demo-git` باستخدام `openclaw demo-git ping`.

يُصنَّف كل Plugin حسب ما يسجله فعلياً في وقت التشغيل:

- **plain-capability** — نوع إمكانية واحد (مثلاً Plugin خاص بمزوّد فقط)
- **hybrid-capability** — أنواع إمكانات متعددة (مثلاً نص + كلام + صور)
- **hook-only** — hooks فقط، بلا إمكانات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن بلا إمكانات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمعرفة المزيد عن نموذج الإمكانات.

<Note>
تخرج راية `--json` تقريراً قابلاً للقراءة آلياً ومناسباً للبرمجة النصية والتدقيق. يعرض `inspect --all` جدولاً على مستوى الأسطول يتضمن الشكل، وأنواع الإمكانات، وإشعارات التوافق، وإمكانات الحِزم، وأعمدة ملخص hooks. `info` هو اسم مستعار لـ `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليماً يطبع `No plugin issues detected.`

بالنسبة إلى حالات فشل شكل الوحدة مثل فقدان تصديرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصدير في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة البارد المحفوظ في OpenClaw لهوية Plugin وتفعيله وبيانات المصدر الوصفية وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك المزوّد، وتصنيف إعداد القناة، ومخزون Plugin قراءته دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجوداً أو حديثاً أو قديماً. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ، وسياسة الإعدادات، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت تشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` هو مفتاح توافق طارئ مهمل لحالات فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ والبديل عبر env مخصص فقط لاسترداد بدء التشغيل الطارئ أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة Marketplace مسار Marketplace محلياً، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة إضافة إلى بيان Marketplace المُحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

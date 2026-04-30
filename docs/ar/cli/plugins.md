---
read_when:
    - تريد تثبيت Plugins الخاصة بـ Gateway أو الحِزم المتوافقة أو إدارتها
    - تريد تصحيح أخطاء فشل تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (list، install، marketplace، uninstall، enable/disable، deps، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-30T07:50:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 381e3243eaefb5b5e31db8fd2ba459773649a6ef427080a12018ea92b25f707c
    source_path: cli/plugins.md
    workflow: 16
---

إدارة Plugins الخاصة بـ Gateway، وحِزم الخطّافات، والحِزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف مشكلاتها وإصلاحها.
  </Card>
  <Card title="حِزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحِزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعدادات.
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
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

لاستقصاء التثبيت البطيء، أو الفحص، أو إلغاء التثبيت، أو تحديث السجل، شغّل
الأمر مع `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. يكتب التتبع توقيتات المراحل
إلى stderr ويحافظ على قابلية تحليل مخرجات JSON. راجع [تصحيح الأخطاء](/ar/help/debugging#plugin-lifecycle-trace).

<Note>
تأتي Plugins المضمّنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (مثل مزوّدي النماذج المضمّنين، ومزوّدي الكلام المضمّنين، وPlugin المتصفح المضمّن)؛ ويتطلب بعضها الآخر `plugins enable`.

يجب أن تشحن Plugins الأصلية لـ OpenClaw ملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). تستخدم الحِزم المتوافقة بيانات الحِزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما تعرض مخرجات القائمة/المعلومات التفصيلية النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى إمكانات الحزمة المكتشفة.
</Note>

### التثبيت

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
تُفحَص أسماء الحِزم المجردة مقابل ClawHub أولًا، ثم npm. تعامل مع تثبيتات Plugin كما لو أنك تشغّل تعليمات برمجية. فضّل الإصدارات المثبتة.
</Warning>

<Note>
ClawHub هو واجهة التوزيع والاكتشاف الأساسية لمعظم Plugins. يظل npm
مسارًا احتياطيًا مدعومًا ومسار تثبيت مباشرًا. أثناء الانتقال إلى
ClawHub، لا يزال OpenClaw يشحن بعض حِزم Plugin المملوكة لـ OpenClaw من نوع `@openclaw/*`
على npm؛ وقد تتأخر إصدارات تلك الحِزم عن المصدر المضمّن بين دفعات إصدار Plugin.
إذا أفاد npm بأن حزمة Plugin مملوكة لـ OpenClaw مهملة، فإن
ذلك الإصدار المنشور أثر خارجي قديم؛ استخدم Plugin المضمّن مع
OpenClaw الحالي أو نسخة محلية حتى تُنشر حزمة npm أحدث.
</Note>

<AccordionGroup>
  <Accordion title="تضمينات الإعدادات والاسترداد من الإعدادات غير الصالحة">
    إذا كان قسم `plugins` لديك مدعومًا بملف `$include` واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمّن وتترك `openclaw.json` دون تغيير. تفشل تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة بإغلاق آمن بدل التسطيح. راجع [تضمينات الإعدادات](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كانت الإعدادات غير صالحة أثناء التثبيت، فعادةً يفشل `plugins install` بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولًا. أثناء بدء تشغيل Gateway، تُعزَل الإعدادات غير الصالحة لـ Plugin واحد إلى ذلك Plugin حتى تتمكن القنوات وPlugins الأخرى من متابعة العمل؛ ويمكن لـ `openclaw doctor --fix` عزل إدخال Plugin غير الصالح. الاستثناء الوحيد الموثق في وقت التثبيت هو مسار استرداد ضيق لـ Plugin مضمّن صرّح صراحةً بالاشتراك في `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويستبدل Plugin أو حزمة خطّافات مثبتة مسبقًا في مكانها. استخدمه عندما تعيد عمدًا تثبيت نفس المعرّف من مسار محلي جديد، أو أرشيف، أو حزمة ClawHub، أو أثر npm. للترقيات المعتادة لـ Plugin npm متتبَّع بالفعل، فضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبت بالفعل، يتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد فعلًا استبدال التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على تثبيتات npm فقط. ولا يُدعَم مع `--marketplace`، لأن تثبيتات السوق تحتفظ ببيانات تعريف مصدر السوق بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` خيار كسر الزجاجة للحالات الإيجابية الكاذبة في ماسح التعليمات البرمجية الخطرة المضمّن. يسمح للتثبيت بالمتابعة حتى عندما يُبلغ الماسح المضمّن عن نتائج `critical`، لكنه **لا** يتجاوز حظر سياسة خطّاف `before_install` الخاص بـ Plugin، و**لا** يتجاوز إخفاقات الفحص.

    ينطبق علم CLI هذا على تدفقات تثبيت/تحديث Plugin. تستخدم تثبيتات تبعيات Skills المدعومة من Gateway تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skill منفصلًا من ClawHub.

    إذا كان Plugin نشرته على ClawHub محظورًا بفحص السجل، فاستخدم خطوات الناشر في [ClawHub](/ar/tools/clawhub).

  </Accordion>
  <Accordion title="حِزم الخطّافات ومواصفات npm">
    يمثّل `plugins install` أيضًا واجهة التثبيت لحِزم الخطّافات التي تكشف `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لرؤية الخطّافات المفلترة وتمكين كل خطّاف على حدة، وليس لتثبيت الحِزم.

    مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag** اختياري). تُرفض مواصفات Git/URL/file ونطاقات semver. تعمل تثبيتات التبعيات محليًا ضمن المشروع مع `--ignore-scripts` للسلامة، حتى عندما تحتوي بيئتك الطرفية على إعدادات تثبيت npm عامة.

    استخدم `npm:<package>` عندما تريد تخطي بحث ClawHub والتثبيت مباشرةً من npm. لا تزال مواصفات الحِزم المجردة تفضّل ClawHub ولا تنتقل إلى npm إلا عندما لا يحتوي ClawHub على تلك الحزمة أو ذلك الإصدار.

    تبقى المواصفات المجردة و`@latest` على مسار المستقر. إذا حلّ npm أيًا منهما إلى إصدار تمهيدي، يتوقف OpenClaw ويطلب منك الاشتراك صراحةً باستخدام وسم إصدار تمهيدي مثل `@beta`/`@rc` أو إصدار تمهيدي دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمّنًا (مثل `diffs`)، يثبت OpenClaw ذلك Plugin المضمّن مباشرةً. لتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugin الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح في جذر Plugin المستخرج؛ وتُرفض الأرشيفات التي تحتوي على `package.json` فقط قبل أن يكتب OpenClaw سجلات التثبيت.

    كما تُدعَم تثبيتات سوق Claude.

  </Accordion>
</AccordionGroup>

تستخدم تثبيتات ClawHub محدد موقع صريحًا `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن ClawHub أيضًا لمواصفات Plugin المجردة الآمنة لـ npm. ولا ينتقل إلى npm إلا إذا لم يكن لدى ClawHub تلك الحزمة أو ذلك الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

استخدم `npm:` لفرض الحل عبر npm فقط، مثلًا عندما يتعذر الوصول إلى ClawHub أو عندما تعلم أن الحزمة موجودة على npm فقط:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

ينزّل OpenClaw أرشيف الحزمة من ClawHub، ويتحقق من توافق Plugin API المعلن / الحد الأدنى لتوافق Gateway، ثم يثبته عبر مسار الأرشيف المعتاد. تحتفظ التثبيتات المسجلة ببيانات تعريف مصدر ClawHub لاستخدامها في التحديثات لاحقًا.
تحتفظ تثبيتات ClawHub غير محددة الإصدار بمواصفة مسجلة غير محددة الإصدار حتى يتمكن `openclaw plugins update` من متابعة إصدارات ClawHub الأحدث؛ وتظل محددات الإصدار أو الوسم الصريحة مثل `clawhub:pkg@1.2.3` و`clawhub:pkg@beta` مثبتة على ذلك المحدد.

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
  <Tab title="مصادر السوق">
    - اسم سوق معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر سوق محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git

  </Tab>
  <Tab title="قواعد السوق البعيد">
    بالنسبة إلى الأسواق البعيدة المحمّلة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع السوق المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S)، والمسارات المطلقة، وgit، وGitHub، ومصادر Plugin الأخرى غير المسارية من البيانات البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins أصلية لـ OpenClaw (`openclaw.plugin.json`)
- حِزم متوافقة مع Codex (`.codex-plugin/plugin.json`)
- حِزم متوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّنات Claude الافتراضي)
- حِزم متوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحِزم المتوافقة في جذر Plugin المعتاد وتشارك في تدفق القائمة/المعلومات/التمكين/التعطيل نفسه. حاليًا، تُدعَم bundle skills، وcommand-skills الخاصة بـ Claude، وافتراضيات `settings.json` في Claude، وافتراضيات `.lsp.json` / `lspServers` المعلنة في البيان لدى Claude، وcommand-skills الخاصة بـ Cursor، وأدلة الخطّافات المتوافقة مع Codex؛ أما إمكانات الحِزم المكتشفة الأخرى فتُعرض في التشخيصات/المعلومات لكنها لم تُوصّل بعد إلى التنفيذ وقت التشغيل.
</Note>

### القائمة

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  اعرض Plugins المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  بدّل من عرض الجدول إلى أسطر تفاصيل لكل Plugin تتضمن بيانات تعريف المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  مخزون قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل.
</ParamField>

<Note>
يقرأ `plugins list` سجل Plugin المحلي المحفوظ أولاً، مع بديل مشتق من البيان فقط عند فقدان السجل أو عدم صلاحيته. يفيد ذلك في التحقق مما إذا كان Plugin مثبتاً ومفعلاً ومرئياً لتخطيط بدء التشغيل البارد، لكنه ليس فحصاً حياً لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير كود Plugin أو التفعيل أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway الذي يخدم القناة قبل توقع تشغيل كود `register(api)` أو الخطافات الجديدة. بالنسبة إلى عمليات النشر البعيدة/الحاويات، تحقق من أنك تعيد تشغيل عملية `openclaw gateway run` الفرعية الفعلية، وليس عملية تغليف فقط.
</Note>

لعمل Plugin المضمّن داخل صورة Docker معبأة، اربط دليل مصدر Plugin
فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw طبقة المصدر المثبتة هذه
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ فقط
فيبقى خاملاً، بحيث تظل التثبيتات المعبأة العادية تستخدم dist المترجم.

لتصحيح أخطاء خطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --json` الخطافات المسجلة والتشخيصات من جولة فحص محمّلة كوحدة.
- يؤكد `openclaw gateway status --deep --require-rpc` أن Gateway قابل للوصول، وتلميحات الخدمة/العملية، ومسار الإعدادات، وصحة RPC.
- تتطلب خطافات المحادثة غير المضمّنة (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) تعيين `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيف إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يُدعم `--force` مع `--link` لأن التثبيتات المرتبطة تعيد استخدام مسار المصدر بدلاً من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` في تثبيتات npm لحفظ المواصفة الدقيقة المحلولة (`name@version`) في فهرس Plugin المُدار مع إبقاء السلوك الافتراضي غير مثبت.
</Note>

### فهرس Plugin

بيانات تعريف تثبيت Plugin هي حالة مُدارة آلياً، وليست إعدادات مستخدم. تكتبها عمليات التثبيت والتحديث إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. خريطة `installRecords` في المستوى الأعلى هي المصدر الدائم لبيانات تعريف التثبيت، بما في ذلك سجلات بيانات بيان Plugin المعطوبة أو المفقودة. مصفوفة `plugins` هي ذاكرة التخزين المؤقت لسجل التشغيل البارد المشتقة من البيان. يتضمن الملف تحذيراً بعدم التحرير، ويستخدمه `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugin البارد.

عندما يرى OpenClaw سجلات `plugins.installs` قديمة مشحونة في الإعدادات، ينقلها إلى فهرس Plugin ويزيل مفتاح الإعدادات؛ وإذا فشلت أي من عمليتي الكتابة، تُحتفظ سجلات الإعدادات حتى لا تُفقد بيانات تعريف التثبيت.

### تبعيات وقت التشغيل

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

يفحص `plugins deps` مرحلة تبعيات وقت التشغيل المعبأة لملحقات Plugin المضمّنة المملوكة لـ OpenClaw والمحددة عبر إعدادات Plugin أو القنوات المفعلة/المهيأة أو موفري النماذج المهيئين أو افتراضيات البيان المضمّن. ليس هذا هو مسار التثبيت/التحديث لملحقات Plugin التابعة لجهات خارجية من npm أو ClawHub.

استخدم `--repair` عندما يبلّغ تثبيت معبأ عن تبعيات وقت تشغيل مضمّنة مفقودة أثناء بدء Gateway أو `plugins doctor`. يثبت الإصلاح تبعيات Plugin المضمّنة المفعلة والمفقودة فقط مع تعطيل سكربتات دورة الحياة. استخدم `--prune` لإزالة جذور تبعيات وقت التشغيل الخارجية غير المعروفة والقديمة التي تركتها تخطيطات معبأة أقدم.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin المحفوظ، وإدخالات قائمة السماح/الحظر لـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. ما لم يتم تعيين `--keep-files`، يزيل إلغاء التثبيت أيضاً دليل التثبيت المُدار المتعقب عندما يكون داخل جذر امتدادات Plugin في OpenClaw. بالنسبة إلى ملحقات Plugin الخاصة بالذاكرة النشطة، تُعاد فتحة الذاكرة إلى `memory-core`.

<Note>
يُدعم `--keep-config` كاسم بديل مهمل لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على تثبيتات Plugin المتعقبة في فهرس Plugin المُدار وتثبيتات حزم الخطافات المتعقبة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرف Plugin مقابل مواصفة npm">
    عندما تمرر معرف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك Plugin. وهذا يعني أن وسوم dist المخزنة سابقاً مثل `@beta` والإصدارات الدقيقة المثبتة يستمر استخدامها في عمليات `update <id>` اللاحقة.

    بالنسبة إلى تثبيتات npm، يمكنك أيضاً تمرير مواصفة حزمة npm صريحة مع وسم dist أو إصدار دقيق. يحل OpenClaw اسم الحزمة ذلك مرة أخرى إلى سجل Plugin المتعقب، ويحدّث ذلك Plugin المثبت، ويسجل مواصفة npm الجديدة للتحديثات المستقبلية المستندة إلى المعرف.

    تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضاً مرة أخرى إلى سجل Plugin المتعقب. استخدم ذلك عندما يكون Plugin مثبتاً على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانحراف السلامة">
    قبل تحديث npm حي، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات تعريف سجل npm. إذا كان الإصدار المثبت وهوية الأثر المسجلة يطابقان الهدف المحلول بالفعل، يتم تخطي التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    عندما توجد بصمة سلامة مخزنة وتتغير بصمة الأثر الذي تم جلبه، يتعامل OpenClaw مع ذلك على أنه انحراف في أثر npm. يطبع أمر `openclaw plugins update` التفاعلي البصمات المتوقعة والفعلية ويطلب التأكيد قبل المتابعة. تفشل أدوات التحديث غير التفاعلية بإغلاق آمن ما لم يزودها المستدعي بسياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضاً في `plugins update` كتجاوز طارئ للنتائج الإيجابية الخاطئة في فحص الكود الخطر المدمج أثناء تحديثات Plugin. لا يزال لا يتجاوز حظر سياسة `before_install` الخاصة بـ Plugin أو الحظر الناتج عن فشل الفحص، وينطبق فقط على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

استبطان عميق لـ Plugin واحد. يعرض الهوية، وحالة التحميل، والمصدر، والقدرات المسجلة، والخطافات، والأدوات، والأوامر، والخدمات، وطرق Gateway، ومسارات HTTP، ورايات السياسة، والتشخيصات، وبيانات تعريف التثبيت، وقدرات الحزمة، وأي دعم مكتشف لخادم MCP أو LSP.

يُصنف كل Plugin بحسب ما يسجله فعلياً في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثلاً Plugin لموفر فقط)
- **hybrid-capability** — أنواع قدرات متعددة (مثلاً نص + كلام + صور)
- **hook-only** — خطافات فقط، من دون قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات لكن من دون قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) للمزيد عن نموذج القدرات.

<Note>
تخرج الراية `--json` تقريراً قابلاً للقراءة آلياً ومناسباً للسكربتات والتدقيق. يعرض `inspect --all` جدولاً على مستوى المجموعة يتضمن الشكل، وأنواع القدرات، وإشعارات التوافق، وقدرات الحزمة، وأعمدة ملخص الخطافات. `info` اسم بديل لـ `inspect`.
</Note>

### الطبيب

```bash
openclaw plugins doctor
```

يبلّغ `doctor` عن أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. عندما يكون كل شيء سليماً يطبع `No plugin issues detected.`

لإخفاقات شكل الوحدة مثل فقدان تصديرات `register`/`activate`، أعد التشغيل مع `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل التصدير في مخرجات التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugin المحلي هو نموذج القراءة الباردة المحفوظ في OpenClaw لهوية Plugin وتفعيله وبيانات تعريف المصدر وملكية المساهمات. يمكن لبدء التشغيل العادي، والبحث عن مالك الموفر، وتصنيف إعداد القناة، ومخزون Plugin قراءته من دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل المحفوظ موجوداً أو حديثاً أو قديماً. استخدم `--refresh` لإعادة بنائه من فهرس Plugin المحفوظ وسياسة الإعدادات وبيانات تعريف البيان/الحزمة. هذا مسار إصلاح، وليس مسار تفعيل وقت تشغيل.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق مهمل للطوارئ عند فشل قراءة السجل. فضّل `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالبديل عبر متغير البيئة مخصص فقط لاستعادة بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.
</Warning>

### السوق

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

تقبل قائمة السوق مسار سوق محلياً، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. يطبع `--json` تسمية المصدر المحلولة مع بيان السوق المحلل وإدخالات Plugin.

## ذو صلة

- [بناء ملحقات Plugin](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [ملحقات Plugin المجتمعية](/ar/plugins/community)

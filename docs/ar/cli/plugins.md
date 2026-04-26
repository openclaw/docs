---
read_when:
    - أنت تريد تثبيت Plugins الخاصة بـ Gateway أو الحزم المتوافقة أو إدارتها
    - أنت تريد تصحيح أخطاء فشل تحميل Plugin
sidebarTitle: Plugins
summary: مرجع CLI لـ `openclaw plugins` (عرض، تثبيت، Marketplace، إلغاء التثبيت، تفعيل/تعطيل، doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-26T11:26:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52b02c96859e1da1d7028bce375045ef9472d1f2e01086f1318e4f38e8d5bb7d
    source_path: cli/plugins.md
    workflow: 15
---

إدارة Plugins الخاصة بـ Gateway، وحزم الخطافات، والحزم المتوافقة.

<CardGroup cols={2}>
  <Card title="نظام Plugin" href="/ar/tools/plugin">
    دليل المستخدم النهائي لتثبيت Plugins وتفعيلها واستكشاف أخطائها وإصلاحها.
  </Card>
  <Card title="حزم Plugin" href="/ar/plugins/bundles">
    نموذج توافق الحزم.
  </Card>
  <Card title="بيان Plugin" href="/ar/plugins/manifest">
    حقول البيان ومخطط الإعداد.
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
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

<Note>
تأتي Plugins المضمنة مع OpenClaw. يكون بعضها مفعّلًا افتراضيًا (على سبيل المثال، موفرو النماذج المضمنون، وموفرو الصوت المضمنون، وPlugin المتصفح المضمّن)؛ بينما يتطلب البعض الآخر `plugins enable`.

يجب أن تتضمن Plugins الأصلية في OpenClaw الملف `openclaw.plugin.json` مع JSON Schema مضمن (`configSchema`، حتى لو كان فارغًا). أما الحزم المتوافقة فتستخدم بيانات الحزم الخاصة بها بدلًا من ذلك.

يعرض `plugins list` القيمة `Format: openclaw` أو `Format: bundle`. كما يعرض خرج list/info المفصل أيضًا النوع الفرعي للحزمة (`codex` أو `claude` أو `cursor`) بالإضافة إلى قدرات الحزمة المكتشفة.
</Note>

### التثبيت

```bash
openclaw plugins install <package>                      # ClawHub أولًا، ثم npm
openclaw plugins install clawhub:<package>              # ClawHub فقط
openclaw plugins install <package> --force              # الكتابة فوق التثبيت الحالي
openclaw plugins install <package> --pin                # تثبيت الإصدار
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # مسار محلي
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (صريح)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
يتم التحقق من أسماء الحزم المجردة مقابل ClawHub أولًا، ثم npm. تعامل مع عمليات تثبيت Plugin كما لو كنت تشغّل شيفرة. ويفضَّل استخدام الإصدارات المثبتة.
</Warning>

<AccordionGroup>
  <Accordion title="تضمينات الإعداد والاسترداد من الإعداد غير الصالح">
    إذا كان قسم `plugins` لديك مدعومًا بـ `$include` لملف واحد، فإن `plugins install/update/enable/disable/uninstall` تكتب إلى ذلك الملف المضمَّن مباشرة وتترك `openclaw.json` دون تعديل. أما تضمينات الجذر، ومصفوفات التضمين، والتضمينات التي تحتوي على تجاوزات شقيقة، فتفشل بإغلاق آمن بدلًا من تسطيحها. راجع [تضمينات الإعداد](/ar/gateway/configuration) لمعرفة الأشكال المدعومة.

    إذا كان الإعداد غير صالح، فإن `plugins install` يفشل عادةً بإغلاق آمن ويطلب منك تشغيل `openclaw doctor --fix` أولًا. والاستثناء الموثق الوحيد هو مسار استرداد ضيق لPlugin المضمّنة بالنسبة إلى Plugins التي تشترك صراحة في `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force وإعادة التثبيت مقابل التحديث">
    يعيد `--force` استخدام هدف التثبيت الحالي ويكتب فوق Plugin أو حزمة الخطافات المثبتة بالفعل في مكانها. استخدمه عندما تعيد عمدًا تثبيت المعرّف نفسه من مسار محلي جديد أو أرشيف أو حزمة ClawHub أو عنصر npm. أما للترقيات الروتينية لـ Plugin npm متعقبة بالفعل، ففضّل `openclaw plugins update <id-or-npm-spec>`.

    إذا شغّلت `plugins install` لمعرّف Plugin مثبّت بالفعل، فسيتوقف OpenClaw ويوجهك إلى `plugins update <id-or-npm-spec>` للترقية العادية، أو إلى `plugins install <package> --force` عندما تريد بالفعل الكتابة فوق التثبيت الحالي من مصدر مختلف.

  </Accordion>
  <Accordion title="نطاق --pin">
    ينطبق `--pin` على عمليات تثبيت npm فقط. ولا يكون مدعومًا مع `--marketplace`، لأن عمليات التثبيت من marketplace تحتفظ ببيانات مصدر marketplace بدلًا من مواصفة npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    يُعد `--dangerously-force-unsafe-install` خيار كسر الزجاج للحالات الإيجابية الكاذبة في الماسح المدمج للشيفرة الخطرة. فهو يسمح بمتابعة التثبيت حتى عندما يُبلغ الماسح المدمج عن نتائج `critical`، لكنه **لا** يتجاوز حظر السياسة في خطاف Plugin `before_install` و**لا** يتجاوز حالات فشل الفحص.

    تنطبق راية CLI هذه على تدفقات تثبيت/تحديث Plugin. أما عمليات تثبيت تبعيات Skills المدعومة من Gateway فتستخدم تجاوز الطلب المطابق `dangerouslyForceUnsafeInstall`، بينما يظل `openclaw skills install` تدفق تنزيل/تثبيت Skills منفصلًا من ClawHub.

  </Accordion>
  <Accordion title="حزم الخطافات ومواصفات npm">
    يمثّل `plugins install` أيضًا سطح التثبيت لحزم الخطافات التي تعرض `openclaw.hooks` في `package.json`. استخدم `openclaw hooks` لعرض الخطافات المصفّى وتفعيل كل خطاف على حدة، وليس لتثبيت الحزمة.

    تكون مواصفات npm **خاصة بالسجل فقط** (اسم الحزمة + **إصدار دقيق** اختياري أو **dist-tag**). ويتم رفض مواصفات Git/URL/file ونطاقات semver. وتعمل عمليات تثبيت التبعيات محليًا على مستوى المشروع باستخدام `--ignore-scripts` من أجل الأمان، حتى عندما تكون لدى shell لديك إعدادات تثبيت npm عامة.

    تظل المواصفات المجردة و`@latest` على المسار المستقر. وإذا حل npm أيًا منهما إلى إصدار prerelease، فسيتوقف OpenClaw ويطلب منك الاشتراك صراحة باستخدام علامة prerelease مثل `@beta`/`@rc` أو إصدار prerelease دقيق مثل `@1.2.3-beta.4`.

    إذا طابقت مواصفة تثبيت مجردة معرّف Plugin مضمّنة (مثل `diffs`)، فسيثبّت OpenClaw Plugin المضمّنة مباشرة. ولتثبيت حزمة npm بالاسم نفسه، استخدم مواصفة ذات نطاق صريحة (مثل `@scope/diffs`).

  </Accordion>
  <Accordion title="الأرشيفات">
    الأرشيفات المدعومة: `.zip` و`.tgz` و`.tar.gz` و`.tar`. يجب أن تحتوي أرشيفات Plugins الأصلية لـ OpenClaw على ملف `openclaw.plugin.json` صالح عند جذر Plugin المستخرجة؛ ويتم رفض الأرشيفات التي تحتوي فقط على `package.json` قبل أن يكتب OpenClaw سجلات التثبيت.

    كما أن عمليات التثبيت من Claude marketplace مدعومة أيضًا.

  </Accordion>
</AccordionGroup>

تستخدم عمليات التثبيت من ClawHub محددًا صريحًا من الشكل `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

يفضّل OpenClaw الآن أيضًا ClawHub لمواصفات Plugin المجردة الآمنة لـ npm. ولا يعود إلى npm إلا إذا لم يكن ClawHub يحتوي على تلك الحزمة أو ذلك الإصدار:

```bash
openclaw plugins install openclaw-codex-app-server
```

ينزّل OpenClaw أرشيف الحزمة من ClawHub، ويتحقق من توافق Plugin API المُعلن/الحد الأدنى المطلوب من Gateway، ثم يثبتها عبر مسار الأرشيف العادي. وتحتفظ عمليات التثبيت المسجلة ببيانات مصدر ClawHub الوصفية الخاصة بها من أجل التحديثات اللاحقة.

#### الاختصار الخاص بـ Marketplace

استخدم الاختصار `plugin@marketplace` عندما يكون اسم marketplace موجودًا في ذاكرة السجل المحلية المؤقتة لـ Claude في `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

استخدم `--marketplace` عندما تريد تمرير مصدر marketplace صراحة:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="مصادر Marketplace">
    - اسم marketplace معروف لدى Claude من `~/.claude/plugins/known_marketplaces.json`
    - جذر marketplace محلي أو مسار `marketplace.json`
    - اختصار مستودع GitHub مثل `owner/repo`
    - عنوان URL لمستودع GitHub مثل `https://github.com/owner/repo`
    - عنوان URL لـ git
  </Tab>
  <Tab title="قواعد Marketplace البعيدة">
    بالنسبة إلى marketplaces البعيدة المحملة من GitHub أو git، يجب أن تبقى إدخالات Plugin داخل مستودع marketplace المستنسخ. يقبل OpenClaw مصادر المسارات النسبية من ذلك المستودع ويرفض HTTP(S) والمسار المطلق وgit وGitHub وغيرها من مصادر Plugin غير المعتمدة على المسار من البيانات البعيدة.
  </Tab>
</Tabs>

بالنسبة إلى المسارات المحلية والأرشيفات، يكتشف OpenClaw تلقائيًا:

- Plugins الأصلية لـ OpenClaw (`openclaw.plugin.json`)
- الحزم المتوافقة مع Codex (`.codex-plugin/plugin.json`)
- الحزم المتوافقة مع Claude (`.claude-plugin/plugin.json` أو تخطيط مكوّن Claude الافتراضي)
- الحزم المتوافقة مع Cursor (`.cursor-plugin/plugin.json`)

<Note>
تُثبَّت الحزم المتوافقة في جذر Plugin العادي وتشارك في تدفق list/info/enable/disable نفسه. حاليًا، يتم دعم Skills الخاصة بالحزم، وClaude command-skills، والقيم الافتراضية لـ Claude `settings.json`، والقيم الافتراضية لـ Claude `.lsp.json` / `lspServers` المعلنة في البيان، وCursor command-skills، وأدلة خطافات Codex المتوافقة؛ أما قدرات الحزم المكتشفة الأخرى فتُعرض في diagnostics/info لكنها لم تُوصّل بعد بتنفيذ وقت التشغيل.
</Note>

### العرض

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  عرض Plugins المفعّلة فقط.
</ParamField>
<ParamField path="--verbose" type="boolean">
  التبديل من عرض الجدول إلى أسطر تفاصيل لكل Plugin مع بيانات المصدر/الأصل/الإصدار/التفعيل.
</ParamField>
<ParamField path="--json" type="boolean">
  جرد قابل للقراءة آليًا بالإضافة إلى تشخيصات السجل.
</ParamField>

<Note>
يقرأ `plugins list` أولًا سجل Plugins المحلي الثابت، مع آلية احتياطية مشتقة من البيان فقط عندما يكون السجل مفقودًا أو غير صالح. وهو مفيد للتحقق مما إذا كانت Plugin مثبتة ومفعّلة ومرئية لتخطيط بدء التشغيل البارد، لكنه ليس فحصًا حيًا لوقت التشغيل لعملية Gateway قيد التشغيل بالفعل. بعد تغيير شيفرة Plugin أو حالة التفعيل أو سياسة الخطافات أو `plugins.load.paths`، أعد تشغيل Gateway التي تخدم القناة قبل توقع تشغيل شيفرة `register(api)` الجديدة أو الخطافات. وبالنسبة إلى عمليات النشر البعيدة/ضمن الحاويات، تحقّق من أنك تعيد تشغيل العملية الفرعية الفعلية `openclaw gateway run`، وليس مجرد عملية غلاف.
</Note>

بالنسبة إلى العمل على Plugins المضمنة داخل صورة Docker معبأة، قم بربط-تركيب دليل
مصدر Plugin فوق مسار المصدر المعبأ المطابق، مثل
`/app/extensions/synology-chat`. سيكتشف OpenClaw تراكب المصدر المركّب هذا
قبل `/app/dist/extensions/synology-chat`؛ أما دليل المصدر المنسوخ فقط
فيظل غير فعّال بحيث تستمر عمليات التثبيت المعبأة العادية في استخدام dist المترجم.

لتصحيح أخطاء الخطافات وقت التشغيل:

- يعرض `openclaw plugins inspect <id> --json` الخطافات المسجلة والتشخيصات من تمريرة فحص محمّلة على مستوى الوحدة.
- يؤكد `openclaw gateway status --deep --require-rpc` Gateway القابلة للوصول، وتلميحات الخدمة/العملية، ومسار الإعداد، وسلامة RPC.
- تتطلب خطافات المحادثة غير المضمنة (`llm_input` و`llm_output` و`before_agent_finalize` و`agent_end`) القيمة `plugins.entries.<id>.hooks.allowConversationAccess=true`.

استخدم `--link` لتجنب نسخ دليل محلي (يضيفه إلى `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
لا يكون `--force` مدعومًا مع `--link` لأن عمليات التثبيت المرتبطة تعيد استخدام مسار المصدر بدلًا من النسخ فوق هدف تثبيت مُدار.

استخدم `--pin` مع عمليات تثبيت npm لحفظ المواصفة الدقيقة التي تم حلها (`name@version`) في فهرس Plugins المُدارة مع إبقاء السلوك الافتراضي غير مثبّت.
</Note>

### فهرس Plugin

بيانات التثبيت الوصفية لـ Plugin هي حالة مُدارة آليًا، وليست إعدادات مستخدم. تكتب عمليات التثبيت والتحديث هذه البيانات إلى `plugins/installs.json` ضمن دليل حالة OpenClaw النشط. وتُعد الخريطة ذات المستوى الأعلى `installRecords` المصدر الدائم لبيانات التثبيت الوصفية، بما في ذلك السجلات الخاصة ببيانات Plugin المعطلة أو المفقودة. أما المصفوفة `plugins` فهي ذاكرة السجل البارد المشتقة من البيان. يتضمن الملف تحذيرًا بعدم التعديل، ويُستخدم بواسطة `openclaw plugins update`، وإلغاء التثبيت، والتشخيصات، وسجل Plugins البارد.

عندما يرى OpenClaw سجلات `plugins.installs` القديمة المشحونة ضمن الإعدادات، فإنه ينقلها إلى فهرس Plugin ويزيل مفتاح الإعداد؛ وإذا فشلت أي من عمليتي الكتابة، فسيتم الاحتفاظ بسجلات الإعدادات حتى لا تضيع بيانات التثبيت الوصفية.

### إلغاء التثبيت

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

يزيل `uninstall` سجلات Plugin من `plugins.entries`، وفهرس Plugin الثابت، وإدخالات قوائم السماح/المنع الخاصة بـ Plugin، وإدخالات `plugins.load.paths` المرتبطة عند الاقتضاء. وما لم يتم تعيين `--keep-files`، فإن إلغاء التثبيت يزيل أيضًا دليل التثبيت المُدار المتعقَّب عندما يكون داخل جذر امتدادات Plugin الخاص بـ OpenClaw. وبالنسبة إلى Plugins الخاصة بالذاكرة النشطة، تتم إعادة تعيين خانة الذاكرة إلى `memory-core`.

<Note>
`--keep-config` مدعوم كاسم مستعار قديم لـ `--keep-files`.
</Note>

### التحديث

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

تنطبق التحديثات على عمليات تثبيت Plugins المتعقبة في فهرس Plugins المُدار وعلى عمليات تثبيت حزم الخطافات المتعقبة في `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="حل معرّف Plugin مقابل مواصفة npm">
    عندما تمرر معرّف Plugin، يعيد OpenClaw استخدام مواصفة التثبيت المسجلة لذلك الـ Plugin. وهذا يعني أن dist-tags المخزنة مسبقًا مثل `@beta` والإصدارات الدقيقة المثبتة تستمر في الاستخدام في عمليات `update <id>` اللاحقة.

    وبالنسبة إلى عمليات تثبيت npm، يمكنك أيضًا تمرير مواصفة حزمة npm صريحة تحتوي على dist-tag أو إصدار دقيق. ويحل OpenClaw اسم الحزمة هذا مرة أخرى إلى سجل Plugin المتعقب، ويحدّث Plugin المثبت، ويسجل مواصفة npm الجديدة من أجل التحديثات المستقبلية المعتمدة على المعرّف.

    كما أن تمرير اسم حزمة npm من دون إصدار أو وسم يحل أيضًا مرة أخرى إلى سجل Plugin المتعقب. استخدم هذا عندما يكون Plugin مثبتًا على إصدار دقيق وتريد إعادته إلى خط الإصدار الافتراضي في السجل.

  </Accordion>
  <Accordion title="فحوصات الإصدار وانجراف التكامل">
    قبل تحديث npm مباشر، يتحقق OpenClaw من إصدار الحزمة المثبتة مقابل بيانات سجل npm الوصفية. وإذا كان الإصدار المثبت وهوية العنصر المسجلة تتطابقان بالفعل مع الهدف المحلول، فسيتم تخطي التحديث من دون تنزيل أو إعادة تثبيت أو إعادة كتابة `openclaw.json`.

    وعندما تكون قيمة hash الخاصة بالتكامل المخزن موجودة ويتغير hash الخاص بالعنصر الذي تم جلبه، يتعامل OpenClaw مع ذلك على أنه انجراف في عنصر npm. ويطبع الأمر التفاعلي `openclaw plugins update` القيمتين المتوقعة والفعلية لـ hash ويطلب التأكيد قبل المتابعة. أما مساعدات التحديث غير التفاعلية فتفشل بإغلاق آمن ما لم يوفّر المستدعي سياسة متابعة صريحة.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install عند التحديث">
    يتوفر `--dangerously-force-unsafe-install` أيضًا مع `plugins update` كتجاوز لكسر الزجاج للحالات الإيجابية الكاذبة في فحص الشيفرة الخطرة المدمج أثناء تحديثات Plugin. لكنه لا يزال لا يتجاوز حظر السياسة في خطاف Plugin `before_install` أو حظر فشل الفحص، كما أنه ينطبق فقط على تحديثات Plugin، وليس تحديثات حزم الخطافات.
  </Accordion>
</AccordionGroup>

### الفحص

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

استبطان عميق لـ Plugin واحد. يعرض الهوية، وحالة التحميل، والمصدر، والقدرات المسجلة، والخطافات، والأدوات، والأوامر، والخدمات، وطرائق Gateway، ومسارات HTTP، وأعلام السياسة، والتشخيصات، وبيانات التثبيت الوصفية، وقدرات الحزمة، وأي دعم مكتشف لخوادم MCP أو LSP.

يتم تصنيف كل Plugin بحسب ما يسجله فعليًا في وقت التشغيل:

- **plain-capability** — نوع قدرة واحد (مثل Plugin موفر فقط)
- **hybrid-capability** — عدة أنواع من القدرات (مثل النص + الصوت + الصور)
- **hook-only** — خطافات فقط، بلا قدرات أو أسطح
- **non-capability** — أدوات/أوامر/خدمات ولكن بلا قدرات

راجع [أشكال Plugin](/ar/plugins/architecture#plugin-shapes) لمزيد من المعلومات عن نموذج القدرات.

<Note>
تنتج العلامة `--json` تقريرًا قابلًا للقراءة آليًا ومناسبًا للبرمجة النصية والتدقيق. ويعرض `inspect --all` جدولًا على مستوى الأسطول يتضمن الأعمدة shape وcapability kinds وإشعارات التوافق وقدرات الحزمة وملخص الخطافات. و`info` هو اسم مستعار لـ `inspect`.
</Note>

### doctor

```bash
openclaw plugins doctor
```

يعرض `doctor` أخطاء تحميل Plugin، وتشخيصات البيان/الاكتشاف، وإشعارات التوافق. وعندما يكون كل شيء سليمًا، يطبع `No plugin issues detected.`

وبالنسبة إلى حالات فشل شكل الوحدة مثل غياب الصادرات `register`/`activate`، أعد التشغيل باستخدام `OPENCLAW_PLUGIN_LOAD_DEBUG=1` لتضمين ملخص مضغوط لشكل الصادرات ضمن خرج التشخيص.

### السجل

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

سجل Plugins المحلي هو نموذج القراءة البارد الثابت في OpenClaw لهوية Plugins المثبتة، وحالة تفعيلها، وبيانات مصدرها الوصفية، وملكية المساهمات. ويمكن لبدء التشغيل العادي، والبحث عن مالك الموفر، وتصنيف إعداد القناة، وجرد Plugin قراءته من دون استيراد وحدات وقت تشغيل Plugin.

استخدم `plugins registry` لفحص ما إذا كان السجل الثابت موجودًا أو حديثًا أو قديمًا. واستخدم `--refresh` لإعادة بنائه من فهرس Plugins الثابت، وسياسة الإعداد، وبيانات البيان/الحزمة الوصفية. هذا مسار إصلاح، وليس مسار تفعيل وقت التشغيل.

<Warning>
يُعد `OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` مفتاح توافق قديمًا لكسر الزجاج في حالات فشل قراءة السجل. ويفضَّل استخدام `plugins registry --refresh` أو `openclaw doctor --fix`؛ فالاحتياط البيئي مخصص فقط لاسترداد بدء التشغيل في الحالات الطارئة أثناء طرح الترحيل.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

يقبل عرض Marketplace مسار Marketplace محليًا، أو مسار `marketplace.json`، أو اختصار GitHub مثل `owner/repo`، أو عنوان URL لمستودع GitHub، أو عنوان URL لـ git. ويطبع `--json` تسمية المصدر التي تم حلها بالإضافة إلى بيان Marketplace المحلل وإدخالات Plugin.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [مرجع CLI](/ar/cli)
- [Plugins المجتمع](/ar/plugins/community)

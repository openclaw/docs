---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw في وضع Codex ميزة Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge وMCP المباشر لـ cua-driver
    - أنت تفاضل بين استخدام الكمبيوتر في Codex وإعداد MCP مباشر باستخدام cua-driver
    - أنت تهيئ computerUse لـ Plugin Codex المضمّن
    - أنت تستكشف أخطاء /codex computer-use status أو install وإصلاحها
summary: إعداد Codex Computer Use لوكلاء OpenClaw في وضع Codex
title: استخدام الكمبيوتر في Codex
x-i18n:
    generated_at: "2026-04-30T08:13:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e3551b9005cdc8084d159c107f9b5039a4b4624847b8cc6e5bcb620510fd54f
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

استخدام الكمبيوتر هو Plugin MCP أصلي في Codex للتحكم المحلي بسطح المكتب. لا يقوم OpenClaw
بتضمين تطبيق سطح المكتب، أو تنفيذ إجراءات سطح المكتب بنفسه، أو تجاوز
أذونات Codex. يقوم Plugin `codex` المضمّن فقط بتجهيز خادم تطبيقات Codex:
إذ يفعّل دعم Plugins في Codex، ويعثر على Plugin Codex Computer Use
المكوّن أو يثبّته، ويتحقق من توفر خادم MCP `computer-use`، ثم
يترك Codex يمتلك استدعاءات أدوات MCP الأصلية أثناء دورات وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل حزمة Codex الأصلية. لإعداد
بيئة التشغيل نفسها، راجع [حزمة Codex](/ar/plugins/codex-harness).

## OpenClaw.app وPeekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن Codex Computer Use. يمكن لتطبيق
macOS استضافة مقبس PeekabooBridge بحيث يستطيع CLI `peekaboo` إعادة استخدام
منح Accessibility وScreen Recording المحلية الخاصة بالتطبيق لأدوات الأتمتة الخاصة بـPeekaboo.
لا يثبّت ذلك الجسر Codex Computer Use أو يمرره عبر وكيل، ولا
يستدعي Codex Computer Use عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app
مضيفًا واعيًا بالأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما يجب أن
يتوفر لدى وكيل OpenClaw في وضع Codex Plugin MCP `computer-use` الأصلي الخاص بـCodex
قبل بدء الدور.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. فهو لا يثبّت أو يمرر عبر وكيل
خادم MCP `computer-use` الخاص بـCodex، وليس خلفية للتحكم بسطح المكتب.
بدلًا من ذلك، يتصل تطبيق iOS بصفته عقدة OpenClaw ويكشف قدرات
الجوال عبر أوامر العقدة مثل `canvas.*` و`camera.*` و`screen.*`
و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد من وكيل قيادة عقدة iPhone عبر
Gateway. استخدم هذه الصفحة عندما يجب أن يتحكم وكيل في وضع Codex بسطح مكتب
macOS المحلي عبر Plugin Computer Use الأصلي الخاص بـCodex.

## MCP مباشر عبر cua-driver

Codex Computer Use ليس الطريقة الوحيدة لكشف التحكم بسطح المكتب. إذا كنت تريد
أن تستدعي بيئات التشغيل المُدارة من OpenClaw برنامج تشغيل TryCua مباشرةً، فاستخدم خادم
`cua-driver mcp` من المنبع عبر سجل MCP الخاص بـOpenClaw بدلًا من مسار
السوق المخصص لـCodex.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو تسجّل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ ذلك المسار على سطح أدوات MCP من المنبع كما هو، بما في ذلك مخططات برنامج التشغيل
واستجابات MCP المهيكلة. استخدمه عندما تريد إتاحة برنامج تشغيل CUA
كخادم MCP عادي في OpenClaw. استخدم إعداد Codex Computer Use في
هذه الصفحة عندما يجب أن يمتلك خادم تطبيقات Codex تثبيت Plugin وإعادات تحميل MCP
واستدعاءات الأدوات الأصلية داخل دورات وضع Codex.

برنامج تشغيل CUA مخصص لـmacOS ولا يزال يتطلب أذونات macOS المحلية
التي يطلبها تطبيقه، مثل Accessibility وScreen Recording. لا يقوم OpenClaw
بتثبيت `cua-driver`، أو منح تلك الأذونات، أو تجاوز نموذج الأمان الخاص ببرنامج التشغيل
من المنبع.

## إعداد سريع

عيّن `plugins.entries.codex.config.computerUse` عندما يجب أن تتوفر
Computer Use لدورات وضع Codex قبل بدء سلسلة محادثة:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

مع هذا التكوين، يتحقق OpenClaw من خادم تطبيقات Codex قبل كل دورة في وضع Codex.
إذا كانت Computer Use مفقودة ولكن خادم تطبيقات Codex اكتشف بالفعل
سوقًا قابلًا للتثبيت، يطلب OpenClaw من خادم تطبيقات Codex تثبيت
Plugin أو إعادة تفعيله وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك
سوق مطابق مسجل وتوجد حزمة تطبيق Codex القياسية، يحاول OpenClaw أيضًا
تسجيل سوق Codex المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن
يفشل. إذا ظل الإعداد غير قادر على جعل خادم MCP متاحًا، تفشل الدورة
قبل بدء سلسلة المحادثة.

تحتفظ الجلسات الموجودة ببيئة تشغيلها وربط سلسلة Codex الخاص بها. بعد تغيير
`agentRuntime` أو تكوين Computer Use، استخدم `/new` أو `/reset` في المحادثة
المتأثرة قبل الاختبار.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح محادثة يتوفر فيه سطح أوامر Plugin
`codex`. هذه أوامر محادثة/بيئة تشغيل في OpenClaw،
وليست أوامر CLI فرعية من نوع `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبّت Plugins، ولا
يفعّل دعم Plugins في Codex.

`install` يفعّل دعم Plugins في خادم تطبيقات Codex، ويضيف اختياريًا
مصدر سوق مكوّنًا، ويثبّت أو يعيد تفعيل Plugin المكوّن عبر خادم تطبيقات Codex،
ويعيد تحميل خوادم MCP، ويتحقق من أن خادم MCP يكشف أدوات.

## خيارات السوق

يستخدم OpenClaw واجهة API نفسها لخادم التطبيقات التي يكشفها Codex نفسه. تحدد
حقول السوق أين يجب أن يجد Codex `computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| لا يوجد حقل سوق | تريد أن يستخدم خادم تطبيقات Codex الأسواق التي يعرفها بالفعل. | نعم، عندما يعيد خادم التطبيقات سوقًا محليًا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يستطيع خادم التطبيقات إضافته.         | نعم، لأمر `/codex computer-use install` الصريح.         |
| `marketplacePath`    | تعرف بالفعل مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدور.   |
| `marketplaceName`    | تريد اختيار سوق واحد مسجل بالفعل بالاسم.  | نعم فقط عندما يكون للسوق المحدد مسار محلي. |

قد تحتاج بيوت Codex الجديدة إلى لحظة قصيرة لبذر أسواقها الرسمية.
أثناء التثبيت، يستطلع OpenClaw `plugin/list` لمدة تصل إلى
`marketplaceDiscoveryTimeoutMs` ميلي ثانية. القيمة الافتراضية هي 60 ثانية.

إذا احتوت عدة أسواق معروفة على Computer Use، يفضّل OpenClaw
`openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة
غير المعروفة بشكل مغلق وتطلب منك تعيين `marketplaceName` أو `marketplacePath`.

## سوق macOS المضمّن

تتضمن إصدارات سطح مكتب Codex الحديثة Computer Use هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما تكون `computerUse.autoInstall` مضبوطة على true ولا يكون أي سوق يحتوي على
`computer-use` مسجلًا، يحاول OpenClaw إضافة جذر السوق القياسي المضمّن
تلقائيًا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضًا تسجيله صراحةً من الصدفة باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسار تطبيق Codex غير قياسي، فعيّن `computerUse.marketplacePath` إلى
مسار ملف سوق محلي أو شغّل `/codex computer-use install --source
<marketplace-source>` مرة واحدة.

## حد الكتالوج البعيد

يمكن لخادم تطبيقات Codex سرد وقراءة إدخالات الكتالوج البعيدة فقط، لكنه لا
يدعم حاليًا `plugin/install` عن بُعد. هذا يعني أن `marketplaceName` يمكنه
اختيار سوق بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل
لا تزال تحتاج إلى سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا قالت الحالة إن Plugin متاح في سوق Codex بعيد لكن التثبيت البعيد
غير مدعوم، فشغّل التثبيت بمصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع التكوين

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يتطلب Computer Use. الافتراضي true عندما يتم تعيين حقل Computer Use آخر. |
| `autoInstall`                   | false          | يثبّت أو يعيد التفعيل من الأسواق المكتشفة بالفعل عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدة انتظار التثبيت لاكتشاف سوق خادم تطبيقات Codex.             |
| `marketplaceSource`             | غير معين          | سلسلة المصدر الممررة إلى `marketplace/add` في خادم تطبيقات Codex.                    |
| `marketplacePath`               | غير معين          | مسار ملف سوق Codex المحلي الذي يحتوي على Plugin.                       |
| `marketplaceName`               | غير معين          | اسم سوق Codex المسجل المراد اختياره.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin في سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي يكشفه Plugin المثبت.                               |

يرفض التثبيت التلقائي عند بدء الدور عمدًا قيم `marketplaceSource` المكوّنة.
إضافة مصدر جديد عملية إعداد صريحة، لذا استخدم
`/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم دع
`autoInstall` يتولى عمليات إعادة التفعيل المستقبلية من الأسواق المحلية المكتشفة.
يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مكوّن، لأن ذلك
هو بالفعل مسار محلي على المضيف.

## ما يتحقق منه OpenClaw

يبلغ OpenClaw عن سبب إعداد مستقر داخليًا وينسّق الحالة المواجهة للمستخدم
للمحادثة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | عيّن `enabled` أو حقل Computer Use آخر.  |
| `marketplace_missing`        | لم يتوفر أي سوق مطابق.                 | كوّن المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبت.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبت لكنه معطّل في تكوين Codex.      | شغّل التثبيت لإعادة تفعيله.                  |
| `remote_install_unsupported` | السوق المحدد بعيد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.  | تحقق من Codex Computer Use وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ دورة وضع Codex.                    |
| `check_failed`               | فشل طلب إلى خادم تطبيقات Codex أثناء فحص الحالة. | تحقق من اتصال خادم التطبيقات والسجلات.       |
| `auto_install_blocked`       | إعداد بدء الدور سيحتاج إلى إضافة مصدر جديد.       | شغّل التثبيت الصريح أولًا.                   |

يتضمن مخرج المحادثة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات
عند توفرها، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

Computer Use مخصص لـmacOS. قد يحتاج خادم MCP المملوك لـCodex إلى أذونات نظام تشغيل
محلية قبل أن يتمكن من فحص التطبيقات أو التحكم بها. إذا قال OpenClaw إن Computer Use
مثبت لكن خادم MCP غير متاح، فتحقق أولًا من إعداد Computer Use من جهة Codex:

- يعمل Codex app-server على المضيف نفسه حيث يجب أن يحدث التحكم بسطح المكتب.
- تم تمكين Plugin Computer Use في إعدادات Codex.
- يظهر خادم MCP `computer-use` في حالة MCP الخاصة بـ Codex app-server.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الذي يتم التحكم به.

يفشل OpenClaw عمدًا بشكل مغلق عندما تكون `computerUse.enabled` مساوية لـ true. يجب ألا تستمر دورة Codex-mode بصمت من دون أدوات سطح المكتب الأصلية التي تطلبتها الإعدادات.

## استكشاف الأخطاء وإصلاحها

**تشير الحالة إلى أنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تشير الحالة إلى أنه مثبت لكنه معطل.** شغّل `/codex computer-use install` مرة أخرى. يكتب تثبيت Codex app-server إعدادات Plugin مرة أخرى على أنها مفعّلة.

**تشير الحالة إلى أن التثبيت البعيد غير مدعوم.** استخدم مصدرًا أو مسارًا محليًا للسوق. يمكن فحص إدخالات الفهرس البعيدة فقط، لكن لا يمكن تثبيتها عبر واجهة API الحالية لـ app-server.

**تشير الحالة إلى أن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة حتى تُعاد تحميل خوادم MCP. إذا ظل غير متاح، فأصلح تطبيق Codex Computer Use أو حالة MCP الخاصة بـ Codex app-server أو أذونات macOS.

**تنتهي مهلة الحالة أو فحص على `computer-use.list_apps`.** إن Plugin وخادم MCP موجودان، لكن جسر Computer Use المحلي لم يرد. أغلق Codex Computer Use أو أعد تشغيله، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في جلسة OpenClaw جديدة.

**تقول أداة Computer Use: `Native hook relay unavailable`.** تعذر على خطاف الأداة الأصلي في Codex الوصول إلى ترحيل OpenClaw نشط عبر الجسر المحلي أو بديل Gateway. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا استمر حدوث ذلك، فأعد تشغيل Gateway حتى تُسقط خيوط app-server القديمة وتسجيلات الخطافات، ثم أعد المحاولة.

**يرفض التثبيت التلقائي عند بدء الدورة مصدرًا.** هذا مقصود. أضف المصدر أولًا باستخدام `/codex computer-use install --source <marketplace-source>` بشكل صريح، ثم يمكن للتثبيت التلقائي عند بدء الدورات المستقبلية استخدام السوق المحلي المكتشف.

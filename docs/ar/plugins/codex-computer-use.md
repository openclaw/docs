---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw بوضع Codex ميزة Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge وMCP المباشر لـ cua-driver
    - أنت تفاضل بين Codex Computer Use وإعداد مباشر لـ cua-driver MCP
    - أنت تقوم بتكوين computerUse لـ Plugin Codex المضمّن
    - أنت تستكشف أخطاء حالة أو تثبيت `/codex computer-use` وتصلحها
summary: إعداد استخدام الكمبيوتر في Codex لوكلاء OpenClaw في وضع Codex
title: استخدام الحاسوب في Codex
x-i18n:
    generated_at: "2026-05-06T08:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

يُعد استخدام الكمبيوتر Plugin MCP أصليًا في Codex للتحكم المحلي في سطح المكتب. لا يضمّن OpenClaw تطبيق سطح المكتب، ولا ينفّذ إجراءات سطح المكتب بنفسه، ولا يتجاوز أذونات Codex. يقتصر Plugin `codex` المضمّن على تجهيز خادم تطبيقات Codex: إذ يفعّل دعم Plugin في Codex، ويعثر على Plugin استخدام الكمبيوتر المكوّن في Codex أو يثبّته، ويتحقق من توفر خادم MCP `computer-use`، ثم يترك لـ Codex امتلاك استدعاءات أدوات MCP الأصلية أثناء أدوار نمط Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل مسخّر Codex الأصلي. لإعداد وقت التشغيل نفسه، راجع [مسخّر Codex](/ar/plugins/codex-harness).

## OpenClaw.app وPeekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن استخدام الكمبيوتر في Codex. يمكن لتطبيق macOS استضافة مقبس PeekabooBridge بحيث يمكن لـ CLI `peekaboo` إعادة استخدام أذونات التطبيق المحلية لإمكانية الوصول وتسجيل الشاشة لأدوات الأتمتة الخاصة بـ Peekaboo. لا يثبّت هذا الجسر استخدام الكمبيوتر في Codex ولا يعمل وسيطًا له، ولا يستدعي استخدام الكمبيوتر في Codex عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app مضيفًا واعيًا بالأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما ينبغي لوكيل OpenClaw في نمط Codex أن تتوفر لديه Plugin MCP `computer-use` الأصلية الخاصة بـ Codex قبل بدء الدور.

## تطبيق iOS

تطبيق iOS منفصل عن استخدام الكمبيوتر في Codex. فهو لا يثبّت خادم MCP `computer-use` الخاص بـ Codex ولا يعمل وسيطًا له، وليس خلفية للتحكم في سطح المكتب. بدلًا من ذلك، يتصل تطبيق iOS كعقدة OpenClaw ويعرّض قدرات الجوال من خلال أوامر العقدة مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد من وكيل قيادة عقدة iPhone عبر Gateway. استخدم هذه الصفحة عندما ينبغي لوكيل في نمط Codex التحكم في سطح مكتب macOS المحلي عبر Plugin استخدام الكمبيوتر الأصلية الخاصة بـ Codex.

## MCP مباشر لـ cua-driver

استخدام الكمبيوتر في Codex ليس الطريقة الوحيدة لعرض التحكم في سطح المكتب. إذا كنت تريد من أوقات التشغيل المُدارة بواسطة OpenClaw استدعاء برنامج التشغيل الخاص بـ TryCua مباشرة، فاستخدم خادم `cua-driver mcp` العلوي عبر سجل MCP في OpenClaw بدلًا من مسار السوق الخاص بـ Codex.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو سجّل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ هذا المسار على سطح أدوات MCP العلوي كما هو، بما في ذلك مخططات برنامج التشغيل واستجابات MCP المهيكلة. استخدمه عندما تريد أن يكون برنامج تشغيل CUA متاحًا كخادم MCP عادي في OpenClaw. استخدم إعداد استخدام الكمبيوتر في Codex في هذه الصفحة عندما ينبغي لخادم تطبيقات Codex امتلاك تثبيت Plugin وإعادة تحميل MCP واستدعاءات الأدوات الأصلية داخل أدوار نمط Codex.

برنامج تشغيل CUA مخصص لـ macOS وما زال يتطلب أذونات macOS المحلية التي يطلبها تطبيقه، مثل إمكانية الوصول وتسجيل الشاشة. لا يثبّت OpenClaw `cua-driver`، ولا يمنح تلك الأذونات، ولا يتجاوز نموذج الأمان الخاص ببرنامج التشغيل العلوي.

## الإعداد السريع

عيّن `plugins.entries.codex.config.computerUse` عندما يجب أن تتوفر ميزة استخدام الكمبيوتر لأدوار نمط Codex قبل بدء سلسلة محادثات:

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
      },
    },
  },
}
```

باستخدام هذا التكوين، يتحقق OpenClaw من خادم تطبيقات Codex قبل كل دور في نمط Codex. إذا كان استخدام الكمبيوتر مفقودًا لكن خادم تطبيقات Codex قد اكتشف مسبقًا سوقًا قابلًا للتثبيت، يطلب OpenClaw من خادم تطبيقات Codex تثبيت Plugin أو إعادة تفعيلها وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك سوق مطابق مسجل وتوجد حزمة تطبيق Codex القياسية، يحاول OpenClaw أيضًا تسجيل سوق Codex المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن يفشل. إذا ظل الإعداد غير قادر على جعل خادم MCP متاحًا، يفشل الدور قبل بدء سلسلة المحادثات.

تحتفظ الجلسات الحالية بوقت التشغيل الخاص بها وربط سلسلة محادثات Codex. بعد تغيير `agentRuntime` أو تكوين استخدام الكمبيوتر، استخدم `/new` أو `/reset` في الدردشة المتأثرة قبل الاختبار.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح دردشة تتوفر فيه واجهة أوامر Plugin `codex`. هذه أوامر دردشة/وقت تشغيل في OpenClaw، وليست أوامر CLI فرعية من نوع `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبّت Plugins، ولا يفعّل دعم Plugin في Codex.

يفعّل `install` دعم Plugin في خادم تطبيقات Codex، ويضيف اختياريًا مصدر سوق مكوّنًا، ويثبّت Plugin المكوّنة أو يعيد تفعيلها عبر خادم تطبيقات Codex، ويعيد تحميل خوادم MCP، ويتحقق من أن خادم MCP يعرض أدوات.

## خيارات السوق

يستخدم OpenClaw واجهة API نفسها لخادم التطبيقات التي يعرّضها Codex نفسه. تحدد حقول السوق المكان الذي ينبغي لـ Codex العثور فيه على `computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| لا يوجد حقل سوق | تريد من خادم تطبيقات Codex استخدام الأسواق التي يعرفها مسبقًا. | نعم، عندما يعيد خادم التطبيقات سوقًا محليًا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يمكن لخادم التطبيقات إضافته.         | نعم، للتثبيت الصريح عبر `/codex computer-use install`.         |
| `marketplacePath`    | تعرف مسبقًا مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدور.   |
| `marketplaceName`    | تريد تحديد سوق مسجل مسبقًا واحد بالاسم.  | نعم فقط عندما يحتوي السوق المحدد على مسار محلي. |

قد تحتاج منازل Codex الجديدة إلى لحظة قصيرة لبذر أسواقها الرسمية. أثناء التثبيت، يستطلع OpenClaw `plugin/list` لمدة تصل إلى `marketplaceDiscoveryTimeoutMs` مللي ثانية. القيمة الافتراضية هي 60 ثانية.

إذا احتوت عدة أسواق معروفة على استخدام الكمبيوتر، يفضّل OpenClaw `openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة غير المعروفة بشكل مغلق وتطلب منك تعيين `marketplaceName` أو `marketplacePath`.

## سوق macOS المضمّن

تضمّن إصدارات سطح مكتب Codex الحديثة استخدام الكمبيوتر هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما تكون `computerUse.autoInstall` مضبوطة على true ولا يكون أي سوق يحتوي على `computer-use` مسجلًا، يحاول OpenClaw إضافة جذر السوق المضمّن القياسي تلقائيًا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضًا تسجيله صراحة من shell باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسار تطبيق Codex غير قياسي، فعيّن `computerUse.marketplacePath` إلى مسار ملف سوق محلي أو شغّل `/codex computer-use install --source
<marketplace-source>` مرة واحدة.

## حد الكتالوج البعيد

يمكن لخادم تطبيقات Codex سرد وقراءة إدخالات الكتالوج البعيدة فقط، لكنه لا يدعم حاليًا `plugin/install` البعيد. يعني ذلك أن `marketplaceName` يمكنه تحديد سوق بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل ما زالت تحتاج إلى سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا ذكرت الحالة أن Plugin متاحة في سوق Codex بعيد لكن التثبيت البعيد غير مدعوم، فشغّل التثبيت باستخدام مصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع التكوين

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يطلب استخدام الكمبيوتر. تكون القيمة الافتراضية true عند تعيين حقل آخر لاستخدام الكمبيوتر. |
| `autoInstall`                   | false          | يثبّت أو يعيد التفعيل من الأسواق المكتشفة مسبقًا عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدة انتظار التثبيت لاكتشاف سوق خادم تطبيقات Codex.             |
| `marketplaceSource`             | غير معيّن          | سلسلة المصدر الممررة إلى `marketplace/add` في خادم تطبيقات Codex.                    |
| `marketplacePath`               | غير معيّن          | مسار ملف سوق Codex المحلي الذي يحتوي على Plugin.                       |
| `marketplaceName`               | غير معيّن          | اسم سوق Codex المسجل المطلوب تحديده.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin في سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي تعرضه Plugin المثبتة.                               |

يرفض التثبيت التلقائي عند بدء الدور عمدًا قيم `marketplaceSource` المكوّنة. إضافة مصدر جديد هي عملية إعداد صريحة، لذا استخدم `/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم اترك `autoInstall` يتعامل مع عمليات إعادة التفعيل المستقبلية من الأسواق المحلية المكتشفة. يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مكوّن، لأن ذلك مسار محلي بالفعل على المضيف.

## ما يتحقق منه OpenClaw

يبلغ OpenClaw عن سبب إعداد مستقر داخليًا وينسّق الحالة الموجّهة للمستخدم للدردشة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | عيّن `enabled` أو حقلًا آخر لاستخدام الكمبيوتر.  |
| `marketplace_missing`        | لم يكن هناك سوق مطابق متاح.                 | كوّن المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبتة.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبتة لكنها معطلة في تكوين Codex.      | شغّل التثبيت لإعادة تفعيلها.                  |
| `remote_install_unsupported` | السوق المحدد بعيد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّلة، لكن خادم MCP غير متاح.  | تحقق من استخدام الكمبيوتر في Codex وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ دور نمط Codex.                    |
| `check_failed`               | فشل طلب خادم تطبيقات Codex أثناء فحص الحالة. | تحقق من اتصال خادم التطبيقات والسجلات.       |
| `auto_install_blocked`       | سيتطلب إعداد بدء الدور إضافة مصدر جديد.       | شغّل التثبيت الصريح أولًا.                   |

يتضمن إخراج الدردشة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات عندما تكون متاحة، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

استخدام الكمبيوتر مخصص لـ macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى أذونات نظام التشغيل المحلي قبل أن يتمكن من فحص التطبيقات أو التحكم بها. إذا قال OpenClaw إن استخدام الكمبيوتر مثبت لكن خادم MCP غير متاح، فتحقق أولًا من إعداد استخدام الكمبيوتر من جهة Codex:

- يعمل Codex app-server على المضيف نفسه حيث يجب أن يحدث التحكم بسطح المكتب.
- تم تمكين Plugin Computer Use في إعدادات Codex.
- يظهر خادم MCP الخاص بـ `computer-use` في حالة MCP في Codex app-server.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الذي يتم التحكم به.

يفشل OpenClaw عمدًا بوضع مغلق عند ضبط `computerUse.enabled` على true. لا ينبغي لدورة وضع Codex أن تتابع بصمت من دون أدوات سطح المكتب الأصلية التي تطلبها الإعداد.

## استكشاف الأخطاء وإصلاحها

**تشير الحالة إلى أنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تشير الحالة إلى أنه مثبت لكنه معطّل.** شغّل `/codex computer-use install` مرة أخرى. يكتب تثبيت Codex app-server إعدادات Plugin مرة أخرى على أنها مفعّلة.

**تشير الحالة إلى أن التثبيت البعيد غير مدعوم.** استخدم مصدر سوق محليًا أو مسارًا محليًا. يمكن فحص إدخالات الفهرس البعيدة فقط، لكن لا يمكن تثبيتها عبر API الحالي لـ app-server.

**تشير الحالة إلى أن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة حتى تُعاد تحميل خوادم MCP. إذا بقي غير متاح، فأصلح تطبيق Codex Computer Use، أو حالة MCP في Codex app-server، أو أذونات macOS.

**تنتهي مهلة الحالة أو الفحص عند `computer-use.list_apps`.** Plugin وخادم MCP موجودان، لكن جسر Computer Use المحلي لم يرد. أغلق Codex Computer Use أو أعد تشغيله، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في جلسة OpenClaw جديدة.

**تقول أداة Computer Use: `Native hook relay unavailable`.** لم تتمكن خطافة الأداة الأصلية في Codex من الوصول إلى مرحّل OpenClaw نشط عبر الجسر المحلي أو خيار Gateway الاحتياطي. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا استمر ذلك، فأعد تشغيل Gateway حتى تُسقَط خيوط app-server القديمة وتسجيلات الخطافات، ثم أعد المحاولة.

**يرفض التثبيت التلقائي عند بداية الدورة مصدرًا.** هذا مقصود. أضف المصدر أولًا باستخدام `/codex computer-use install --source <marketplace-source>` الصريح، ثم يمكن للتثبيت التلقائي عند بداية الدورات المستقبلية استخدام السوق المحلي المكتشف.

## ذات صلة

- [أداة Codex](/ar/plugins/codex-harness)
- [جسر Peekaboo](/ar/platforms/mac/peekaboo)
- [تطبيق iOS](/ar/platforms/ios)

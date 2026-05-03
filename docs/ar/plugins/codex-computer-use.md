---
read_when:
    - تريد من وكلاء OpenClaw في وضع Codex استخدام Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge وcua-driver MCP المباشر
    - أنت تفاضل بين Codex Computer Use وإعداد MCP مباشر باستخدام cua-driver
    - أنت تقوم بتكوين computerUse لـPlugin Codex المضمّن
    - أنت تستكشف مشكلات /codex computer-use status أو install
summary: إعداد استخدام الكمبيوتر في Codex لوكلاء OpenClaw في وضع Codex
title: استخدام الحاسوب في Codex
x-i18n:
    generated_at: "2026-05-03T07:34:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use هو Plugin MCP أصيل في Codex للتحكم في سطح المكتب المحلي. لا يضمّن OpenClaw تطبيق سطح المكتب، ولا ينفّذ إجراءات سطح المكتب بنفسه، ولا يتجاوز أذونات Codex. إن Plugin `codex` المضمّن لا يجهّز إلا خادم تطبيق Codex: فهو يفعّل دعم Plugin في Codex، ويعثر على Plugin Computer Use المهيأ في Codex أو يثبّته، ويتحقق من توفر خادم MCP باسم `computer-use`، ثم يترك لـ Codex امتلاك استدعاءات أداة MCP الأصلية أثناء أدوار وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل حاضنة Codex الأصلية. لإعداد بيئة التشغيل نفسها، راجع [حاضنة Codex](/ar/plugins/codex-harness).

## OpenClaw.app و Peekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن Codex Computer Use. يستطيع تطبيق macOS استضافة مقبس PeekabooBridge لكي يتمكن `peekaboo` CLI من إعادة استخدام منح التطبيق المحلية لإمكانية الوصول وتسجيل الشاشة لأدوات الأتمتة الخاصة بـ Peekaboo. لا يثبّت هذا الجسر Codex Computer Use أو يمرره عبر وكيل، كما أن Codex Computer Use لا يستدعي عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app مضيفًا مدركًا للأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما يجب أن يكون لدى وكيل OpenClaw في وضع Codex، Plugin MCP الأصلي `computer-use` الخاص بـ Codex متاحًا قبل بدء الدور.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. لا يثبّت خادم MCP `computer-use` الخاص بـ Codex ولا يمرره عبر وكيل، وليس خلفية للتحكم في سطح المكتب. بدلًا من ذلك، يتصل تطبيق iOS بصفته عقدة OpenClaw ويكشف إمكانات الهاتف المحمول عبر أوامر العقدة مثل `canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد أن يقود وكيل عقدة iPhone عبر Gateway. استخدم هذه الصفحة عندما يجب أن يتحكم وكيل في وضع Codex في سطح مكتب macOS المحلي عبر Plugin Computer Use الأصلي الخاص بـ Codex.

## MCP cua-driver المباشر

Codex Computer Use ليس الطريقة الوحيدة لكشف التحكم في سطح المكتب. إذا كنت تريد من بيئات التشغيل التي يديرها OpenClaw استدعاء برنامج التشغيل الخاص بـ TryCua مباشرة، فاستخدم خادم `cua-driver mcp` المنبع عبر سجل MCP في OpenClaw بدلًا من مسار السوق الخاص بـ Codex.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو سجّل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ هذا المسار على سطح أدوات MCP المنبع كما هو، بما في ذلك مخططات برنامج التشغيل واستجابات MCP المنظمة. استخدمه عندما تريد إتاحة برنامج تشغيل CUA كخادم MCP عادي في OpenClaw. استخدم إعداد Codex Computer Use في هذه الصفحة عندما يجب أن يمتلك خادم تطبيق Codex تثبيت Plugin، وإعادة تحميل MCP، واستدعاءات الأدوات الأصلية داخل أدوار وضع Codex.

برنامج تشغيل CUA خاص بـ macOS ولا يزال يتطلب أذونات macOS المحلية التي يطلبها تطبيقه، مثل إمكانية الوصول وتسجيل الشاشة. لا يثبّت OpenClaw `cua-driver`، ولا يمنح تلك الأذونات، ولا يتجاوز نموذج الأمان الخاص ببرنامج التشغيل المنبع.

## الإعداد السريع

عيّن `plugins.entries.codex.config.computerUse` عندما يجب أن تتوفر Computer Use لأدوار وضع Codex قبل بدء سلسلة:

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

مع هذا الإعداد، يتحقق OpenClaw من خادم تطبيق Codex قبل كل دور في وضع Codex. إذا كانت Computer Use مفقودة لكن خادم تطبيق Codex اكتشف بالفعل سوقًا قابلًا للتثبيت، يطلب OpenClaw من خادم تطبيق Codex تثبيت Plugin أو إعادة تفعيله وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك سوق مطابق مسجل وتوجد حزمة تطبيق Codex القياسية، يحاول OpenClaw أيضًا تسجيل سوق Codex المضمّن من `/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن يفشل. إذا كان الإعداد لا يزال غير قادر على جعل خادم MCP متاحًا، يفشل الدور قبل بدء السلسلة.

تحتفظ الجلسات الحالية ببيئة التشغيل وربط سلسلة Codex. بعد تغيير `agentRuntime` أو إعداد Computer Use، استخدم `/new` أو `/reset` في الدردشة المتأثرة قبل الاختبار.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح دردشة تتوفر فيه واجهة أوامر Plugin `codex`. هذه أوامر دردشة/تشغيل في OpenClaw، وليست أوامر CLI فرعية من `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبّت Plugins، ولا يفعّل دعم Plugin في Codex.

`install` يفعّل دعم Plugin في خادم تطبيق Codex، ويضيف اختياريًا مصدر سوق مهيأ، ويثبّت Plugin المهيأ أو يعيد تفعيله عبر خادم تطبيق Codex، ويعيد تحميل خوادم MCP، ويتحقق من أن خادم MCP يكشف أدوات.

## خيارات السوق

يستخدم OpenClaw واجهة API خادم التطبيق نفسها التي يكشفها Codex نفسه. تختار حقول السوق المكان الذي يجب أن يعثر فيه Codex على `computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| لا يوجد حقل سوق | تريد من خادم تطبيق Codex استخدام الأسواق التي يعرفها بالفعل. | نعم، عندما يعيد خادم التطبيق سوقًا محليًا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يمكن لخادم التطبيق إضافته.         | نعم، لأمر `/codex computer-use install` الصريح.         |
| `marketplacePath`    | تعرف بالفعل مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدور.   |
| `marketplaceName`    | تريد تحديد سوق واحد مسجل بالفعل بالاسم.  | نعم فقط عندما يكون للسوق المحدد مسار محلي. |

قد تحتاج بيوت Codex الجديدة إلى لحظة قصيرة لتهيئة أسواقها الرسمية. أثناء التثبيت، يستطلع OpenClaw `plugin/list` لمدة تصل إلى `marketplaceDiscoveryTimeoutMs` مللي ثانية. القيمة الافتراضية هي 60 ثانية.

إذا احتوت عدة أسواق معروفة على Computer Use، يفضّل OpenClaw `openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة غير المعروفة بشكل مغلق وتطلب منك تعيين `marketplaceName` أو `marketplacePath`.

## سوق macOS المضمّن

تضمّن إصدارات سطح المكتب الحديثة من Codex Computer Use هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما تكون `computerUse.autoInstall` بقيمة true ولا يكون أي سوق يحتوي على `computer-use` مسجلًا، يحاول OpenClaw إضافة جذر السوق المضمّن القياسي تلقائيًا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضًا تسجيله صراحة من shell باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسار تطبيق Codex غير قياسي، فعيّن `computerUse.marketplacePath` إلى مسار ملف سوق محلي أو شغّل `/codex computer-use install --source <marketplace-source>` مرة واحدة.

## حد الكتالوج البعيد

يستطيع خادم تطبيق Codex سرد وقراءة إدخالات الكتالوج البعيدة فقط، لكنه لا يدعم حاليًا `plugin/install` البعيد. يعني ذلك أن `marketplaceName` يمكنه تحديد سوق بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل لا تزال تحتاج إلى سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا قالت الحالة إن Plugin متاح في سوق Codex بعيد لكن التثبيت البعيد غير مدعوم، فشغّل التثبيت بمصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع الإعداد

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يتطلب Computer Use. الافتراضي هو true عندما يتم تعيين حقل Computer Use آخر. |
| `autoInstall`                   | false          | يثبّت أو يعيد التفعيل من الأسواق المكتشفة بالفعل عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدة انتظار التثبيت لاكتشاف السوق في خادم تطبيق Codex.             |
| `marketplaceSource`             | غير معيّن          | سلسلة المصدر الممررة إلى `marketplace/add` في خادم تطبيق Codex.                    |
| `marketplacePath`               | غير معيّن          | مسار ملف سوق Codex محلي يحتوي على Plugin.                       |
| `marketplaceName`               | غير معيّن          | اسم سوق Codex المسجل المراد تحديده.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin في سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي يكشفه Plugin المثبّت.                               |

يرفض التثبيت التلقائي عند بدء الدور عمدًا قيم `marketplaceSource` المهيأة. إضافة مصدر جديد عملية إعداد صريحة، لذا استخدم `/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم دع `autoInstall` يتعامل مع عمليات إعادة التفعيل المستقبلية من الأسواق المحلية المكتشفة. يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مهيأ، لأن ذلك مسار محلي بالفعل على المضيف.

## ما يتحقق منه OpenClaw

يبلّغ OpenClaw عن سبب إعداد مستقر داخليًا وينسّق الحالة الظاهرة للمستخدم في الدردشة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | عيّن `enabled` أو حقل Computer Use آخر.  |
| `marketplace_missing`        | لم يكن هناك سوق مطابق متاح.                 | هيئ المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبت.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبت لكنه معطل في إعداد Codex.      | شغّل التثبيت لإعادة تفعيله.                  |
| `remote_install_unsupported` | السوق المحدد بعيد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.  | تحقق من Codex Computer Use وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ الدور في وضع Codex.                    |
| `check_failed`               | فشل طلب خادم تطبيق Codex أثناء فحص الحالة. | تحقق من اتصال خادم التطبيق والسجلات.       |
| `auto_install_blocked`       | سيتطلب إعداد بدء الدور إضافة مصدر جديد.       | شغّل التثبيت الصريح أولًا.                   |

يتضمن إخراج الدردشة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات عند توفرها، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

Computer Use خاص بـ macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى أذونات نظام تشغيل محلية قبل أن يتمكن من فحص التطبيقات أو التحكم فيها. إذا قال OpenClaw إن Computer Use مثبت لكن خادم MCP غير متاح، فتحقق أولًا من إعداد Computer Use من جانب Codex:

- يعمل خادم تطبيق Codex على المضيف نفسه الذي يجب أن يحدث عليه التحكم بسطح المكتب.
- تم تمكين Computer Use Plugin في إعدادات Codex.
- يظهر خادم MCP الخاص بـ `computer-use` في حالة MCP لخادم تطبيق Codex.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الجاري التحكم به.

يفشل OpenClaw عمدًا بإغلاق آمن عندما تكون `computerUse.enabled` مضبوطة على true. يجب ألا
تتابع دورة وضع Codex بصمت من دون أدوات سطح المكتب الأصلية
التي تطلبتها الإعدادات.

## استكشاف الأخطاء وإصلاحها

**تقول الحالة إنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم
اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تقول الحالة إنه مثبت لكنه معطّل.** شغّل `/codex computer-use install` مرة أخرى.
تكتب عملية تثبيت خادم تطبيق Codex إعدادات Plugin مرة أخرى بحالة مفعّلة.

**تقول الحالة إن التثبيت البعيد غير مدعوم.** استخدم مصدرًا أو
مسارًا محليًا للسوق. يمكن فحص إدخالات الفهرس البعيدة فقط، لكن لا يمكن تثبيتها عبر
API خادم التطبيق الحالي.

**تقول الحالة إن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة حتى تتم إعادة تحميل
خوادم MCP. إذا ظل غير متاح، فأصلح تطبيق Codex Computer Use،
أو حالة MCP لخادم تطبيق Codex، أو أذونات macOS.

**تنتهي مهلة الحالة أو الفحص على `computer-use.list_apps`.** إن Plugin وخادم MCP
موجودان، لكن جسر Computer Use المحلي لم يرد. أغلق أو
أعد تشغيل Codex Computer Use، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في
جلسة OpenClaw جديدة.

**تقول أداة Computer Use إن `Native hook relay unavailable`.** تعذّر على
خطاف الأداة الأصلي في Codex الوصول إلى مُرحّل OpenClaw نشط عبر الجسر المحلي أو
احتياطي Gateway. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا
استمر ذلك، فأعد تشغيل Gateway حتى يتم إسقاط سلاسل خادم التطبيق القديمة وتسجيلات
الخطافات، ثم أعد المحاولة.

**يرفض التثبيت التلقائي عند بدء الدورة مصدرًا.** هذا مقصود. أضف
المصدر باستخدام `/codex computer-use install --source <marketplace-source>` بشكل صريح
أولًا، ثم يمكن للتثبيت التلقائي عند بدء الدورات المستقبلية استخدام
السوق المحلي المكتشف.

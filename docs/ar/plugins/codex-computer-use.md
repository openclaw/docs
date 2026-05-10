---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw في وضع Codex ميزة Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge وcua-driver MCP المباشر
    - أنت تفاضل بين Codex Computer Use وإعداد مباشر لـ cua-driver MCP
    - أنت تقوم بتكوين computerUse لـ Plugin Codex المضمّن
    - أنت تستكشف أخطاء /codex computer-use status أو install وإصلاحها
summary: إعداد استخدام الكمبيوتر عبر Codex لوكلاء OpenClaw في وضع Codex
title: استخدام الحاسوب في Codex
x-i18n:
    generated_at: "2026-05-10T19:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e1637ad13a96324aebbf97fb179b8c846b27541e917fd56e586c75e79eea7bb
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use هو Plugin MCP أصلي لـ Codex للتحكم في سطح المكتب المحلي. لا يقوم OpenClaw
بتضمين تطبيق سطح المكتب، ولا ينفذ إجراءات سطح المكتب بنفسه، ولا يتجاوز
أذونات Codex. يقوم Plugin `codex` المضمن فقط بإعداد خادم تطبيق Codex:
إذ يفعّل دعم Plugin في Codex، ويعثر على Plugin Codex
Computer Use المهيأ أو يثبته، ويتحقق من توفر خادم MCP `computer-use`، ثم
يترك لـ Codex امتلاك استدعاءات أدوات MCP الأصلية أثناء أدوار وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل حزمة Codex الأصلية. بالنسبة إلى
إعداد وقت التشغيل نفسه، راجع [حزمة Codex](/ar/plugins/codex-harness).

## OpenClaw.app و Peekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن Codex Computer Use. يمكن لتطبيق
macOS استضافة مقبس PeekabooBridge بحيث يمكن لـ CLI `peekaboo` إعادة استخدام
أذونات Accessibility وScreen Recording المحلية الخاصة بالتطبيق لأدوات
الأتمتة الخاصة بـ Peekaboo. لا يقوم هذا الجسر بتثبيت Codex Computer Use أو
تمريره، ولا يستدعي Codex Computer Use عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app
مضيفا واعيا بالأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما يجب أن
يتوفر Plugin MCP `computer-use` الأصلي في Codex لوكيل OpenClaw يعمل في وضع
Codex قبل بدء الدور.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. لا يقوم بتثبيت خادم MCP `computer-use`
الخاص بـ Codex أو تمريره، وليس خلفية للتحكم في سطح المكتب. بدلا من ذلك، يتصل
تطبيق iOS كعقدة OpenClaw ويكشف قدرات الهاتف المحمول من خلال أوامر العقدة مثل
`canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد أن يقود وكيل عقدة iPhone عبر
Gateway. استخدم هذه الصفحة عندما يجب أن يتحكم وكيل يعمل في وضع Codex في سطح
مكتب macOS المحلي عبر Plugin Computer Use الأصلي في Codex.

## MCP مباشر عبر cua-driver

Codex Computer Use ليس الطريقة الوحيدة لكشف التحكم في سطح المكتب. إذا كنت تريد
أن تستدعي أوقات التشغيل المدارة بواسطة OpenClaw مشغل TryCua مباشرة، فاستخدم
خادم `cua-driver mcp` upstream عبر سجل MCP في OpenClaw بدلا من مسار السوق
الخاص بـ Codex.

بعد تثبيت `cua-driver`، إما اطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو سجّل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ ذلك المسار على سطح أدوات MCP upstream كما هو، بما في ذلك مخططات المشغل
واستجابات MCP المهيكلة. استخدمه عندما تريد أن يتوفر مشغل CUA كخادم MCP عادي
في OpenClaw. استخدم إعداد Codex Computer Use في هذه الصفحة عندما يجب أن يمتلك
خادم تطبيق Codex تثبيت Plugin، وإعادة تحميل MCP، واستدعاءات الأدوات الأصلية
داخل أدوار وضع Codex.

مشغل CUA خاص بـ macOS وما زال يتطلب أذونات macOS المحلية التي يطلبها تطبيقه،
مثل Accessibility وScreen Recording. لا يقوم OpenClaw بتثبيت `cua-driver`،
أو منح تلك الأذونات، أو تجاوز نموذج الأمان الخاص بالمشغل upstream.

## إعداد سريع

عيّن `plugins.entries.codex.config.computerUse` عندما يجب أن تتوفر Computer Use
لأدوار وضع Codex قبل بدء محادثة:

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
    },
  },
}
```

باستخدام هذا التكوين، يفحص OpenClaw خادم تطبيق Codex قبل كل دور في وضع Codex.
إذا كانت Computer Use مفقودة لكن خادم تطبيق Codex اكتشف بالفعل سوقا قابلا
للتثبيت، يطلب OpenClaw من خادم تطبيق Codex تثبيت Plugin أو إعادة تفعيله
وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك سوق مطابق مسجل وتوجد
حزمة تطبيق Codex القياسية، يحاول OpenClaw أيضا تسجيل سوق Codex المضمن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن
يفشل. إذا ظل الإعداد غير قادر على إتاحة خادم MCP، يفشل الدور قبل بدء المحادثة.

بعد تغيير تكوين Computer Use، استخدم `/new` أو `/reset` في الدردشة المتأثرة
قبل الاختبار إذا كانت محادثة Codex موجودة قد بدأت بالفعل.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح دردشة يتوفر فيه سطح أوامر Plugin
`codex`. هذه أوامر دردشة/وقت تشغيل في OpenClaw، وليست أوامر CLI فرعية على
الشكل `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبت Plugins، ولا يفعّل دعم
Plugin في Codex.

`install` يفعّل دعم Plugin في خادم تطبيق Codex، ويضيف اختياريا مصدر سوق مهيأ،
ويثبت Plugin المهيأ أو يعيد تفعيله عبر خادم تطبيق Codex، ويعيد تحميل خوادم
MCP، ويتحقق من أن خادم MCP يكشف أدوات.

## خيارات السوق

يستخدم OpenClaw واجهة API خادم التطبيق نفسها التي يكشفها Codex نفسه. تختار
حقول السوق أين يجب أن يعثر Codex على `computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بلا حقل سوق | تريد أن يستخدم خادم تطبيق Codex الأسواق التي يعرفها بالفعل. | نعم، عندما يعيد خادم التطبيق سوقا محليا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يمكن لخادم التطبيق إضافته.         | نعم، للتنفيذ الصريح لـ `/codex computer-use install`.         |
| `marketplacePath`    | تعرف بالفعل مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدور.   |
| `marketplaceName`    | تريد اختيار سوق مسجل بالفعل بالاسم.  | نعم فقط عندما يكون لدى السوق المحدد مسار محلي. |

قد تحتاج أدلة Codex الجديدة إلى لحظة قصيرة لتهيئة أسواقها الرسمية. أثناء
التثبيت، يستطلع OpenClaw `plugin/list` لمدة تصل إلى
`marketplaceDiscoveryTimeoutMs` مللي ثانية. القيمة الافتراضية هي 60 ثانية.

إذا احتوت عدة أسواق معروفة على Computer Use، يفضل OpenClaw
`openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة
غير المعروفة بصورة مغلقة وتطلب منك تعيين `marketplaceName` أو
`marketplacePath`.

## سوق macOS المضمن

تضمّن إصدارات سطح مكتب Codex الحديثة Computer Use هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما يكون `computerUse.autoInstall` صحيحا ولا يكون هناك سوق يحتوي على
`computer-use` مسجل، يحاول OpenClaw إضافة جذر السوق المضمن القياسي تلقائيا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضا تسجيله صراحة من shell باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسار تطبيق Codex غير قياسي، فعيّن `computerUse.marketplacePath`
إلى مسار ملف سوق محلي أو شغّل `/codex computer-use install --source
<marketplace-source>` مرة واحدة.

## حد الكتالوج البعيد

يمكن لخادم تطبيق Codex سرد وقراءة إدخالات الكتالوج البعيدة فقط، لكنه لا يدعم
حاليا `plugin/install` البعيد. هذا يعني أن `marketplaceName` يمكنه اختيار سوق
بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل ما زالت تحتاج إلى
سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا ذكرت الحالة أن Plugin متوفر في سوق Codex بعيد لكن التثبيت البعيد غير
مدعوم، فشغّل التثبيت بمصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع التكوين

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يتطلب Computer Use. تكون القيمة الافتراضية true عند تعيين حقل Computer Use آخر. |
| `autoInstall`                   | false          | يثبت أو يعيد التفعيل من الأسواق المكتشفة بالفعل عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | المدة التي ينتظرها التثبيت لاكتشاف سوق خادم تطبيق Codex.             |
| `marketplaceSource`             | غير معين          | سلسلة المصدر الممررة إلى `marketplace/add` في خادم تطبيق Codex.                    |
| `marketplacePath`               | غير معين          | مسار ملف سوق Codex محلي يحتوي على Plugin.                       |
| `marketplaceName`               | غير معين          | اسم سوق Codex المسجل المطلوب اختياره.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي يكشفه Plugin المثبت.                               |

يرفض التثبيت التلقائي عند بدء الدور عمدا قيم `marketplaceSource` المهيأة.
إضافة مصدر جديد هي عملية إعداد صريحة، لذا استخدم
`/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم دع
`autoInstall` يتولى عمليات إعادة التفعيل المستقبلية من الأسواق المحلية
المكتشفة. يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مهيأ،
لأن ذلك مسار محلي بالفعل على المضيف.

## ما يفحصه OpenClaw

يبلغ OpenClaw عن سبب إعداد مستقر داخليا وينسق الحالة المرئية للمستخدم للدردشة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | عيّن `enabled` أو حقلا آخر من Computer Use.  |
| `marketplace_missing`        | لم يكن هناك سوق مطابق متاح.                 | هيئ المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبت.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبت لكنه معطل في تكوين Codex.      | شغّل التثبيت لإعادة تفعيله.                  |
| `remote_install_unsupported` | السوق المحدد بعيد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.  | افحص Codex Computer Use وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ الدور في وضع Codex.                    |
| `check_failed`               | فشل طلب خادم تطبيق Codex أثناء فحص الحالة. | افحص اتصال خادم التطبيق والسجلات.       |
| `auto_install_blocked`       | سيتطلب إعداد بدء الدور إضافة مصدر جديد.       | شغّل التثبيت الصريح أولا.                   |

يتضمن خرج الدردشة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات عند توفرها،
والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

Computer Use خاص بـ macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى أذونات نظام
تشغيل محلية قبل أن يتمكن من فحص التطبيقات أو التحكم فيها. إذا قال OpenClaw إن
Computer Use مثبتة لكن خادم MCP غير متاح، فتحقق أولا من إعداد Computer Use من
جانب Codex:

- يعمل Codex app-server على المضيف نفسه حيث ينبغي أن يحدث التحكم بسطح المكتب.
- تم تمكين Plugin Computer Use في إعدادات Codex.
- يظهر خادم MCP الخاص بـ `computer-use` في حالة MCP لـ Codex app-server.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الذي يجري التحكم به.

يفشل OpenClaw عمدا بوضع مغلق عندما تكون `computerUse.enabled` بقيمة true. ينبغي ألا تتابع دورة بنمط Codex بصمت من دون أدوات سطح المكتب الأصلية التي تطلبها الإعداد.

## استكشاف الأخطاء وإصلاحها

**تشير الحالة إلى أنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تشير الحالة إلى أنه مثبت لكنه معطل.** شغّل `/codex computer-use install` مرة أخرى. يكتب تثبيت Codex app-server إعدادات Plugin مجددا بحالة ممكّنة.

**تشير الحالة إلى أن التثبيت البعيد غير مدعوم.** استخدم مصدر سوق محليا أو مسارا محليا. يمكن فحص إدخالات الفهرس البعيدة فقط، لكن لا يمكن تثبيتها عبر API الحالي لـ app-server.

**تشير الحالة إلى أن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة كي يعاد تحميل خوادم MCP. إذا بقي غير متاح، فأصلح تطبيق Codex Computer Use أو حالة MCP لـ Codex app-server أو أذونات macOS.

**تنتهي مهلة الحالة أو فحص على `computer-use.list_apps`.** يكون Plugin وخادم MCP موجودين، لكن جسر Computer Use المحلي لم يرد. أنهِ Codex Computer Use أو أعد تشغيله، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في جلسة OpenClaw جديدة.

**تقول أداة Computer Use: `Native hook relay unavailable`.** تعذر على خطاف الأداة الأصلي لـ Codex الوصول إلى مرحّل OpenClaw نشط عبر الجسر المحلي أو مسار Gateway الاحتياطي. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا استمر ذلك، فأعد تشغيل Gateway حتى يتم إسقاط سلاسل app-server القديمة وتسجيلات الخطافات، ثم أعد المحاولة.

**يرفض التثبيت التلقائي عند بدء الدورة مصدرا.** هذا مقصود. أضف المصدر أولا باستخدام `/codex computer-use install --source <marketplace-source>` صراحة، ثم يمكن للتثبيت التلقائي عند بدء الدورات المستقبلية استخدام السوق المحلي المكتشف.

## ذو صلة

- [حزمة اختبار Codex](/ar/plugins/codex-harness)
- [جسر Peekaboo](/ar/platforms/mac/peekaboo)
- [تطبيق iOS](/ar/platforms/ios)

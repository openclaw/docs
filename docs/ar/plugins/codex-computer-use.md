---
read_when:
    - تريد أن يستخدم وكلاء OpenClaw في وضع Codex ميزة Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge والاستخدام المباشر لـ cua-driver MCP
    - أنت تفاضل بين Codex Computer Use وإعداد MCP مباشر لـ cua-driver
    - أنت تقوم بتكوين computerUse لـ Plugin Codex المضمّن
    - أنت تستكشف أخطاء حالة /codex لاستخدام الكمبيوتر أو تثبيته وإصلاحها
summary: إعداد Codex Computer Use لوكلاء OpenClaw بوضع Codex
title: استخدام الحاسوب في Codex
x-i18n:
    generated_at: "2026-06-27T18:01:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use هو Plugin MCP أصلي في Codex للتحكم المحلي بسطح المكتب. لا يضمّن OpenClaw
تطبيق سطح المكتب، ولا ينفّذ إجراءات سطح المكتب بنفسه، ولا يتجاوز
أذونات Codex. لا يفعل Plugin `codex` المضمّن سوى إعداد خادم تطبيقات Codex:
إذ يفعّل دعم Plugins في Codex، ويعثر على Plugin Codex
Computer Use المهيأ أو يثبّته، ويتحقق من توفر خادم MCP باسم `computer-use`، ثم
يترك لـ Codex امتلاك استدعاءات أدوات MCP الأصلية أثناء دورات وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل حزمة Codex الأصلية. لإعداد
وقت التشغيل نفسه، راجع [حزمة Codex](/ar/plugins/codex-harness).

## OpenClaw.app و Peekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن Codex Computer Use. يستطيع
تطبيق macOS استضافة مقبس PeekabooBridge حتى يتمكن CLI `peekaboo` من إعادة استخدام
منح التطبيق المحلية لإمكانية الوصول وتسجيل الشاشة لأدوات الأتمتة الخاصة بـ Peekaboo.
لا يثبّت ذلك الجسر Codex Computer Use ولا يمرّره، كما أن
Codex Computer Use لا يستدعي عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app
مضيفا واعيا بالأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما ينبغي أن يكون لدى
وكيل OpenClaw في وضع Codex Plugin MCP الأصلي `computer-use` الخاص بـ Codex
متاحا قبل بدء الدورة.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. فهو لا يثبّت خادم MCP `computer-use`
الخاص بـ Codex ولا يمرّره، وليس خلفية للتحكم بسطح المكتب. بدلا من ذلك،
يتصل تطبيق iOS كعقدة OpenClaw ويعرض قدرات الهاتف المحمول عبر أوامر العقدة مثل
`canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد من وكيل تشغيل عقدة iPhone عبر
Gateway. استخدم هذه الصفحة عندما ينبغي لوكيل في وضع Codex التحكم في سطح مكتب
macOS المحلي عبر Plugin Computer Use الأصلي الخاص بـ Codex.

## MCP مباشر لـ cua-driver

Codex Computer Use ليس الطريقة الوحيدة لإتاحة التحكم بسطح المكتب. إذا كنت تريد
أن تستدعي أوقات التشغيل التي يديرها OpenClaw برنامج تشغيل TryCua مباشرة، فاستخدم خادم
`cua-driver mcp` من المصدر الأعلى عبر سجل MCP في OpenClaw بدلا من تدفق
سوق Codex الخاص.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو سجّل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يبقي هذا المسار سطح أدوات MCP من المصدر الأعلى كما هو، بما في ذلك مخططات برنامج التشغيل
واستجابات MCP المهيكلة. استخدمه عندما تريد إتاحة برنامج تشغيل CUA
كخادم MCP عادي في OpenClaw. استخدم إعداد Codex Computer Use في
هذه الصفحة عندما ينبغي لخادم تطبيقات Codex امتلاك تثبيت Plugin، وإعادة تحميل MCP،
واستدعاءات الأدوات الأصلية داخل دورات وضع Codex.

برنامج تشغيل CUA خاص بـ macOS ولا يزال يتطلب أذونات macOS المحلية
التي يطلبها تطبيقه، مثل إمكانية الوصول وتسجيل الشاشة. لا يثبّت OpenClaw
`cua-driver`، ولا يمنح تلك الأذونات، ولا يتجاوز نموذج السلامة الخاص ببرنامج التشغيل
من المصدر الأعلى.

## الإعداد السريع

عيّن `plugins.entries.codex.config.computerUse` عندما يجب أن تكون
Computer Use متاحة لدورات وضع Codex قبل بدء سلسلة محادثة. يؤدي `autoInstall: true` إلى
إدخال Computer Use ويتيح لـ OpenClaw تثبيتها أو إعادة تفعيلها قبل الدورة:

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

مع هذا الإعداد، يتحقق OpenClaw من خادم تطبيقات Codex قبل كل دورة في وضع Codex.
إذا كانت Computer Use مفقودة لكن خادم تطبيقات Codex اكتشف بالفعل سوقا قابلا للتثبيت،
يطلب OpenClaw من خادم تطبيقات Codex تثبيت Plugin أو إعادة تفعيله
وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك سوق مطابق مسجل
وكانت حزمة تطبيق Codex القياسية موجودة، يحاول OpenClaw أيضا تسجيل سوق Codex المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن
يفشل. إذا ظل الإعداد عاجزا عن إتاحة خادم MCP، تفشل الدورة قبل
بدء سلسلة المحادثة.

بعد تغيير إعداد Computer Use، استخدم `/new` أو `/reset` في الدردشة المتأثرة
قبل الاختبار إذا كانت سلسلة Codex موجودة قد بدأت بالفعل.

عند بدء stdio المدار على macOS، يفضّل OpenClaw حزمة تطبيق Codex المكتبي
الموقّعة في `/Applications/Codex.app/Contents/Resources/codex` عندما تكون موجودة.
يبقي ذلك Computer Use ضمن حزمة التطبيق التي تملك أذونات التحكم المحلي
بسطح المكتب. إذا لم يكن تطبيق سطح المكتب مثبتا، يعود OpenClaw إلى ملف Codex الثنائي
المدار المثبت بجانب Plugin. إذا تهيأ تطبيق سطح مكتب مثبت بإصدار خادم تطبيقات
غير مدعوم، يغلق OpenClaw ذلك الابن ويعيد المحاولة مع مرشح ملف ثنائي مدار تال
بدلا من السماح لتطبيق سطح مكتب قديم بحجب البديل المحلي الخاص بـ Plugin. لا يزال إعداد
`appServer.command` الصريح أو `OPENCLAW_CODEX_APP_SERVER_BIN` يتجاوز هذا الاختيار
المدار.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح دردشة حيث يتوفر سطح أوامر Plugin
`codex`. هذه أوامر دردشة/وقت تشغيل في OpenClaw، وليست أوامر CLI فرعية
`openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبّت Plugins، ولا
يفعّل دعم Plugins في Codex. إذا لم يكن هناك إعداد يدخل Computer Use، يمكن أن
يبلغ `status` أنها معطلة حتى بعد أمر تثبيت لمرة واحدة.

يقوم `install` بتفعيل دعم Plugins في خادم تطبيقات Codex، ويضيف اختياريا
مصدر سوق مهيأ، ويثبّت أو يعيد تفعيل Plugin المهيأ عبر خادم تطبيقات Codex،
ويعيد تحميل خوادم MCP، ويتحقق من أن خادم MCP يعرض أدوات.

## خيارات السوق

يستخدم OpenClaw واجهة API نفسها لخادم التطبيقات التي يتيحها Codex نفسه. تحدد
حقول السوق المكان الذي ينبغي أن يعثر فيه Codex على `computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| بلا حقل سوق | تريد من خادم تطبيقات Codex استخدام الأسواق التي يعرفها مسبقا. | نعم، عندما يعيد خادم التطبيقات سوقا محليا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يستطيع خادم التطبيقات إضافته.         | نعم، لأمر `/codex computer-use install` الصريح.         |
| `marketplacePath`    | تعرف مسبقا مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدورة.   |
| `marketplaceName`    | تريد اختيار سوق واحد مسجل مسبقا بالاسم.  | نعم فقط عندما يكون للسوق المختار مسار محلي. |

قد تحتاج بيوت Codex الجديدة إلى لحظة قصيرة لبذر أسواقها الرسمية.
أثناء التثبيت، يستطلع OpenClaw `plugin/list` لمدة تصل إلى
`marketplaceDiscoveryTimeoutMs` مللي ثانية. الافتراضي هو 60 ثانية.

إذا احتوت عدة أسواق معروفة على Computer Use، يفضّل OpenClaw
`openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة غير المعروفة
مغلقة وتطلب منك تعيين `marketplaceName` أو `marketplacePath`.

## سوق macOS المضمّن

تضمّن إصدارات Codex المكتبية الحديثة Computer Use هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما تكون `computerUse.autoInstall` صحيحة ولا يكون هناك سوق يحتوي على
`computer-use` مسجل، يحاول OpenClaw إضافة جذر السوق المضمّن القياسي تلقائيا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضا تسجيله صراحة من shell باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسارا غير قياسي لتطبيق Codex، فشغّل `/codex computer-use install
--source <marketplace-root>` مرة واحدة أو عيّن `computerUse.marketplacePath` إلى
مسار ملف سوق محلي. استخدم `--marketplace-path` فقط عندما يكون لديك
مسار ملف JSON الخاص بالسوق، وليس جذر السوق المضمّن.

## حد الكتالوج البعيد

يستطيع خادم تطبيقات Codex سرد إدخالات الكتالوج البعيدة فقط وقراءتها، لكنه لا
يدعم حاليا `plugin/install` البعيد. هذا يعني أن `marketplaceName` يمكنه
اختيار سوق بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل
لا تزال تحتاج إلى سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا قالت الحالة إن Plugin متاح في سوق Codex بعيد لكن التثبيت البعيد
غير مدعوم، فشغّل التثبيت بمصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع الإعداد

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يتطلب Computer Use. يكون الافتراضي true عند تعيين حقل Computer Use آخر. |
| `autoInstall`                   | false          | يثبّت أو يعيد التفعيل من الأسواق المكتشفة مسبقا عند بدء الدورة.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدة انتظار التثبيت لاكتشاف سوق خادم تطبيقات Codex.             |
| `marketplaceSource`             | غير معيّن          | سلسلة المصدر الممررة إلى `marketplace/add` في خادم تطبيقات Codex.                    |
| `marketplacePath`               | غير معيّن          | مسار ملف سوق Codex المحلي الذي يحتوي على Plugin.                       |
| `marketplaceName`               | غير معيّن          | اسم سوق Codex المسجل المطلوب اختياره.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin في سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي يعرضه Plugin المثبت.                               |

يرفض التثبيت التلقائي عند بدء الدورة عمدا قيم `marketplaceSource` المهيأة.
إضافة مصدر جديد عملية إعداد صريحة، لذا استخدم
`/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم دع
`autoInstall` يتعامل مع عمليات إعادة التفعيل المستقبلية من الأسواق المحلية المكتشفة.
يمكن للتثبيت التلقائي عند بدء الدورة استخدام `marketplacePath` مهيأ، لأن ذلك
هو بالفعل مسار محلي على المضيف.

## ما يتحقق منه OpenClaw

يبلغ OpenClaw عن سبب إعداد مستقر داخليا وينسّق الحالة المواجهة للمستخدم
للدردشة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | اضبط `enabled` أو حقلاً آخر من حقول استخدام الكمبيوتر.  |
| `marketplace_missing`        | لم يكن هناك سوق مطابق متاح.                 | اضبط المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبت.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبت لكنه معطل في إعدادات Codex.      | شغّل التثبيت لإعادة تفعيله.                  |
| `remote_install_unsupported` | السوق المحدد بعيد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.  | تحقق من استخدام الكمبيوتر في Codex وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ دور وضع Codex.                    |
| `check_failed`               | فشل طلب إلى خادم تطبيق Codex أثناء فحص الحالة. | تحقق من اتصال خادم التطبيق والسجلات.       |
| `auto_install_blocked`       | كان إعداد بدء الدور سيحتاج إلى إضافة مصدر جديد.       | شغّل تثبيتاً صريحاً أولاً.                   |

يتضمن مخرج المحادثة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات
عند توفرها، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

استخدام الكمبيوتر خاص بنظام macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى أذونات
محلية من نظام التشغيل قبل أن يتمكن من فحص التطبيقات أو التحكم بها. إذا قال OpenClaw إن استخدام الكمبيوتر
مثبت لكن خادم MCP غير متاح، فتحقق أولاً من إعداد استخدام الكمبيوتر من جانب Codex:

- خادم تطبيق Codex يعمل على المضيف نفسه الذي يجب أن يحدث فيه التحكم بسطح المكتب.
- Plugin استخدام الكمبيوتر مفعّل في إعدادات Codex.
- يظهر خادم MCP `computer-use` في حالة MCP لخادم تطبيق Codex.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الذي يتم التحكم به.

يفشل OpenClaw عمداً بشكل مغلق عندما تكون `computerUse.enabled` مضبوطة على true. لا ينبغي
لدور وضع Codex أن يتابع بصمت من دون أدوات سطح المكتب الأصلية
التي تطلبتها الإعدادات.

## استكشاف الأخطاء وإصلاحها

**تقول الحالة إنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم
اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تقول الحالة إنه مثبت لكنه معطل.** شغّل `/codex computer-use install` مرة أخرى.
تثبيت خادم تطبيق Codex يكتب إعدادات Plugin مرة أخرى بوضع مفعّل.

**تقول الحالة إن التثبيت البعيد غير مدعوم.** استخدم مصدر سوق محلياً أو
مساراً. يمكن فحص إدخالات الفهرس البعيدة فقط، لكن لا يمكن تثبيتها عبر
واجهة API الحالية لخادم التطبيق.

**تقول الحالة إن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة لكي تعيد خوادم MCP
التحميل. إذا بقي غير متاح، فأصلح تطبيق استخدام الكمبيوتر في Codex،
أو حالة MCP لخادم تطبيق Codex، أو أذونات macOS.

**تنتهي مهلة الحالة أو الفحص على `computer-use.list_apps`.** إن Plugin وخادم MCP
موجودان، لكن جسر استخدام الكمبيوتر المحلي لم يرد. أغلق أو
أعد تشغيل استخدام الكمبيوتر في Codex، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في
جلسة OpenClaw جديدة. إذا كان المضيف قد شغّل استخدام الكمبيوتر سابقاً عبر خادم تطبيق Codex مُدار أقدم،
فحدّث Plugin المثبت من السوق المضمّن في سطح المكتب:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**تقول أداة استخدام الكمبيوتر `Native hook relay unavailable`.** تعذر على خطاف الأداة الأصلي في Codex
الوصول إلى Relay نشط في OpenClaw عبر الجسر المحلي أو
احتياطي Gateway. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا
نجح مرة واحدة ثم فشل مرة أخرى في استدعاء أداة لاحق، فإن `/new` يمسح
المحاولة الحالية فقط؛ أعد تشغيل خادم تطبيق Codex أو OpenClaw Gateway لكي تُسقط الخيوط القديمة
وتسجيلات الخطاف، ثم أعد المحاولة في جلسة جديدة.

**يرفض التثبيت التلقائي عند بدء الدور مصدراً.** هذا مقصود. أضف
المصدر باستخدام `/codex computer-use install --source <marketplace-source>` الصريح
أولاً، ثم يمكن للتثبيت التلقائي عند بدء الأدوار المستقبلية استخدام
السوق المحلي المكتشف.

## ذات صلة

- [حزمة Codex](/ar/plugins/codex-harness)
- [جسر Peekaboo](/ar/platforms/mac/peekaboo)
- [تطبيق iOS](/ar/platforms/ios)

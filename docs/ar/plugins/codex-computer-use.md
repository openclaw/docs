---
read_when:
    - تريد أن تستخدم وكلاء OpenClaw في وضع Codex ميزة Codex Computer Use
    - أنت تفاضل بين Codex Computer Use وPeekabooBridge وMCP المباشر لـ cua-driver
    - أنت تُعِدّ computerUse لـ Plugin Codex المضمّن
    - أنت تستكشف أخطاء حالة استخدام الحاسوب أو تثبيته في /codex وتعمل على حلّها
summary: إعداد استخدام الكمبيوتر في Codex لوكلاء OpenClaw في وضع Codex
title: استخدام الكمبيوتر في Codex
x-i18n:
    generated_at: "2026-07-12T06:14:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use هو Plugin MCP أصلي في Codex للتحكم في سطح المكتب المحلي. لا يقوم OpenClaw
بتضمين تطبيق سطح المكتب، أو تنفيذ إجراءات سطح المكتب بنفسه، أو تجاوز
أذونات Codex. لا يفعل Plugin `codex` المضمّن سوى تجهيز خادم تطبيق Codex:
فهو يفعّل دعم Plugins في Codex، ويعثر على Plugin Computer Use المضبوط أو يثبّته،
ويتحقق من توفر خادم MCP ‏`computer-use`، ثم يترك
لـ Codex ملكية استدعاءات أدوات MCP الأصلية أثناء دورات وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw مستخدمًا بالفعل لحاضنة Codex الأصلية. لإعداد
بيئة التشغيل نفسها، راجع [حاضنة Codex](/ar/plugins/codex-harness).

يختلف هذا عن [أداة الكمبيوتر المدعومة بعقدة](/ar/nodes/computer-use) والمضمّنة في OpenClaw. استخدم الأداة المضمّنة عندما ينبغي لعقد الوكيل نفسه التحكم في جهاز Mac مقترن، سواء كان الوكيل يعمل على Gateway أو على Node أخرى. استخدم Codex Computer Use عندما ينبغي لخادم تطبيق Codex امتلاك تثبيت MCP المحلي والأذونات واستدعاءات الأدوات الأصلية.

## OpenClaw.app وPeekaboo

يُعد تكامل Peekaboo في OpenClaw.app منفصلًا عن Codex Computer Use. يمكن
لتطبيق macOS استضافة مقبس PeekabooBridge كي تتمكن CLI ‏`peekaboo` من إعادة استخدام
أذونات تسهيلات الاستخدام وتسجيل الشاشة المحلية الممنوحة للتطبيق، وذلك لأدوات
الأتمتة الخاصة بـ Peekaboo. لا يثبّت هذا الجسر Codex Computer Use ولا يعمل وسيطًا له، كما أن
Codex Computer Use لا يستدعي عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app
مضيفًا مدركًا للأذونات لأتمتة CLI الخاصة بـ Peekaboo. استخدم هذه الصفحة عندما ينبغي
لوكيل OpenClaw في وضع Codex أن يتوفر له Plugin MCP ‏`computer-use` الأصلي
الخاص بـ Codex قبل بدء الدورة.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. فهو لا يثبّت خادم MCP ‏`computer-use`
الخاص بـ Codex ولا يعمل وسيطًا له، وليس واجهة خلفية للتحكم في سطح المكتب.
بدلًا من ذلك، يتصل تطبيق iOS بوصفه Node في OpenClaw ويعرض إمكانات
الأجهزة المحمولة من خلال أوامر Node مثل `canvas.*` و`camera.*` و`screen.*`
و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد من وكيل تشغيل Node على iPhone
عبر Gateway. استخدم هذه الصفحة عندما ينبغي لوكيل في وضع Codex التحكم في
سطح مكتب macOS المحلي من خلال Plugin Computer Use الأصلي الخاص بـ Codex.

## MCP المباشر لـ cua-driver

Codex Computer Use ليس الطريقة الوحيدة لإتاحة التحكم في سطح المكتب. إذا كنت تريد
أن تستدعي بيئات التشغيل التي يديرها OpenClaw برنامج تشغيل TryCua مباشرةً، فاستخدم خادم
`cua-driver mcp` الأصلي عبر سجل MCP الخاص بـ OpenClaw بدلًا من
مسار السوق الخاص بـ Codex.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو تسجّل خادم stdio مباشرةً:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ هذا المسار على سطح أدوات MCP الأصلي دون تغيير، بما في ذلك مخططات برنامج التشغيل
واستجابات MCP المنظّمة. استخدمه عندما تريد إتاحة برنامج تشغيل CUA
كخادم MCP عادي في OpenClaw. استخدم إعداد Codex Computer Use في
هذه الصفحة عندما ينبغي لخادم تطبيق Codex امتلاك تثبيت Plugin وإعادة تحميل MCP
واستدعاءات الأدوات الأصلية داخل دورات وضع Codex.

برنامج تشغيل CUA خاص بـ macOS ولا يزال يتطلب أذونات macOS المحلية
التي يطالب بها تطبيقه، مثل تسهيلات الاستخدام وتسجيل الشاشة. لا يقوم OpenClaw
بتثبيت `cua-driver` أو منح تلك الأذونات أو تجاوز
نموذج أمان برنامج التشغيل الأصلي.

## الإعداد السريع

اضبط `plugins.entries.codex.config.computerUse` عندما يجب أن يتوفر
Computer Use لدورات وضع Codex قبل بدء سلسلة محادثة. يؤدي `autoInstall: true` إلى
تفعيل Computer Use والسماح لـ OpenClaw بتثبيته أو إعادة تمكينه قبل الدورة:

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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

باستخدام هذا الضبط، يتحقق OpenClaw من خادم تطبيق Codex قبل كل دورة في وضع Codex.
إذا كان Computer Use مفقودًا، لكن خادم تطبيق Codex سبق أن اكتشف
سوقًا قابلًا للتثبيت، يطلب OpenClaw من خادم تطبيق Codex تثبيت Plugin أو
إعادة تمكينه وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون هناك
سوق مطابق مسجّل مع وجود حزمة تطبيق سطح مكتب قياسية، يحاول OpenClaw
أيضًا تسجيل سوق Codex المضمّن من
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`، مع الاحتفاظ بـ
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`
كخيار احتياطي لعمليات التثبيت المستقلة القديمة. إذا ظل الإعداد غير قادر على إتاحة
خادم MCP، تفشل الدورة قبل بدء سلسلة المحادثة.

بعد تغيير ضبط Computer Use، استخدم `/new` أو `/reset` في المحادثة
المتأثرة قبل الاختبار إذا كانت سلسلة محادثة Codex حالية قد بدأت بالفعل.

على macOS، يفضّل بدء التشغيل المُدار لـ Computer Use الملف التنفيذي لتطبيق سطح المكتب في
`/Applications/ChatGPT.app/Contents/Resources/codex`، ثم
يرجع إلى `/Applications/Codex.app/Contents/Resources/codex` كخيار احتياطي لعمليات
التثبيت المستقلة القديمة. ينطبق هذا أيضًا على أوامر حالة Computer Use
والتثبيت لمرة واحدة التي تشغّل عميلها الخاص. وهذا يُبقي التحكم في سطح المكتب تحت
حزمة التطبيق المالكة لأذونات macOS المحلية. إذا لم يكن تطبيق سطح المكتب
مثبّتًا، يرجع OpenClaw إلى الملف التنفيذي المُدار لـ Codex والمثبّت بجوار
Plugin. تفضّل دورات Codex المُدارة العادية التي تستخدم المجلد الرئيسي المعزول الافتراضي للوكيل
تلك الحزمة المثبّتة أولًا، كي لا يحجب تطبيق سطح مكتب أقدم دعم النماذج
الحالي. تظل المجلدات الرئيسية ضمن نطاق المستخدم مفضِّلةً لتطبيق سطح المكتب لأنها تستطيع تحميل
حالة Computer Use الأصلية. كما يظل المجلد الرئيسي المعزول للوكيل، الذي يفعّل ضبط Codex الفعلي فيه
Computer Use، مفضِّلًا لتطبيق سطح المكتب. يظل ضبط
`appServer.command` الصريح أو `OPENCLAW_CODEX_APP_SERVER_BIN` متجاوزًا
لهذا الاختيار المُدار.

يسلسل OpenClaw قراءات ضبط Codex الأصلي وتثبيت Computer Use
داخل Gateway واحد قيد التشغيل. ولا تخضع عملية Codex منفصلة أو Gateway آخر
لهذا الحاجز. بعد تغيير ضبط Plugin الأصلي لـ Codex خارج
Gateway، أعد تشغيل Gateway وابدأ محادثة جديدة قبل الاعتماد على
الاختيار الجديد.

## الأوامر

استخدم أوامر `/codex computer-use` من أي واجهة محادثة يتوفر فيها
سطح أوامر Plugin ‏`codex`. هذه أوامر محادثة/بيئة تشغيل خاصة بـ OpenClaw،
وليست أوامر فرعية لـ CLI ‏`openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

الإجراء `status` هو الإجراء الافتراضي وهو للقراءة فقط: لا يضيف مصادر أسواق
ولا يثبّت Plugins ولا يفعّل دعم Plugins في Codex. إذا لم يفعّل أي ضبط
Computer Use، فقد يعرض `status` أنه معطّل حتى بعد أمر تثبيت
لمرة واحدة.

يعمل `install` على تمكين دعم Plugins في خادم تطبيق Codex، وإضافة
مصدر سوق مضبوط اختياريًا، وتثبيت Plugin المضبوط أو إعادة تمكينه
من خلال خادم تطبيق Codex، وإعادة تحميل خوادم MCP، والتحقق من أن خادم MCP
يعرض أدوات. ولأن التثبيت يغيّر موارد المضيف الموثوقة،
لا يمكن تشغيل `install` إلا بواسطة مالك أو عميل Gateway من نوع `operator.admin`.
يمكن للمرسلين الآخرين المصرّح لهم مواصلة استخدام أمر `status` للقراءة فقط،
بما في ذلك مع التجاوزات.

كانت الإصدارات الأقدم تقبل تجاوزات الهوية لمرة واحدة `--plugin` و`--server`
و`--mcp-server`. اضبط `computerUse.pluginName` و
`computerUse.mcpServerName` بصورة دائمة بدلًا منها. عند استخدام علامة هوية قديمة،
يحدّد الأمر الإعداد الدقيق الذي يجب حفظه بصورة دائمة ويكرر الإجراء المطلوب
إضافةً إلى أي علامات سوق مدعومة في إرشادات الترحيل.

## خيارات السوق

يستخدم OpenClaw واجهة API نفسها لخادم التطبيق التي يوفّرها Codex. تحدد
حقول السوق المكان الذي ينبغي لـ Codex العثور فيه على `computer-use`.

| الحقل                | يُستخدم عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| لا يوجد حقل للسوق | تريد أن يستخدم خادم تطبيق Codex الأسواق التي يعرفها بالفعل. | نعم، عندما يُرجع خادم التطبيق سوقًا محليًا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يمكن لخادم التطبيق إضافته.         | نعم، لأمر `/codex computer-use install` الصريح.         |
| `marketplacePath`    | تعرف بالفعل مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدورة.   |
| `marketplaceName`    | تريد تحديد سوق مسجّل مسبقًا حسب الاسم.  | نعم فقط عندما يكون للسوق المحدد مسار محلي. |

قد تحتاج المجلدات الرئيسية الجديدة لـ Codex إلى لحظة قصيرة لتهيئة
أسواقها الرسمية. أثناء التثبيت، يستطلع OpenClaw ‏`plugin/list` لمدة تصل إلى
`marketplaceDiscoveryTimeoutMs` مللي ثانية (الافتراضي 60 ثانية).

إذا احتوت عدة أسواق معروفة على Computer Use، يفضّل OpenClaw
`openai-bundled`، ثم `openai-curated`، ثم `local`. أما التطابقات المجهولة
الملتبسة فتفشل بشكل مغلق وتطلب منك ضبط `marketplaceName` أو
`marketplacePath`.

## سوق macOS المضمّن

تضمّن إصدارات سطح المكتب الحالية من ChatGPT تطبيق Computer Use هنا؛ وتستخدم إصدارات
سطح المكتب المستقلة القديمة من Codex التخطيط نفسه ضمن `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما تكون قيمة `computerUse.autoInstall` هي true ولا يكون أي سوق يحتوي على
`computer-use` مسجّلًا، يحاول OpenClaw إضافة أول جذر سوق
مضمّن قياسي موجود:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضًا تسجيله صراحةً من واجهة أوامر باستخدام Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسارًا غير قياسي لتطبيق Codex، فنفّذ `/codex computer-use install
--source <marketplace-root>` مرة واحدة، أو اضبط `computerUse.marketplacePath` على
مسار ملف سوق محلي. لا تستخدم `--marketplace-path` إلا عندما يكون لديك
مسار ملف JSON الخاص بالسوق، وليس جذر السوق المضمّن.

### ذاكرة التخزين المؤقت المشتركة للـ Plugin

يترك الإعداد الافتراضي `pluginCacheMode: "independent"` كل مجلد رئيسي لـ Codex وذاكرة
التخزين المؤقت للـ Plugin الخاصة به دون إدارة. اضبط `pluginCacheMode: "shared"` لنسخ Plugin
Computer Use المضمّن إلى ذاكرة التخزين المؤقت القابلة للاكتشاف للـ Plugin في مجلد Codex الرئيسي النشط
قبل بدء تشغيل خادم التطبيق. يحافظ الوضع المشترك على الإصدارات الأقدم المخزّنة مؤقتًا لأن
عملاء Codex قيد التشغيل قد يظلون يشيرون إلى أدلة Plugins ذات الإصدارات المحددة؛ كما يحافظ
فشل استبدال النسخة على ذاكرة التخزين المؤقت النشطة. يؤدي ضبط
`marketplaceName` أو `marketplacePath` الصريح إلى تعطيل هذه
المطابقة، كي لا يتجاوز OpenClaw ذلك الاختيار.

## قيود الكتالوج البعيد

يمكن لخادم تطبيق Codex سرد إدخالات الكتالوج البعيدة فقط وقراءتها، لكنه
لا يدعم حاليًا `plugin/install` عن بُعد. وهذا يعني أن `marketplaceName`
يمكنه تحديد سوق بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة
التمكين لا تزال تحتاج إلى سوق محلي عبر `marketplaceSource` أو
`marketplacePath`.

إذا أشارت الحالة إلى أن Plugin متاح في سوق Codex بعيد، لكن
التثبيت عن بُعد غير مدعوم، فنفّذ التثبيت باستخدام مصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع الضبط

| الحقل                           | القيمة الافتراضية | المعنى                                                                        |
| ------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `enabled`                       | مستنتجة           | يتطلب استخدام الحاسوب. تكون القيمة الافتراضية true عند تعيين حقل آخر من حقول استخدام الحاسوب. |
| `autoInstall`                   | false             | يثبّت أو يعيد التفعيل من أسواق الإضافات المكتشفة مسبقًا عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000             | مدة انتظار التثبيت حتى يكتشف خادم تطبيق Codex سوق الإضافات.                  |
| `liveTestTimeoutMs`             | 60000             | المهلة الزمنية لسلسلة التحقق المؤقتة من الجاهزية وطلبات تنظيفها.             |
| `toolCallTimeoutMs`             | 60000             | المهلة الزمنية لاستدعاء أداة الجاهزية `list_apps` الخاصة باستخدام الحاسوب.   |
| `healthCheckEnabled`            | false             | يشغّل اختبارات جاهزية دورية ما دام عميل خادم التطبيق المالك نشطًا.           |
| `healthCheckIntervalMinutes`    | 60                | وتيرة الاختبار؛ القيم المقبولة هي 30 أو 60 أو 120 أو 240 دقيقة.              |
| `pluginCacheMode`               | `independent`     | استخدم `shared` لتحديث ذاكرة Codex الرئيسية المؤقتة من Plugin سطح المكتب المضمّن. |
| `strictReadiness`               | false             | يوقف بدء التشغيل عند فشل اختبار مباشر بدلًا من المتابعة مع تحذير.            |
| `autoRepair`                    | false             | ينهي عمليات MCP الفرعية القديمة والمحددة النطاق لاستخدام الحاسوب، ثم يعيد محاولة الاختبار الفاشل مرة واحدة. |
| `marketplaceSource`             | غير معيّنة        | سلسلة المصدر المُمررة إلى `marketplace/add` في خادم تطبيق Codex.             |
| `marketplacePath`               | غير معيّن         | مسار ملف سوق إضافات Codex المحلي الذي يحتوي على Plugin.                      |
| `marketplaceName`               | غير معيّن         | اسم سوق إضافات Codex المسجّل المراد تحديده.                                  |
| `pluginName`                    | `computer-use`    | اسم Plugin في سوق إضافات Codex.                                               |
| `mcpServerName`                 | `computer-use`    | اسم خادم MCP الذي يتيحه Plugin المثبّت.                                      |

يرفض التثبيت التلقائي عند بدء الدور عمدًا قيم `marketplaceSource`
المُهيأة. تُعد إضافة مصدر جديد عملية إعداد صريحة، لذا استخدم
`/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم دع
`autoInstall` يتولى عمليات إعادة التفعيل اللاحقة من أسواق الإضافات المحلية المكتشفة.
يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مُهيأ، لأنه
مسار محلي موجود مسبقًا على المضيف.

يقبل كل حقل أيضًا تجاوزًا عبر متغير بيئة، ويُتحقق منه عندما يكون
مفتاح الإعداد المطابق غير معيّن:

| الحقل                           | متغير البيئة                                                    |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## ما الذي يتحقق منه OpenClaw

يُبلغ OpenClaw داخليًا عن سبب إعداد ثابت، وينسّق
الحالة المعروضة للمستخدم في الدردشة:

| السبب                        | المعنى                                                  | الخطوة التالية                                 |
| ---------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `disabled`                   | أصبحت قيمة `computerUse.enabled` بعد الحل false.        | عيّن `enabled` أو حقلًا آخر لاستخدام الحاسوب.  |
| `marketplace_missing`        | لم يتوفر سوق إضافات مطابق.                              | هيّئ المصدر أو المسار أو اسم سوق الإضافات.     |
| `plugin_not_installed`       | سوق الإضافات موجود، لكن Plugin غير مثبّت.               | شغّل التثبيت أو فعّل `autoInstall`.            |
| `plugin_disabled`            | Plugin مثبّت لكنه معطّل في إعدادات Codex.               | شغّل التثبيت لإعادة تفعيله.                    |
| `remote_install_unsupported` | سوق الإضافات المحدد متاح عن بُعد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.                    | تحقق من استخدام الحاسوب في Codex وأذونات نظام التشغيل. |
| `ready`                      | Plugin وأدوات MCP متاحة.                                | ابدأ الدور في وضع Codex.                       |
| `check_failed`               | فشل طلب إلى خادم تطبيق Codex أثناء التحقق من الحالة.    | تحقق من اتصال خادم التطبيق وسجلاته.            |
| `auto_install_blocked`       | سيتطلب الإعداد عند بدء الدور إضافة مصدر جديد.           | شغّل التثبيت الصريح أولًا.                     |

يتضمن إخراج الدردشة حالة Plugin وحالة خادم MCP وسوق الإضافات،
والأدوات عند توفرها، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

استخدام الحاسوب خاص بنظام macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى
أذونات محلية من نظام التشغيل قبل أن يتمكن من فحص التطبيقات أو التحكم فيها. إذا ذكر OpenClaw أن استخدام
الحاسوب مثبّت لكن خادم MCP غير متاح، فتحقق أولًا من
إعداد استخدام الحاسوب من جهة Codex:

- يعمل خادم تطبيق Codex على المضيف نفسه الذي يجب أن يحدث عليه
  التحكم بسطح المكتب.
- Plugin استخدام الحاسوب مفعّل في إعدادات Codex.
- يظهر خادم MCP‏ `computer-use` في حالة MCP لخادم تطبيق Codex.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- تستطيع جلسة المضيف الحالية الوصول إلى سطح المكتب الجاري التحكم فيه.

يتوقف OpenClaw عمدًا عند الفشل عندما تكون قيمة `computerUse.enabled` هي true. يجب
ألا يتابع الدور في وضع Codex بصمت من دون أدوات سطح المكتب الأصلية
التي تطلبها الإعدادات.

## استكشاف الأخطاء وإصلاحها

**تشير الحالة إلى أنه غير مثبّت.** شغّل `/codex computer-use install`. إذا لم
يُكتشف سوق الإضافات، فمرّر `--source` أو `--marketplace-path`.

**تشير الحالة إلى أنه مثبّت لكنه معطّل.** شغّل `/codex computer-use install`
مرة أخرى. يعيد تثبيت خادم تطبيق Codex كتابة إعدادات Plugin بحالة مفعّلة.

**تشير الحالة إلى أن التثبيت عن بُعد غير مدعوم.** استخدم مصدرًا أو مسارًا محليًا
لسوق الإضافات. يمكن فحص إدخالات الفهرس المتاحة عن بُعد فقط، لكن لا يمكن
تثبيتها عبر واجهة API الحالية لخادم التطبيق.

**تشير الحالة إلى أن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة لكي تُعاد
تحميل خوادم MCP. إذا ظل غير متاح، فأصلح تطبيق استخدام الحاسوب في Codex،
أو حالة MCP لخادم تطبيق Codex، أو أذونات macOS.

**تنتهي مهلة الحالة أو الاختبار عند `computer-use.list_apps`.** يكون Plugin
وخادم MCP موجودين، لكن جسر استخدام الحاسوب المحلي لم يستجب.
أغلق استخدام الحاسوب في Codex أو أعد تشغيله، وأعد تشغيل Codex Desktop عند الحاجة، ثم
أعد المحاولة في جلسة OpenClaw جديدة. إذا سبق أن شغّل المضيف استخدام الحاسوب
عبر خادم تطبيق Codex مُدار أقدم، فحدّث Plugin المثبّت من
سوق الإضافات المضمّن مع تطبيق سطح المكتب (استخدم مسار `Codex.app` لعمليات
تثبيت Codex المستقلة لسطح المكتب):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**تعرض أداة لاستخدام الحاسوب الرسالة `Native hook relay unavailable`.** تعذر على
خطاف الأداة الأصلي في Codex الوصول إلى مرحّل OpenClaw نشط عبر
الجسر المحلي أو مسار Gateway الاحتياطي. ابدأ جلسة OpenClaw جديدة باستخدام `/new`
أو `/reset`. إذا نجح مرة ثم فشل مجددًا في استدعاء أداة لاحق،
فإن `/new` يمسح المحاولة الحالية فقط؛ أعد تشغيل خادم تطبيق Codex أو
Gateway الخاص بـ OpenClaw حتى تُزال سلاسل التنفيذ القديمة وتسجيلات الخطافات، ثم
أعد المحاولة في جلسة جديدة.

**يرفض التثبيت التلقائي عند بدء الدور مصدرًا.** هذا مقصود. أضف
المصدر أولًا باستخدام `/codex computer-use install --source
<marketplace-source>` بشكل صريح، وبعدها يمكن للتثبيت التلقائي في بدايات الأدوار اللاحقة استخدام
سوق الإضافات المحلي المكتشف.

## ذو صلة

- [بيئة تشغيل Codex](/ar/plugins/codex-harness)
- [جسر Peekaboo](/ar/platforms/mac/peekaboo)
- [تطبيق iOS](/ar/platforms/ios)

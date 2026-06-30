---
read_when:
    - تريد أن تستخدم وكلاء OpenClaw في وضع Codex ميزة Codex Computer Use
    - أنت تقرر بين Codex Computer Use وPeekabooBridge وMCP مباشر عبر cua-driver
    - أنت تختار بين Codex Computer Use وإعداد MCP مباشر باستخدام cua-driver
    - أنت تقوم بتكوين computerUse من أجل Codex Plugin المضمّن
    - أنت تستكشف أخطاء حالة /codex computer-use أو التثبيت وإصلاحها
summary: إعداد استخدام الكمبيوتر في Codex لوكلاء OpenClaw بوضع Codex
title: استخدام الحاسوب في Codex
x-i18n:
    generated_at: "2026-06-30T14:04:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use هو Plugin ‏MCP أصلي لـ Codex للتحكم المحلي بسطح المكتب. لا يضمّن OpenClaw
تطبيق سطح المكتب، ولا ينفذ إجراءات سطح المكتب بنفسه، ولا يتجاوز
أذونات Codex. إن Plugin ‏`codex` المضمّن يجهّز Codex app-server فقط:
فهو يفعّل دعم Plugins في Codex، ويعثر على Plugin ‏Codex
Computer Use المكوّن أو يثبّته، ويتحقق من توفر خادم MCP ‏`computer-use`، ثم
يترك لـ Codex امتلاك استدعاءات أدوات MCP الأصلية أثناء أدوار وضع Codex.

استخدم هذه الصفحة عندما يكون OpenClaw يستخدم بالفعل حزمة Codex الأصلية. لإعداد
وقت التشغيل نفسه، راجع [حزمة Codex](/ar/plugins/codex-harness).

## OpenClaw.app وPeekaboo

تكامل Peekaboo في OpenClaw.app منفصل عن Codex Computer Use. يمكن لتطبيق
macOS استضافة مقبس PeekabooBridge بحيث يستطيع CLI ‏`peekaboo` إعادة استخدام
منح التطبيق المحلية لإمكانية الوصول وتسجيل الشاشة لأدوات أتمتة Peekaboo
الخاصة. لا يثبّت ذلك الجسر Codex Computer Use ولا يعمل وكيلا له، كما أن
Codex Computer Use لا يستدعي عبر مقبس PeekabooBridge.

استخدم [جسر Peekaboo](/ar/platforms/mac/peekaboo) عندما تريد أن يكون OpenClaw.app
مضيفا واعيا بالأذونات لأتمتة Peekaboo CLI. استخدم هذه الصفحة عندما يجب أن
يتوفر Plugin ‏MCP الأصلي `computer-use` الخاص بـ Codex لوكيل OpenClaw في وضع
Codex قبل بدء الدور.

## تطبيق iOS

تطبيق iOS منفصل عن Codex Computer Use. فهو لا يثبّت خادم MCP ‏`computer-use`
الخاص بـ Codex ولا يعمل وكيلا له، وليس خلفية للتحكم بسطح المكتب. بدلا من ذلك،
يتصل تطبيق iOS كعقدة OpenClaw ويكشف إمكانات الهاتف عبر أوامر العقدة مثل
`canvas.*` و`camera.*` و`screen.*` و`location.*` و`talk.*`.

استخدم [iOS](/ar/platforms/ios) عندما تريد أن يقود وكيل عقدة iPhone عبر
Gateway. استخدم هذه الصفحة عندما يجب أن يتحكم وكيل في وضع Codex بسطح مكتب
macOS المحلي من خلال Plugin ‏Computer Use الأصلي الخاص بـ Codex.

## cua-driver MCP المباشر

Codex Computer Use ليس الطريقة الوحيدة لكشف التحكم بسطح المكتب. إذا كنت تريد
أن تستدعي أوقات التشغيل المُدارة من OpenClaw مشغل TryCua مباشرة، فاستخدم خادم
`cua-driver mcp` المنبع عبر سجل MCP في OpenClaw بدلا من تدفق السوق الخاص بـ
Codex.

بعد تثبيت `cua-driver`، إما أن تطلب منه أمر OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

أو تسجل خادم stdio بنفسك:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

يحافظ هذا المسار على سطح أدوات MCP المنبعي كما هو، بما في ذلك مخططات المشغل
واستجابات MCP المهيكلة. استخدمه عندما تريد أن يكون مشغل CUA متاحا كخادم MCP
عادي في OpenClaw. استخدم إعداد Codex Computer Use في هذه الصفحة عندما يجب أن
يمتلك Codex app-server تثبيت Plugin، وإعادة تحميل MCP، واستدعاءات الأدوات
الأصلية داخل أدوار وضع Codex.

مشغل CUA خاص بـ macOS وما زال يتطلب أذونات macOS المحلية التي يطلبها تطبيقه،
مثل إمكانية الوصول وتسجيل الشاشة. لا يثبّت OpenClaw ‏`cua-driver`، ولا يمنح
تلك الأذونات، ولا يتجاوز نموذج أمان المشغل المنبعي.

## الإعداد السريع

اضبط `plugins.entries.codex.config.computerUse` عندما يجب أن يتوفر
Computer Use لأدوار وضع Codex قبل بدء سلسلة محادثة. يفعّل `autoInstall: true`
خيار Computer Use ويسمح لـ OpenClaw بتثبيته أو إعادة تفعيله قبل الدور:

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

مع هذا الإعداد، يتحقق OpenClaw من Codex app-server قبل كل دور في وضع Codex.
إذا كان Computer Use مفقودا لكن Codex app-server اكتشف بالفعل سوقا قابلا
للتثبيت، يطلب OpenClaw من Codex app-server تثبيت Plugin أو إعادة تفعيله
وإعادة تحميل خوادم MCP. على macOS، عندما لا يكون أي سوق مطابق مسجلا وتوجد
حزمة تطبيق Codex القياسية، يحاول OpenClaw أيضا تسجيل سوق Codex المضمّن من
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` قبل أن
يفشل. إذا ظل الإعداد غير قادر على جعل خادم MCP متاحا، يفشل الدور قبل بدء
سلسلة المحادثة.

بعد تغيير إعداد Computer Use، استخدم `/new` أو `/reset` في الدردشة المتأثرة
قبل الاختبار إذا كانت سلسلة Codex موجودة قد بدأت بالفعل.

عند بدء stdio المُدار على macOS، يفضّل OpenClaw حزمة تطبيق Codex المكتبي
الموقعة في `/Applications/Codex.app/Contents/Resources/codex` عندما تكون
موجودة. يحافظ ذلك على Computer Use ضمن حزمة التطبيق التي تملك أذونات التحكم
بسطح المكتب المحلية. إذا لم يكن تطبيق سطح المكتب مثبتا، يرجع OpenClaw إلى
ثنائي Codex المُدار المثبت بجانب Plugin. إذا تمت تهيئة تطبيق سطح مكتب مثبت
بإصدار app-server غير مدعوم، يغلق OpenClaw ذلك الابن ويعيد المحاولة بمرشح
الثنائي المُدار التالي بدلا من السماح لتطبيق سطح مكتب قديم بحجب البديل المحلي
لـ Plugin. لا يزال إعداد `appServer.command` الصريح أو
`OPENCLAW_CODEX_APP_SERVER_BIN` يتجاوز هذا الاختيار المُدار.

## الأوامر

استخدم أوامر `/codex computer-use` من أي سطح دردشة يتوفر فيه سطح أوامر Plugin
‏`codex`. هذه أوامر دردشة/وقت تشغيل في OpenClaw، وليست أوامر CLI فرعية من
`openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` للقراءة فقط. لا يضيف مصادر سوق، ولا يثبّت Plugins، ولا يفعّل دعم
Plugins في Codex. إذا لم يفعل أي إعداد خيار Computer Use، فقد يبلغ `status`
أنه معطل حتى بعد أمر تثبيت لمرة واحدة.

يفعّل `install` دعم Plugins في Codex app-server، ويضيف اختياريا مصدر سوق
مكوّنا، ويثبّت أو يعيد تفعيل Plugin المكوّن عبر Codex app-server، ويعيد تحميل
خوادم MCP، ويتحقق من أن خادم MCP يكشف أدوات. لأن التثبيت يغير موارد مضيف
موثوقة، يمكن لمالك فقط أو عميل Gateway بصلاحية `operator.admin` تشغيل
`install`. يمكن للمرسلين الآخرين المصرح لهم الاستمرار في استخدام أمر `status`
للقراءة فقط، بما في ذلك مع التجاوزات.

## خيارات السوق

يستخدم OpenClaw واجهة API نفسها الخاصة بـ app-server التي يكشفها Codex نفسه.
تحدد حقول السوق أين يجب أن يجد Codex ‏`computer-use`.

| الحقل                | استخدمه عندما                                                        | دعم التثبيت                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| لا يوجد حقل سوق | تريد أن يستخدم Codex app-server الأسواق التي يعرفها بالفعل. | نعم، عندما يعيد app-server سوقا محليا.        |
| `marketplaceSource`  | لديك مصدر سوق Codex يمكن لـ app-server إضافته.         | نعم، لأمر `/codex computer-use install` الصريح.         |
| `marketplacePath`    | تعرف بالفعل مسار ملف السوق المحلي على المضيف.   | نعم، للتثبيت الصريح والتثبيت التلقائي عند بدء الدور.   |
| `marketplaceName`    | تريد تحديد سوق واحد مسجل بالفعل بالاسم.  | نعم فقط عندما يكون للسوق المحدد مسار محلي. |

قد تحتاج منازل Codex الجديدة إلى لحظة قصيرة لزرع أسواقها الرسمية. أثناء
التثبيت، يستطلع OpenClaw ‏`plugin/list` لمدة تصل إلى
`marketplaceDiscoveryTimeoutMs` ميلي ثانية. القيمة الافتراضية هي 60 ثانية.

إذا احتوت عدة أسواق معروفة على Computer Use، يفضّل OpenClaw
`openai-bundled`، ثم `openai-curated`، ثم `local`. تفشل المطابقات الغامضة غير
المعروفة بشكل مغلق وتطلب منك ضبط `marketplaceName` أو `marketplacePath`.

## سوق macOS المضمّن

تضمّن إصدارات Codex المكتبية الحديثة Computer Use هنا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

عندما يكون `computerUse.autoInstall` صحيحا ولا يكون أي سوق يحتوي
`computer-use` مسجلا، يحاول OpenClaw إضافة جذر السوق المضمّن القياسي تلقائيا:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

يمكنك أيضا تسجيله صراحة من الصدفة باستخدام Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

إذا كنت تستخدم مسار تطبيق Codex غير قياسي، فشغّل `/codex computer-use install
--source <marketplace-root>` مرة واحدة أو اضبط `computerUse.marketplacePath` إلى
مسار ملف سوق محلي. استخدم `--marketplace-path` فقط عندما يكون لديك مسار ملف
JSON للسوق، وليس جذر السوق المضمّن.

## حد الفهرس البعيد

يمكن لـ Codex app-server سرد وقراءة إدخالات الفهرس البعيدة فقط، لكنه لا يدعم
حاليا `plugin/install` البعيد. هذا يعني أن `marketplaceName` يمكنه تحديد سوق
بعيد فقط لفحوصات الحالة، لكن عمليات التثبيت وإعادة التفعيل لا تزال تحتاج إلى
سوق محلي عبر `marketplaceSource` أو `marketplacePath`.

إذا قالت الحالة إن Plugin متاح في سوق Codex بعيد لكن التثبيت البعيد غير
مدعوم، فشغّل التثبيت باستخدام مصدر أو مسار محلي:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## مرجع الإعداد

| الحقل                           | الافتراضي        | المعنى                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | مستنتج       | يتطلب Computer Use. يكون الافتراضي true عند ضبط حقل Computer Use آخر. |
| `autoInstall`                   | false          | يثبّت أو يعيد التفعيل من الأسواق المكتشفة بالفعل عند بدء الدور.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | مدة انتظار التثبيت لاكتشاف سوق Codex app-server.             |
| `marketplaceSource`             | غير مضبوط          | سلسلة المصدر الممررة إلى `marketplace/add` في Codex app-server.                    |
| `marketplacePath`               | غير مضبوط          | مسار ملف سوق Codex المحلي الذي يحتوي Plugin.                       |
| `marketplaceName`               | غير مضبوط          | اسم سوق Codex المسجل المطلوب تحديده.                                   |
| `pluginName`                    | `computer-use` | اسم Plugin في سوق Codex.                                                 |
| `mcpServerName`                 | `computer-use` | اسم خادم MCP الذي يكشفه Plugin المثبت.                               |

يرفض التثبيت التلقائي عند بدء الدور عمدا قيم `marketplaceSource` المكوّنة.
إضافة مصدر جديد عملية إعداد صريحة، لذا استخدم
`/codex computer-use install --source <marketplace-source>` مرة واحدة، ثم اترك
`autoInstall` يتولى عمليات إعادة التفعيل المستقبلية من الأسواق المحلية
المكتشفة. يمكن للتثبيت التلقائي عند بدء الدور استخدام `marketplacePath` مكوّن،
لأنه بالفعل مسار محلي على المضيف.

## ما يتحقق منه OpenClaw

يبلغ OpenClaw عن سبب إعداد ثابت داخليا وينسق الحالة الظاهرة للمستخدم للدردشة:

| السبب                       | المعنى                                                | الخطوة التالية                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | تم حل `computerUse.enabled` إلى false.               | عيّن `enabled` أو حقلاً آخر من حقول استخدام الكمبيوتر.  |
| `marketplace_missing`        | لم يكن هناك سوق مطابق متاح.                 | اضبط المصدر أو المسار أو اسم السوق.  |
| `plugin_not_installed`       | السوق موجود، لكن Plugin غير مثبت.   | شغّل التثبيت أو فعّل `autoInstall`.          |
| `plugin_disabled`            | Plugin مثبت لكنه معطّل في إعدادات Codex.      | شغّل التثبيت لإعادة تفعيله.                  |
| `remote_install_unsupported` | السوق المحدد يعمل عن بُعد فقط.                   | استخدم `marketplaceSource` أو `marketplacePath`. |
| `mcp_missing`                | Plugin مفعّل، لكن خادم MCP غير متاح.  | تحقق من استخدام الكمبيوتر في Codex وأذونات نظام التشغيل.  |
| `ready`                      | Plugin وأدوات MCP متاحة.                    | ابدأ دورة وضع Codex.                    |
| `check_failed`               | فشل طلب خادم تطبيق Codex أثناء فحص الحالة. | تحقق من اتصال خادم التطبيق والسجلات.       |
| `auto_install_blocked`       | سيحتاج إعداد بدء الدورة إلى إضافة مصدر جديد.       | شغّل التثبيت الصريح أولاً.                   |

يتضمن خرج الدردشة حالة Plugin، وحالة خادم MCP، والسوق، والأدوات
عند توفرها، والرسالة المحددة لخطوة الإعداد الفاشلة.

## أذونات macOS

استخدام الكمبيوتر خاص بـ macOS. قد يحتاج خادم MCP المملوك لـ Codex إلى أذونات
محلية من نظام التشغيل قبل أن يتمكن من فحص التطبيقات أو التحكم بها. إذا قال OpenClaw إن استخدام الكمبيوتر
مثبت لكن خادم MCP غير متاح، فتحقق أولاً من إعداد استخدام الكمبيوتر من جهة Codex:

- خادم تطبيق Codex يعمل على المضيف نفسه حيث ينبغي أن يحدث التحكم بسطح المكتب.
- Plugin استخدام الكمبيوتر مفعّل في إعدادات Codex.
- يظهر خادم MCP ‏`computer-use` في حالة MCP لخادم تطبيق Codex.
- منح macOS الأذونات المطلوبة لتطبيق التحكم بسطح المكتب.
- يمكن لجلسة المضيف الحالية الوصول إلى سطح المكتب الذي يتم التحكم به.

يفشل OpenClaw عمداً بإغلاق المسار عندما تكون `computerUse.enabled` تساوي true. ينبغي ألا
تتابع دورة وضع Codex بصمت من دون أدوات سطح المكتب الأصلية
التي تطلبها الإعداد.

## استكشاف الأخطاء وإصلاحها

**تقول الحالة إنه غير مثبت.** شغّل `/codex computer-use install`. إذا لم يتم
اكتشاف السوق، فمرّر `--source` أو `--marketplace-path`.

**تقول الحالة إنه مثبت لكنه معطّل.** شغّل `/codex computer-use install` مرة أخرى.
يكتب تثبيت خادم تطبيق Codex إعدادات Plugin مرة أخرى بوضع التفعيل.

**تقول الحالة إن التثبيت عن بُعد غير مدعوم.** استخدم مصدر سوق محلياً أو
مساراً. يمكن فحص إدخالات الفهرس التي تعمل عن بُعد فقط، لكن لا يمكن تثبيتها من خلال
واجهة API الحالية لخادم التطبيق.

**تقول الحالة إن خادم MCP غير متاح.** أعد تشغيل التثبيت مرة واحدة حتى تعيد خوادم MCP
التحميل. إذا ظل غير متاح، فأصلح تطبيق استخدام الكمبيوتر في Codex،
أو حالة MCP لخادم تطبيق Codex، أو أذونات macOS.

**تنتهي مهلة الحالة أو اختبار على `computer-use.list_apps`.** Plugin وخادم MCP
موجودان، لكن جسر استخدام الكمبيوتر المحلي لم يرد. أغلق أو
أعد تشغيل استخدام الكمبيوتر في Codex، وأعد تشغيل Codex Desktop إذا لزم الأمر، ثم أعد المحاولة في
جلسة OpenClaw جديدة. إذا كان المضيف قد شغّل سابقاً استخدام الكمبيوتر من خلال خادم تطبيق Codex مُدار
أقدم، فحدّث Plugin المثبت من السوق المضمّن مع تطبيق سطح المكتب:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**تقول أداة استخدام الكمبيوتر `Native hook relay unavailable`.** تعذر على خطاف الأداة الأصلي في Codex
الوصول إلى ترحيل OpenClaw نشط عبر الجسر المحلي أو
رجوع Gateway. ابدأ جلسة OpenClaw جديدة باستخدام `/new` أو `/reset`. إذا
عمل مرة واحدة ثم فشل مرة أخرى عند استدعاء أداة لاحق، فإن `/new` يمسح
المحاولة الحالية فقط؛ أعد تشغيل خادم تطبيق Codex أو OpenClaw Gateway حتى تُسقط المسارات القديمة
وتسجيلات الخطافات، ثم أعد المحاولة في جلسة جديدة.

**يرفض التثبيت التلقائي عند بدء الدورة مصدراً.** هذا مقصود. أضف
المصدر باستخدام `/codex computer-use install --source <marketplace-source>`
الصريح أولاً، وبعد ذلك يمكن للتثبيت التلقائي عند بدء الدورات المستقبلية استخدام
السوق المحلي المكتشف.

## ذو صلة

- [تسخير Codex](/ar/plugins/codex-harness)
- [جسر Peekaboo](/ar/platforms/mac/peekaboo)
- [تطبيق iOS](/ar/platforms/ios)

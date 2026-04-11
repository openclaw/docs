---
read_when:
    - إضافة أتمتة متصفح يتحكم بها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المدمجة في المتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-11T02:48:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: da6fed36a6f40a50e825f90e5616778954545bd7e52397f7e088b85251ee024f
    source_path: tools/browser.md
    workflow: 15
---

# المتصفح (بإدارة openclaw)

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (على local loopback فقط).

عرض للمبتدئين:

- فكّر فيه على أنه **متصفح منفصل خاص بالوكيل فقط**.
- لا يلمس ملف التعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات تبويب وقراءة الصفحات والنقر والكتابة** ضمن مسار آمن.
- يرتبط ملف التعريف المدمج `user` بجلسة Chrome الحقيقية المسجّل الدخول فيها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بلون برتقالي افتراضيًا).
- تحكم حتمي بعلامات التبويب (عرض/فتح/تركيز/إغلاق).
- إجراءات الوكيل (النقر/الكتابة/السحب/الاختيار)، وsnapshots، ولقطات الشاشة، وملفات PDF.
- دعم اختياري لملفات تعريف متعددة (`openclaw` و`work` و`remote` ...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## بدء سريع

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة “Browser disabled”، ففعّله في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو إذا أخبرك الوكيل بأن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح المفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم عبر plugin

أصبحت أداة `browser` الافتراضية الآن plugin مجمّعًا يُشحن
مفعّلًا افتراضيًا. وهذا يعني أنه يمكنك تعطيله أو استبداله من دون إزالة بقية
نظام plugin في OpenClaw:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

عطّل plugin المجمّع قبل تثبيت plugin آخر يوفّر اسم الأداة `browser`
نفسه. تتطلب تجربة المتصفح الافتراضية الأمرين التاليين:

- ألا تكون `plugins.entries.browser.enabled` معطلة
- وأن تكون `browser.enabled=true`

إذا عطّلت plugin فقط، فسيختفي معًا CLI المتصفح المجمّع (`openclaw browser`)،
وطريقة gateway (`browser.request`)، وأداة الوكيل، وخدمة التحكم الافتراضية في المتصفح.
وستبقى إعدادات `browser.*` كما هي كي يعيد plugin بديل استخدامها.

يملك plugin المتصفح المجمّع الآن أيضًا تنفيذ وقت تشغيل المتصفح.
وتحتفظ النواة فقط بمساعدات Plugin SDK المشتركة بالإضافة إلى إعادة تصدير توافقية لمسارات الاستيراد الداخلية القديمة. عمليًا، فإن إزالة حزمة plugin المتصفح أو استبدالها يزيل مجموعة ميزات المتصفح بدلًا من ترك تنفيذ ثانٍ مملوكًا للنواة.

ما تزال تغييرات إعدادات المتصفح تتطلب إعادة تشغيل Gateway حتى يتمكن plugin المجمّع
من إعادة تسجيل خدمة المتصفح بإعداداته الجديدة.

## أمر أو أداة المتصفح المفقودة

إذا أصبح `openclaw browser` فجأة أمرًا غير معروف بعد ترقية، أو
أبلغ الوكيل أن أداة المتصفح مفقودة، فالسبب الأكثر شيوعًا هو وجود قائمة
`plugins.allow` تقييدية لا تتضمن `browser`.

مثال على إعداد معطّل:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

أصلحه بإضافة `browser` إلى قائمة السماح الخاصة بالـ plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

ملاحظات مهمة:

- لا يكفي `browser.enabled=true` وحده عند ضبط `plugins.allow`.
- ولا يكفي `plugins.entries.browser.enabled=true` وحده أيضًا عند ضبط `plugins.allow`.
- إن `tools.alsoAllow: ["browser"]` **لا** يحمّل plugin المتصفح المجمّع. فهو يضبط فقط سياسة الأدوات بعد أن يكون plugin قد حُمّل بالفعل.
- إذا لم تكن بحاجة إلى قائمة سماح تقييدية للـ plugin، فإن إزالة `plugins.allow` تعيد أيضًا سلوك المتصفح المجمّع الافتراضي.

الأعراض المعتادة:

- يكون `openclaw browser` أمرًا غير معروف.
- تكون `browser.request` مفقودة.
- يبلغ الوكيل أن أداة المتصفح غير متاحة أو مفقودة.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يحتاج إلى إضافة).
- `user`: ملف تعريف مدمج للارتباط بـ Chrome MCP لجلسة **Chrome الحقيقية المسجّل الدخول فيها**.

بالنسبة إلى استدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدام المتصفح المعزول `openclaw`.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجّل الدخول فيها مهمة ويكون المستخدم
  موجودًا أمام الكمبيوتر للنقر/الموافقة على أي مطالبة ارتباط.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا أردت الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // فعّل هذا فقط عند الثقة المتعمدة في الوصول إلى الشبكة الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم أحادي الملف التعريفي
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيد (بالملي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيد (بالملي ثانية)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

ملاحظات:

- ترتبط خدمة التحكم في المتصفح بـ local loopback على منفذ مشتق من `gateway.port`
  (الافتراضي: `18791`، أي gateway + 2).
- إذا تجاوزت منفذ Gateway (`gateway.port` أو `OPENCLAW_GATEWAY_PORT`)،
  فإن منافذ المتصفح المشتقة تتحرك للحفاظ على البقاء ضمن “العائلة” نفسها.
- تكون القيمة الافتراضية لـ `cdpUrl` هي منفذ CDP المحلي المُدار عند عدم ضبطه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات الوصول إلى CDP البعيد (غير local loopback).
- ينطبق `remoteCdpHandshakeTimeoutMs` على فحوصات الوصول إلى WebSocket الخاصة بـ CDP البعيد.
- يخضع التنقل/فتح علامة تبويب في المتصفح لحماية SSRF قبل التنقل، ويُعاد التحقق منه بأفضل جهد على عنوان URL النهائي لـ `http(s)` بعد التنقل.
- في وضع SSRF الصارم، تُفحَص أيضًا عمليات اكتشاف/استطلاع نقاط نهاية CDP البعيدة (`cdpUrl`، بما في ذلك عمليات البحث عن `/json/version`).
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا. اضبطها على `true` فقط عندما تثق عمدًا في الوصول إلى المتصفح عبر الشبكة الخاصة.
- ما يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم للتوافق.
- تعني `attachOnly: true`: “لا تطلق متصفحًا محليًا مطلقًا؛ ارتبط به فقط إذا كان يعمل بالفعل.”
- تضفي `color` و`color` الخاصة بكل ملف تعريف لونًا على UI المتصفح حتى تتمكن من معرفة الملف التعريفي النشط.
- ملف التعريف الافتراضي هو `openclaw` (متصفح مستقل مُدار بواسطة OpenClaw). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم المسجّل الدخول فيه.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا فـ Chrome → Brave → Edge → Chromium → Chrome Canary.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا — لا تضبطهما إلا لـ CDP البعيد.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا
  تضبط `cdpUrl` مع هذا المشغّل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب على ملف تعريف existing-session
  الارتباط بملف تعريف مستخدم Chromium غير افتراضي مثل Brave أو Edge.

## استخدام Brave (أو متصفح آخر مبني على Chromium)

إذا كان متصفحك **الافتراضي في النظام** مبنيًا على Chromium (Chrome/Brave/Edge/إلخ)،
فسيستخدمه OpenClaw تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي:

مثال CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## التحكم المحلي مقابل البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم على local loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف node):** شغّل مضيف node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يقوم OpenClaw بتشغيل متصفح محلي.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يؤدي `openclaw browser stop` إلى إيقاف عملية المتصفح التي
  شغّلها OpenClaw
- ملفات attach-only وCDP البعيدة: يؤدي `openclaw browser stop` إلى إغلاق
  جلسة التحكم النشطة وتحرير تجاوزات محاكاة Playwright/CDP (منفذ العرض،
  ونظام الألوان، والإعدادات المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، وما شابه
  ذلك من الحالة)، رغم أن OpenClaw لم يشغّل أي عملية متصفح

يمكن أن تتضمن عناوين URL لـ CDP البعيد مصادقة:

- رموزًا مميزة في الاستعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على بيانات المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ WebSocket الخاص بـ CDP. ويفضَّل استخدام متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من حفظها في ملفات الإعدادات.

## وكيل متصفح node (إعداد صفري افتراضي)

إذا كنت تشغّل **مضيف node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى ذلك المضيف من دون أي إعدادات متصفح إضافية.
وهذا هو المسار الافتراضي للـ gateways البعيدة.

ملاحظات:

- يعرض مضيف node خادم التحكم المحلي في المتصفح عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالعقدة نفسها (كما في الوضع المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للحصول على السلوك القديم/الافتراضي: تبقى جميع ملفات التعريف المهيأة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، فإن OpenClaw يعامله كحد أقل الصلاحيات: لا يمكن استهداف إلا ملفات التعريف المدرجة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا لم تكن تريده:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) خدمة Chromium مستضافة تكشف
عناوين اتصال CDP عبر HTTPS وWebSocket. ويمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة إلى ملف تعريف متصفح بعيد فإن أبسط خيار هو عنوان WebSocket المباشر
من وثائق الاتصال الخاصة بـ Browserless.

مثال:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

ملاحظات:

- استبدل `<BROWSERLESS_API_KEY>` برمز Browserless الحقيقي الخاص بك.
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless الخاص بك (راجع وثائقهم).
- إذا منحك Browserless عنوان HTTPS أساسيًا، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الإبقاء على عنوان HTTPS ودع OpenClaw
  يكتشف `/json/version`.

## مزودو CDP عبر WebSocket المباشر

تكشف بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المعتمد على HTTP (`/json/version`). يدعم OpenClaw كلاهما:

- **نقاط نهاية HTTP(S)** — يستدعي OpenClaw المسار `/json/version` لاكتشاف
  عنوان WebSocket الخاص بالمصحح، ثم يتصل به.
- **نقاط نهاية WebSocket** (`ws://` / `wss://`) — يتصل OpenClaw مباشرةً،
  متجاوزًا `/json/version`. استخدم هذا مع خدمات مثل
  [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)، أو أي مزود يمنحك
  عنوان WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
المتصفحات عديمة الواجهة مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء residential.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

ملاحظات:

- [أنشئ حسابًا](https://www.browserbase.com/sign-up) وانسخ **مفتاح API**
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذلك
  لا حاجة إلى خطوة إنشاء جلسة يدويًا.
- تسمح الخطة المجانية بجلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للاطلاع على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم في المتصفح يقتصر على local loopback؛ ويمر الوصول عبر مصادقة Gateway أو اقتران العقدة.
- يستخدم HTTP API المستقل للمتصفح على local loopback **مصادقة السر المشترك فقط**:
  مصادقة bearer لرمز gateway، أو `x-openclaw-password`، أو HTTP Basic auth مع
  كلمة مرور gateway المهيأة.
- لا تقوم رؤوس هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"`
  بمصادقة HTTP API المستقل لهذا المتصفح على local loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم تُهيأ أي مصادقة سر مشترك، فسيقوم OpenClaw
  بإنشاء `gateway.auth.token` تلقائيًا عند بدء التشغيل وحفظه في الإعدادات.
- لا يُنشئ OpenClaw ذلك الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات عقد على شبكة خاصة (Tailscale)؛ وتجنب تعريضها للعامة.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد باعتبارها أسرارًا؛ ويفضل استخدام متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفّرة (HTTPS أو WSS) والرموز قصيرة العمر متى أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرةً في ملفات الإعدادات.

## ملفات التعريف (متصفحات متعددة)

يدعم OpenClaw ملفات تعريف مسماة متعددة (إعدادات التوجيه). ويمكن أن تكون ملفات التعريف:

- **بإدارة openclaw**: نسخة متصفح مخصصة مبنية على Chromium مع دليل بيانات مستخدم خاص بها + منفذ CDP
- **بعيدة**: عنوان URL صريح لـ CDP (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي الخاص بك عبر الاتصال التلقائي لـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يتم إنشاء ملف التعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- ملف التعريف `user` مدمج للارتباط بجلسة موجودة عبر Chrome MCP.
- ملفات تعريف الجلسة الموجودة اختيارية بخلاف `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصَّص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## الجلسة الموجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح Chromium-based قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. ويؤدي هذا إلى إعادة استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح هذا.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المدمج:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا خاصًا بك إذا كنت تريد
اسمًا مختلفًا أو لونًا مختلفًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف التعريف المدمج `user` الاتصال التلقائي عبر Chrome MCP، والذي يستهدف
  ملف تعريف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` مع Brave أو Edge أو Chromium أو ملف تعريف Chrome غير افتراضي:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

ثم في المتصفح المطابق:

1. افتح صفحة الفحص الخاصة بذلك المتصفح لتصحيح الأخطاء عن بُعد.
2. فعّل تصحيح الأخطاء عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرتبط OpenClaw.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار smoke للارتباط المباشر:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

كيف يبدو النجاح:

- يعرض `status` القيمة `driver: existing-session`
- يعرض `status` القيمة `transport: chrome-mcp`
- يعرض `status` القيمة `running: true`
- يعرض `tabs` علامات التبويب المفتوحة بالفعل في المتصفح
- يعرض `snapshot` مراجع من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم يعمل الارتباط:

- أن يكون المتصفح المستهدف المبني على Chromium بالإصدار `144+`
- أن يكون تصحيح الأخطاء عن بُعد مفعّلًا في صفحة الفحص الخاصة بذلك المتصفح
- أن المتصفح عرض مطالبة موافقة الارتباط وأنك قبلتها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على الإضافة ويتحقق من
  أن Chrome مثبت محليًا لملفات تعريف الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل تصحيح الأخطاء عن بُعد من جهة المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح الخاصة بالمستخدم والمسجّل الدخول فيها.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرر اسم ملف التعريف الصريح هذا.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على
  مطالبة الارتباط.
- يمكن لـ Gateway أو مضيف العقدة تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى خطورة من ملف التعريف المعزول `openclaw` لأنه يمكن أن
  يتصرف داخل جلسة المتصفح المسجّل الدخول فيها.
- لا يشغّل OpenClaw المتصفح لهذا المشغّل؛ بل يرتبط بجلسة
  موجودة فقط.
- يستخدم OpenClaw هنا تدفق `--autoConnect` الرسمي لـ Chrome DevTools MCP. وإذا
  كان `userDataDir` مضبوطًا، فإن OpenClaw يمرره لاستهداف
  دليل بيانات مستخدم Chromium الصريح ذلك.
- تدعم لقطات الشاشة في existing-session التقاط الصفحة والتقاط العناصر عبر `--ref`
  من snapshots، لكنها لا تدعم محددات CSS عبر `--element`.
- تعمل لقطات شاشة الصفحة في existing-session من دون Playwright عبر Chrome MCP.
  كما تعمل لقطات العناصر المرجعية (`--ref`) هناك أيضًا، لكن لا يمكن الجمع بين `--full-page`
  و`--ref` أو `--element`.
- ما تزال إجراءات existing-session أكثر محدودية من
  مسار المتصفح المُدار:
  - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select`
    مراجع snapshot بدلًا من محددات CSS
  - `click` يقتصر على الزر الأيسر فقط (من دون تجاوزات للأزرار أو modifiers)
  - `type` لا يدعم `slowly=true`؛ استخدم `fill` أو `press`
  - `press` لا يدعم `delayMs`
  - لا تدعم `hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate`
    تجاوزات المهلة لكل استدعاء
  - يدعم `select` حاليًا قيمة واحدة فقط
- يدعم `wait --url` في existing-session الأنماط الدقيقة والجزئية وأنماط glob
  مثل برامج تشغيل المتصفح الأخرى. أما `wait --load networkidle` فغير مدعوم بعد.
- تتطلب hooks الرفع في existing-session `ref` أو `inputRef`، وتدعم ملفًا واحدًا
  في كل مرة، ولا تدعم استهداف CSS عبر `element`.
- لا تدعم hooks مربعات الحوار في existing-session تجاوزات المهلة.
- ما تزال بعض الميزات تتطلب مسار المتصفح المُدار، بما في ذلك
  إجراءات الدُفعات، وتصدير PDF، واعتراض التنزيلات، و`responsebody`.
- إن existing-session محلي للمضيف. فإذا كان Chrome موجودًا على جهاز آخر أو
  ضمن مساحة اسم شبكة مختلفة، فاستخدم CDP البعيد أو مضيف عقدة بدلًا من ذلك.

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف تعريف متصفحك الشخصي مطلقًا.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارض مع تدفقات العمل التطويرية.
- **تحكم حتمي بعلامات التبويب**: استهدف علامات التبويب عبر `targetId`، وليس “آخر علامة تبويب”.

## اختيار المتصفح

عند التشغيل محليًا، يختار OpenClaw أول متصفح متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز باستخدام `browser.executablePath`.

المنصات:

- macOS: يتحقق من `/Applications` و`~/Applications`.
- Linux: يبحث عن `google-chrome` و`brave` و`microsoft-edge` و`chromium` وغيرها.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## Control API (اختياري)

للتكاملات المحلية فقط، يعرّض Gateway HTTP API صغيرًا على local loopback:

- الحالة/البدء/الإيقاف: `GET /` و`POST /start` و`POST /stop`
- علامات التبويب: `GET /tabs` و`POST /tabs/open` و`POST /tabs/focus` و`DELETE /tabs/:targetId`
- snapshot/لقطة الشاشة: `GET /snapshot` و`POST /screenshot`
- الإجراءات: `POST /navigate` و`POST /act`
- hooks: `POST /hooks/file-chooser` و`POST /hooks/dialog`
- التنزيلات: `POST /download` و`POST /wait/download`
- تصحيح الأخطاء: `GET /console` و`POST /pdf`
- تصحيح الأخطاء: `GET /errors` و`GET /requests` و`POST /trace/start` و`POST /trace/stop` و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies` و`POST /cookies/set` و`POST /cookies/clear`
- الحالة: `GET /storage/:kind` و`POST /storage/:kind/set` و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline` و`POST /set/headers` و`POST /set/credentials` و`POST /set/geolocation` و`POST /set/media` و`POST /set/timezone` و`POST /set/locale` و`POST /set/device`

تقبل جميع نقاط النهاية `?profile=<name>`.

إذا كانت مصادقة gateway بالسر المشترك مهيأة، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام كلمة المرور هذه

ملاحظات:

- لا يستهلك Browser API المستقل هذا على local loopback وضع trusted-proxy أو
  رؤوس هوية Tailscale Serve.
- إذا كانت قيمة `gateway.auth.mode` هي `none` أو `trusted-proxy`، فإن مسارات المتصفح هذه على local loopback
  لا ترث أوضاع الهوية تلك؛ لذا أبقها على local loopback فقط.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ منظمة لإخفاقات التحقق والسياسات
على مستوى المسار:

```json
{ "error": "<message>", "code": "ACT_*" }
```

القيم الحالية لـ `code`:

- `ACT_KIND_REQUIRED` ‏(HTTP 400): الحقل `kind` مفقود أو غير معروف.
- `ACT_INVALID_REQUEST` ‏(HTTP 400): فشل تطبيع حمولة الإجراء أو التحقق منها.
- `ACT_SELECTOR_UNSUPPORTED` ‏(HTTP 400): استُخدم `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` ‏(HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` ‏(HTTP 403): يتعارض `targetId` ذي المستوى الأعلى أو المجمع مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` ‏(HTTP 501): الإجراء غير مدعوم لملفات تعريف existing-session.

قد تعيد إخفاقات وقت التشغيل الأخرى أيضًا `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات Playwright. إذا لم يكن Playwright مثبتًا، فستعيد
نقاط النهاية تلك خطأ 501 واضحًا.

ما الذي ما يزال يعمل من دون Playwright:

- ARIA snapshots
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket
  الخاص بـ CDP لكل علامة تبويب متاحًا
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات الشاشة المستندة إلى `--ref` في `existing-session` من ناتج snapshot

ما الذي ما يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- لقطات شاشة العناصر عبر محددات CSS (`--element`)
- تصدير PDF الكامل للمتصفح

كما ترفض لقطات شاشة العناصر أيضًا `--full-page`؛ إذ يعيد المسار الرسالة `fullPage is
not supported for element screenshots`.

إذا ظهرت لك الرسالة `Playwright is not available in this gateway build`، فثبّت
حزمة Playwright الكاملة (وليس `playwright-core`) ثم أعد تشغيل gateway، أو أعد تثبيت
OpenClaw مع دعم المتصفح.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل داخل Docker، فتجنب `npx playwright` (بسبب تعارضات npm override).
واستخدم CLI المضمن بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` (مثلًا،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` محفوظ عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

التدفق عالي المستوى:

- يقبل **خادم تحكم** صغير طلبات HTTP.
- ويتصل بالمتصفحات المبنية على Chromium (Chrome/Brave/Edge/Chromium) عبر **CDP**.
- وللإجراءات المتقدمة (النقر/الكتابة/snapshot/PDF)، يستخدم **Playwright** فوق
  CDP.
- وعندما يكون Playwright مفقودًا، لا تتوفر إلا العمليات التي لا تعتمد على Playwright.

يبقي هذا التصميم الوكيل على واجهة مستقرة وحتمية مع السماح لك
بتبديل المتصفحات والملفات التعريفية المحلية/البعيدة.

## مرجع CLI السريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد.
كما تقبل جميع الأوامر `--json` للحصول على مخرجات قابلة للقراءة آليًا (بحمولات مستقرة).

الأساسيات:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

الفحص:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

ملاحظة حول دورة الحياة:

- بالنسبة إلى ملفات التعريف attach-only وCDP البعيدة، يظل `openclaw browser stop`
  هو أمر التنظيف الصحيح بعد الاختبارات. فهو يغلق جلسة التحكم النشطة
  ويمسح تجاوزات المحاكاة المؤقتة بدلًا من إنهاء
  المتصفح الأساسي.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

الإجراءات:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

الحالة:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

ملاحظات:

- إن `upload` و`dialog` استدعاءات **تهيئة مسبقة**؛ شغّلهما قبل النقر/الضغط
  الذي يؤدي إلى فتح محدد الملفات/مربع الحوار.
- تُقيَّد مسارات إخراج التنزيل والتتبع بجذور temp الخاصة بـ OpenClaw:
  - التتبعات: `/tmp/openclaw` (الرجوع إلى: `${os.tmpdir()}/openclaw`)
  - التنزيلات: `/tmp/openclaw/downloads` (الرجوع إلى: `${os.tmpdir()}/openclaw/downloads`)
- تُقيَّد مسارات الرفع بجذر رفع temp خاص بـ OpenClaw:
  - الرفع: `/tmp/openclaw/uploads` (الرجوع إلى: `${os.tmpdir()}/openclaw/uploads`)
- يمكن لـ `upload` أيضًا ضبط مدخلات الملفات مباشرةً عبر `--input-ref` أو `--element`.
- `snapshot`:
  - `--format ai` (الافتراضي عند تثبيت Playwright): يعيد AI snapshot مع مراجع رقمية (`aria-ref="<n>"`).
  - `--format aria`: يعيد شجرة إمكانية الوصول (من دون مراجع؛ للفحص فقط).
  - `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط لـ role snapshot (تفاعلي + مضغوط + عمق + `maxChars` أقل).
  - الإعداد الافتراضي في التهيئة (للأداة/CLI فقط): اضبط `browser.snapshotDefaults.mode: "efficient"` لاستخدام snapshots الفعّالة عندما لا يمرر المستدعي وضعًا (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
  - تفرض خيارات role snapshot (`--interactive` و`--compact` و`--depth` و`--selector`) role snapshot مع مراجع مثل `ref=e12`.
  - يقيّد `--frame "<iframe selector>"` role snapshots إلى iframe (ويقترن بمراجع role مثل `e12`).
  - ينتج `--interactive` قائمة مسطحة وسهلة الاختيار للعناصر التفاعلية (وهو الأفضل لتوجيه الإجراءات).
  - يضيف `--labels` لقطة شاشة للمنفذ الظاهر فقط مع تسميات refs متراكبة (ويطبع `MEDIA:<path>`).
- تتطلب `click`/`type`/إلخ قيمة `ref` من `snapshot` (إما رقمية `12` أو role ref مثل `e12`).
  ومحددات CSS غير مدعومة عمدًا للإجراءات.

## snapshots وrefs

يدعم OpenClaw نمطين من “snapshot”:

- **AI snapshot (مراجع رقمية)**: `openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - الناتج: snapshot نصي يتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12` و`openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` الخاصة بـ Playwright.

- **Role snapshot (مراجع role مثل `e12`)**: ‏`openclaw browser snapshot --interactive` (أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - الناتج: قائمة/شجرة قائمة على role تتضمن `[ref=e12]` (و`[nth=1]` اختياريًا).
  - الإجراءات: `openclaw browser click e12` و`openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` (بالإضافة إلى `nth()` للتكرارات).
  - أضف `--labels` لتضمين لقطة شاشة للمنفذ الظاهر مع تسميات `e12` متراكبة.

سلوك المراجع:

- إن refs **ليست مستقرة عبر التنقلات**؛ وإذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم ref جديدًا.
- إذا أُخذ role snapshot باستخدام `--frame`، فسيتم تقييد role refs بذلك iframe حتى role snapshot التالي.

## تحسينات `wait`

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- الانتظار لعنوان URL (مع دعم glob من Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لشرط JavaScript:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدد مرئيًا:
  - `openclaw browser wait "#main"`

يمكن الجمع بينها:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## تدفقات تصحيح الأخطاء

عندما يفشل إجراء ما (مثل “not visible” أو “strict mode violation” أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (وفضّل role refs في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما الذي يستهدفه Playwright
4. إذا كانت الصفحة تتصرف بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. لتصحيح أعمق: سجّل تتبعًا:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

`--json` مخصص للبرمجة النصية والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON قيمة `refs` بالإضافة إلى كتلة `stats` صغيرة (الأسطر/الأحرف/المراجع/العناصر التفاعلية) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## عناصر التحكم في الحالة والبيئة

هذه مفيدة لتدفقات “اجعل الموقع يتصرف مثل X”:

- ملفات تعريف الارتباط: `cookies` و`cookies set` و`cookies clear`
- التخزين: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` (ما يزال الشكل القديم `set headers --json '{"X-Debug":"1"}'` مدعومًا)
- مصادقة HTTP basic: ‏`set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / الإعدادات المحلية: `set timezone ...` و`set locale ...`
- الجهاز / منفذ العرض:
  - `set device "iPhone 14"` (إعدادات Playwright المسبقة للأجهزة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل الدخول فيها؛ لذا تعامل معه على أنه حساس.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript عشوائيًا في سياق الصفحة. ويمكن لـ prompt injection توجيه
  ذلك. عطّله باستخدام `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- بالنسبة إلى ملاحظات تسجيل الدخول ومكافحة الروبوتات (X/Twitter، إلخ)، راجع [تسجيل الدخول في المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/مضيف العقدة خاصًا (على local loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ لذا قم بتمريرها وحمايتها.

مثال على الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // السماح المطابق التام اختياري
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

بالنسبة إلى المشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

وبالنسبة إلى إعدادات المضيف المنقسم بين WSL2 Gateway وWindows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## أدوات الوكيل + كيف يعمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — الحالة/البدء/الإيقاف/علامات التبويب/الفتح/التركيز/الإغلاق/snapshot/لقطة الشاشة/التنقل/الإجراء

كيفية الربط:

- يعيد `browser snapshot` شجرة UI مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من snapshot للنقر/الكتابة/السحب/الاختيار.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة أو عنصرًا).
- تقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمّى (openclaw أو chrome أو CDP بعيد).
  - `target` ‏(`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذفت قيمة `target`: تكون القيمة الافتراضية في الجلسات المعزولة `sandbox`، وفي الجلسات غير المعزولة `host`.
  - إذا كانت هناك عقدة متصلة تدعم المتصفح، فقد تُوجَّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

وهذا يحافظ على حتمية الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وتقويته

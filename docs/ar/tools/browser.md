---
read_when:
    - إضافة أتمتة متصفح يتحكم فيها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المدمجة في المتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **ملف تعريف Chrome/Brave/Edge/Chromium مخصص** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي ويُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway (local loopback فقط).

عرض للمبتدئين:

- اعتبره **متصفحًا منفصلًا مخصصًا للوكيل فقط**.
- ملف التعريف `openclaw` **لا** يلمس ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات التبويب وقراءة الصفحات والنقر والكتابة** ضمن مسار آمن.
- يرتبط ملف التعريف `user` المضمّن بجلسة Chrome الحقيقية المسجّل دخولك إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (عرض/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات حالة، ولقطات شاشة، وملفات PDF.
- دعم اختياري لعدة ملفات تعريف (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر المتصفح أو الأداة مفقود](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مضمّن. عطّلها لاستبدالها بـ Plugin آخر يسجّل اسم أداة `browser` نفسه:

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

تتطلب الإعدادات الافتراضية كلاً من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. يؤدي تعطيل Plugin فقط إلى إزالة CLI ‏`openclaw browser` وطريقة Gateway ‏`browser.request` وأداة الوكيل وخدمة التحكم كوحدة واحدة؛ بينما تبقى إعدادات `browser.*` لديك كما هي لاستخدام بديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى يتمكن Plugin من إعادة تسجيل خدمته.

## أمر المتصفح أو الأداة مفقود

إذا كان `openclaw browser` غير معروف بعد الترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو وجود قائمة `plugins.allow` لا تتضمن `browser`. أضِفه:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تُعد `browser.enabled=true` و`plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` بدائل للوجود في قائمة السماح — إذ تتحكم قائمة السماح في تحميل Plugin، ولا تُطبَّق سياسة الأدوات إلا بعد التحميل. كما أن إزالة `plugins.allow` بالكامل تعيد السلوك الافتراضي أيضًا.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف إرفاق Chrome MCP مضمّن لجلسة **Chrome الحقيقية المسجّل دخولك إليها**
  الخاصة بك.

لاستدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجّل الدخول إليها مهمة ويكون المستخدم
  موجودًا أمام الكمبيوتر للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعداد

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط عند الوثوق المقصود بالوصول إلى الشبكة الخاصة
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم لملف تعريف واحد
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيد (مللي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيد (مللي ثانية)
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

<AccordionGroup>

<Accordion title="المنافذ وإمكانية الوصول">

- ترتبط خدمة التحكم بـ local loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى نقل المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ اضبط هذه القيم فقط لـ CDP البعيد. تكون القيمة الافتراضية لـ `cdpUrl` هي منفذ CDP المحلي المُدار عند عدم ضبطها.
- تنطبق `remoteCdpTimeoutMs` على فحوص إمكانية الوصول عبر HTTP لـ CDP البعيد (غير loopback)؛ وتنطبق `remoteCdpHandshakeTimeoutMs` على مصافحات WebSocket لـ CDP البعيد.

</Accordion>

<Accordion title="سياسة SSRF">

- تتم حماية التنقل في المتصفح وفتح علامة التبويب من SSRF قبل التنقل، وتُعاد أفضل محاولة للتحقق من عنوان URL النهائي من نوع `http(s)` بعد ذلك.
- في وضع SSRF الصارم، يتم أيضًا التحقق من اكتشاف نقطة نهاية CDP البعيدة واستقصاءات `/json/version` (`cdpUrl`).
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا؛ فعّلها فقط عندما يكون الوصول إلى المتصفح على الشبكة الخاصة موثوقًا عن قصد.
- لا يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.

</Accordion>

<Accordion title="سلوك ملفات التعريف">

- تعني `attachOnly: true` عدم تشغيل متصفح محلي مطلقًا؛ بل الإرفاق فقط إذا كان أحدها يعمل بالفعل.
- يقوم `color` (على المستوى الأعلى ولكل ملف تعريف) بتلوين واجهة المتصفح حتى تتمكن من رؤية الملف النشط.
- ملف التعريف الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجّل الدخول.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان قائمًا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` لهذا المشغّل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب على ملف تعريف existing-session الإرفاق بملف تعريف مستخدم Chromium غير افتراضي (Brave أو Edge أو غيرهما).

</Accordion>

</AccordionGroup>

## استخدام Brave (أو متصفح آخر قائم على Chromium)

إذا كان متصفحك **الافتراضي على النظام** قائمًا على Chromium ‏(Chrome/Brave/Edge/إلخ)،
فإن OpenClaw يستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

أو اضبطه في الإعدادات بحسب المنصة:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## التحكم المحلي مقابل البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم على loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الإرفاق بمتصفح بعيد قائم على Chromium. في هذه الحالة، لن يقوم OpenClaw بتشغيل متصفح محلي.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يؤدي `openclaw browser stop` إلى إيقاف عملية المتصفح التي
  أطلقها OpenClaw
- ملفات التعريف attach-only وCDP البعيد: يؤدي `openclaw browser stop` إلى إغلاق جلسة
  التحكم النشطة وتحرير تجاوزات محاكاة Playwright/CDP (منفذ العرض،
  ونظام الألوان، والإعدادات المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، والحالة المشابهة)، حتى
  وإن لم يكن OpenClaw قد أطلق أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد معلومات مصادقة:

- رموز استعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ WebSocket الخاص بـ CDP. فضّل متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من تثبيتها في ملفات الإعداد.

## وكيل متصفح Node (افتراضي بدون إعداد)

إذا كنت تشغّل **مضيف Node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى ذلك المضيف دون أي إعداد إضافي للمتصفح.
وهذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يكشف مضيف Node خادم التحكم المحلي في المتصفح عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعداد `browser.profiles` الخاص بالعقدة نفسها (كما هو الحال محليًا).
- تكون `nodeHost.browserProxy.allowProfiles` اختيارية. اتركها فارغة للسلوك القديم/الافتراضي: تظل جميع ملفات التعريف المهيأة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، فسيعاملها OpenClaw كحد أقل امتيازًا: لا يمكن استهداف إلا ملفات التعريف الموجودة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّلها إذا كنت لا تريدها:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تكشف
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
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
- اختر نقطة نهاية المنطقة المطابقة لحساب Browserless الخاص بك (راجع وثائقهم).
- إذا منحك Browserless عنوان URL أساسيًا من نوع HTTPS، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو إبقاء عنوان HTTPS كما هو وترك OpenClaw
  يكتشف `/json/version`.

## مزوّدو WebSocket CDP المباشرون

تكشف بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المستند إلى HTTP ‏(`/json/version`). يقبل OpenClaw ثلاثة
أشكال من عناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال المناسبة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger، ثم
  يتصل. لا يوجد تراجع إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتخطى
  `/json/version` بالكامل.
- **جذور WebSocket المجردة** — ‏`ws://host[:port]` أو `wss://host[:port]` بدون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw أولًا
  اكتشاف `/json/version` عبر HTTP
  (مع تطبيع المخطط إلى `http`/`https`)؛
  فإذا أعاد الاكتشاف قيمة `webSocketDebuggerUrl` فسيتم استخدامها، وإلا فإن OpenClaw
  يعود إلى مصافحة WebSocket مباشرة عند الجذر المجرد. يتيح ذلك
  لاتصال `ws://` مجرد موجّه إلى Chrome محلي أن ينجح، لأن Chrome لا
  يقبل ترقيات WebSocket إلا على المسار المحدد لكل هدف من
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء سكنيين.

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

- [سجّل](https://www.browserbase.com/sign-up) ثم انسخ **مفتاح API**
  من [لوحة المعلومات Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح API الحقيقي الخاص بك في Browserbase.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذلك
  لا حاجة إلى خطوة إنشاء جلسة يدويًا.
- تتيح الخطة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على المرجع الكامل لـ API،
  وأدلة SDK، وأمثلة التكامل.

## الأمان

أفكار أساسية:

- التحكم في المتصفح مقيّد بـ loopback فقط؛ ويتدفق الوصول عبر مصادقة Gateway أو اقتران العقدة.
- يستخدم API ‏HTTP المستقل للمتصفح على loopback **مصادقة السر المشترك فقط**:
  مصادقة bearer لرمز gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic مع
  كلمة مرور gateway المضبوطة.
- رؤوس هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` لا
  تقومان بمصادقة API المستقل للمتصفح على loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم يتم ضبط أي مصادقة سر مشترك، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا يقوم OpenClaw **بإنشاء هذا الرمز تلقائيًا** عندما يكون `gateway.auth.mode`
  مضبوطًا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفي عقد على شبكة خاصة (Tailscale)؛ وتجنب تعريضها علنًا.
- اعتبر عناوين URL/الرموز الخاصة بـ CDP البعيد أسرارًا؛ وفضّل متغيرات البيئة أو مدير الأسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفّرة (HTTPS أو WSS) والرموز قصيرة العمر متى أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات الإعداد.

## الملفات الشخصية (متعدد المتصفحات)

يدعم OpenClaw عدة ملفات شخصية مسماة (تهيئات توجيه). يمكن أن تكون الملفات الشخصية:

- **تدار بواسطة openclaw**: مثيل متصفح قائم على Chromium مخصص مع دليل بيانات مستخدم خاص به + منفذ CDP
- **بعيد**: عنوان URL صريح لـ CDP (متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي الخاص بك عبر الاتصال التلقائي Chrome DevTools MCP

الإعدادات الافتراضية:

- يتم إنشاء الملف الشخصي `openclaw` تلقائيًا إذا كان مفقودًا.
- الملف الشخصي `user` مضمّن للإرفاق بجلسة موجودة عبر Chrome MCP.
- ملفات تعريف الجلسات الموجودة تكون اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف شخصي إلى نقل دليل بياناته المحلي إلى Trash.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## الجلسة الموجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الإرفاق بملف تعريف متصفح قائم على Chromium يعمل بالفعل عبر
خادم Chrome DevTools MCP الرسمي. يعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح هذا.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة المتصفح](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [ملف README الخاص بـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المضمّن:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا خاصًا بك إذا كنت تريد
اسمًا مختلفًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي `user` المضمّن الاتصال التلقائي Chrome MCP، والذي يستهدف
  ملف تعريف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` مع Brave أو Edge أو Chromium أو ملف تعريف Chrome غير الافتراضي:

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

1. افتح صفحة الفحص الخاصة بذلك المتصفح للتصحيح عن بُعد.
2. فعّل التصحيح عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يحاول OpenClaw الإرفاق.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار دخاني للإرفاق المباشر:

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
- تسرد `tabs` علامات تبويب المتصفح المفتوحة لديك بالفعل
- يعيد `snapshot` مراجع من علامة التبويب المباشرة المحددة

ما الذي يجب التحقق منه إذا لم يعمل الإرفاق:

- أن يكون إصدار المتصفح المستهدف القائم على Chromium هو `144+`
- أن يكون التصحيح عن بُعد مفعّلًا في صفحة الفحص الخاصة بذلك المتصفح
- أن المتصفح عرض مطالبة موافقة الإرفاق وأنك قبلتها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على الإضافة ويتحقق من
  أن Chrome مثبت محليًا لملفات تعريف الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تمكين التصحيح عن بُعد من جهة المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجّل دخول المستخدم فيها.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرّر اسم ذلك الملف صراحةً.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف العقدة تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من ملف التعريف المعزول `openclaw` لأنه يمكنه
  العمل داخل جلسة المتصفح المسجّل دخولك إليها.
- لا يشغّل OpenClaw المتصفح لهذا المشغّل؛ بل يكتفي بالإرفاق.
- يستخدم OpenClaw هنا التدفق الرسمي `--autoConnect` الخاص بـ Chrome DevTools MCP. إذا
  تم ضبط `userDataDir`، فسيتم تمريره لاستهداف دليل بيانات المستخدم ذاك.
- يمكن لـ existing-session الإرفاق على المضيف المحدد أو عبر
  عقدة متصفح متصلة. إذا كان Chrome موجودًا في مكان آخر ولم تكن هناك عقدة متصفح متصلة، فاستخدم
  CDP البعيد أو مضيف عقدة بدلًا من ذلك.

<Accordion title="قيود ميزات existing-session">

مقارنةً بملف التعريف المُدار `openclaw`، تكون مشغّلات existing-session أكثر تقييدًا:

- **لقطات الشاشة** — تعمل لقطات الصفحة ولقطات العناصر باستخدام `--ref`؛ أما محددات CSS ‏`--element` فلا تعمل. لا يمكن دمج `--full-page` مع `--ref` أو `--element`. لا يلزم Playwright لالتقاط لقطات الصفحة أو لقطات العناصر المعتمدة على ref.
- **الإجراءات** — تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (من دون محددات CSS). تقتصر `click` على الزر الأيسر. لا تدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`. لا تدعم `press` الخيار `delayMs`. ولا تدعم `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلات لكل استدعاء. تقبل `select` قيمة واحدة.
- **الانتظار / الرفع / الحوارات** — يدعم `wait --url` الأنماط المطابقة التامة، والجزئية، وglob؛ أما `wait --load networkidle` فغير مدعوم. تتطلب hooks الخاصة بالرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، ومن دون `element` لـ CSS. ولا تدعم hooks الخاصة بالحوارات تجاوزات المهلة.
- **الميزات الخاصة بالوضع المُدار فقط** — لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف تعريف متصفحك الشخصي إطلاقًا.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارضات مع تدفقات العمل التطويرية.
- **تحكم حتمي في علامات التبويب**: استهدف علامات التبويب عبر `targetId`، وليس “آخر علامة تبويب”.

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
- Linux: يبحث عن `google-chrome` و`brave` و`microsoft-edge` و`chromium` وما إلى ذلك.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## API التحكم (اختياري)

لأغراض البرمجة النصية والتصحيح، يكشف Gateway عن **API تحكم HTTP صغير يعمل على loopback فقط**
بالإضافة إلى CLI مطابق باسم `openclaw browser` (لقطات حالة، ومراجع، وتعزيزات للانتظار،
وخرج JSON، وتدفقات تصحيح). راجع
[Browser control API](/ar/tools/browser-control) للحصول على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (وخاصة snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات المضيف المنفصل WSL2 Gateway + Windows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF أثناء التنقل

هذان نوعان مختلفان من الإخفاقات ويشيران إلى مسارات شيفرة مختلفة.

- **فشل بدء CDP أو الجاهزية** يعني أن OpenClaw لا يستطيع التأكد من أن مستوى تحكم المتصفح سليم.
- **حظر SSRF أثناء التنقل** يعني أن مستوى تحكم المتصفح سليم، لكن هدف التنقل إلى الصفحة مرفوض وفق السياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر SSRF أثناء التنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ في سياسة المتصفح/الشبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع الرسالة `not reachable after start`، فاستكشف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فمستوى التحكم ما زال غير سليم. تعامل مع ذلك على أنه مشكلة في إمكانية الوصول إلى CDP، وليس مشكلة في التنقل إلى الصفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى تحكم المتصفح يعمل والإخفاق في سياسة التنقل أو الصفحة المستهدفة.
- إذا نجح `start` و`tabs` و`open` جميعًا، فإن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تعتمد إعدادات المتصفح افتراضيًا على كائن سياسة SSRF مغلق افتراضيًا حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار المحلي `openclaw` على loopback، تتخطى فحوصات سلامة CDP عمدًا فرضَ إمكانية الوصول الخاصة بسياسة SSRF في المتصفح على مستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا تعني نتيجة `start` أو `tabs` الناجحة أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تخفف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيفة ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا التي تتطلب وصول المتصفح إلى الشبكة الخاصة وتمت مراجعتها.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- يعيد `browser snapshot` شجرة واجهة مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` الخاصة بـ snapshot للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (الصفحة كاملة أو عنصرًا).
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت هناك عقدة تدعم المتصفح متصلة، فقد تُوجَّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وتقويته

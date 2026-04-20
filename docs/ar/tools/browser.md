---
read_when:
    - إضافة أتمتة المتصفح التي يتحكم بها الوكيل
    - تصحيح سبب تدخّل openclaw في Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة تحكم متكاملة للمتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-20T07:30:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# المتصفح (بإدارة openclaw)

يمكن لـ OpenClaw تشغيل **ملف تعريف Chrome/Brave/Edge/Chromium مخصص** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي وتتم إدارته من خلال خدمة تحكم محلية صغيرة
داخل Gateway ‏(loopback فقط).

عرض للمبتدئين:

- فكّر فيه باعتباره **متصفحًا منفصلًا مخصصًا للوكيل فقط**.
- ملف التعريف `openclaw` **لا** يلمس ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات التبويب وقراءة الصفحات والنقر والكتابة** ضمن مسار آمن.
- يرتبط ملف التعريف المدمج `user` بجلسة Chrome الحقيقية المسجّل دخولك إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** ‏(بتمييز برتقالي افتراضيًا).
- تحكم حتمي بعلامات التبويب (عرض/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد) ولقطات snapshots ولقطات شاشة وملفات PDF.
- دعم اختياري لعدة ملفات تعريف (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## بدء سريع

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` غير موجود بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح مفقود](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم عبر Plugin

أصبحت أداة `browser` الافتراضية الآن Plugin مضمّنًا يأتي مفعّلًا
افتراضيًا. وهذا يعني أنه يمكنك تعطيله أو استبداله من دون إزالة بقية
نظام Plugin في OpenClaw:

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

عطّل Plugin المضمّن قبل تثبيت Plugin آخر يوفّر
اسم أداة `browser` نفسه. تتطلب تجربة المتصفح الافتراضية كِلا الأمرين:

- ألّا يكون `plugins.entries.browser.enabled` معطّلًا
- `browser.enabled=true`

إذا عطّلت Plugin فقط، فسيختفي معًا CLI المضمّن للمتصفح (`openclaw browser`)
وطريقة gateway ‏(`browser.request`) وأداة الوكيل وخدمة التحكم
الافتراضية بالمتصفح. وستبقى إعدادات `browser.*` سليمة لكي يعيد
Plugin بديل استخدامها.

يمتلك Plugin المتصفح المضمّن الآن أيضًا تنفيذ وقت تشغيل المتصفح.
ولا يحتفظ core إلا بمساعدات Plugin SDK المشتركة بالإضافة إلى
إعادات التصدير التوافقية لمسارات الاستيراد الداخلية الأقدم. عمليًا،
فإن إزالة حزمة Plugin المتصفح أو استبدالها يزيل مجموعة ميزات المتصفح
بدلًا من ترك وقت تشغيل ثانٍ مملوكًا لـ core.

لا تزال تغييرات إعدادات المتصفح تتطلب إعادة تشغيل Gateway حتى يتمكن Plugin
المضمّن من إعادة تسجيل خدمة المتصفح الخاصة به باستخدام الإعدادات الجديدة.

## أمر أو أداة المتصفح مفقود

إذا أصبح `openclaw browser` فجأة أمرًا غير معروف بعد الترقية، أو
أبلغ الوكيل بأن أداة المتصفح مفقودة، فالسبب الأكثر شيوعًا هو وجود قائمة
`plugins.allow` مقيِّدة لا تتضمن `browser`.

مثال على إعداد معطوب:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

أصلح ذلك بإضافة `browser` إلى قائمة السماح الخاصة بـ Plugin:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

ملاحظات مهمة:

- لا يكفي `browser.enabled=true` وحده عندما يكون `plugins.allow` مضبوطًا.
- ولا يكفي `plugins.entries.browser.enabled=true` وحده عندما يكون `plugins.allow` مضبوطًا.
- لا يقوم `tools.alsoAllow: ["browser"]` **بتحميل** Plugin المتصفح المضمّن. فهو يضبط فقط سياسة الأدوات بعد أن يكون Plugin قد تم تحميله بالفعل.
- إذا لم تكن بحاجة إلى قائمة سماح مقيِّدة لـ Plugin، فإن إزالة `plugins.allow` تعيد أيضًا سلوك المتصفح المضمّن الافتراضي.

الأعراض المعتادة:

- يكون `openclaw browser` أمرًا غير معروف.
- يكون `browser.request` مفقودًا.
- يبلّغ الوكيل بأن أداة المتصفح غير متاحة أو مفقودة.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب امتدادًا).
- `user`: ملف تعريف إرفاق Chrome MCP مدمج لجلسة **Chrome الحقيقية المسجّل دخولك إليها**.

بالنسبة لاستدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجّل دخولها مهمة وكان المستخدم
  موجودًا أمام الكمبيوتر للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // فعّل ذلك فقط عند الاشتراك المقصود في الوصول إلى شبكة خاصة موثوقة
      // allowPrivateNetwork: true, // اسم بديل قديم
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

ملاحظات:

- ترتبط خدمة التحكم بالمتصفح على loopback بمنفذ مشتق من `gateway.port`
  (الافتراضي: `18791`، أي gateway + 2).
- إذا قمت بتجاوز منفذ Gateway ‏(`gateway.port` أو `OPENCLAW_GATEWAY_PORT`)،
  فإن منافذ المتصفح المشتقة تتحرك لتبقى ضمن “العائلة” نفسها.
- يستخدم `cdpUrl` افتراضيًا منفذ CDP المحلي المُدار عندما لا يكون مضبوطًا.
- ينطبق `remoteCdpTimeoutMs` على فحوصات إمكانية الوصول إلى CDP البعيد (غير loopback).
- ينطبق `remoteCdpHandshakeTimeoutMs` على فحوصات إمكانية الوصول إلى WebSocket الخاصة بـ CDP البعيد.
- تكون عملية الانتقال/فتح علامة التبويب في المتصفح محمية من SSRF قبل الانتقال، ويُعاد فحصها بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد الانتقال.
- في وضع SSRF الصارم، يتم أيضًا فحص اكتشاف/استقصاء نقطة نهاية CDP البعيدة (`cdpUrl`، بما في ذلك عمليات البحث `/json/version`).
- يكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا افتراضيًا. اضبطه إلى `true` فقط عندما تكون تثق عمدًا في وصول المتصفح إلى شبكة خاصة.
- لا يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم من أجل التوافق.
- تعني `attachOnly: true` أنه “لا تشغّل أبدًا متصفحًا محليًا؛ فقط ارتبط به إذا كان يعمل بالفعل.”
- يقوم `color` و`color` لكل ملف تعريف بتلوين واجهة المتصفح حتى تتمكن من معرفة ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` ‏(متصفح مستقل مُدار من OpenClaw). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجّل دخوله.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان قائمًا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- تقوم ملفات تعريف `openclaw` المحلية بتعيين `cdpPort`/`cdpUrl` تلقائيًا — اضبطهما فقط لـ CDP البعيد.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا
  تضبط `cdpUrl` لهذا المشغّل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب على ملف تعريف existing-session
  الارتباط بملف تعريف مستخدم Chromium غير افتراضي مثل Brave أو Edge.

## استخدام Brave ‏(أو متصفح آخر قائم على Chromium)

إذا كان متصفحك **الافتراضي على النظام** قائمًا على Chromium ‏(Chrome/Brave/Edge/etc)،
فإن OpenClaw يستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
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

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم عبر loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد قائم على Chromium. في هذه الحالة، لن يقوم OpenClaw بتشغيل متصفح محلي.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يقوم `openclaw browser stop` بإيقاف عملية المتصفح التي
  شغّلها OpenClaw
- ملفات التعريف attach-only وCDP البعيد: يقوم `openclaw browser stop` بإغلاق
  جلسة التحكم النشطة وتحرير تجاوزات محاكاة Playwright/CDP ‏(منفذ العرض،
  ونظام الألوان، واللغة المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، وحالة مشابهة)، حتى
  مع عدم تشغيل OpenClaw لأي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد المصادقة:

- رموز استعلام query ‏(مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic ‏(مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ WebSocket الخاص بـ CDP. فضّل متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من تثبيتها في ملفات الإعدادات.

## وكيل متصفح Node ‏(افتراضي بلا إعدادات)

إذا كنت تشغّل **مضيف Node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى تلك العقدة من دون أي إعدادات متصفح إضافية.
وهذا هو المسار الافتراضي لـ Gatewayات البعيدة.

ملاحظات:

- يكشف مضيف Node خادم التحكم المحلي بالمتصفح من خلال **أمر proxy**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالعقدة نفسها (مثل المحلية).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للحصول على السلوك القديم/الافتراضي: تظل جميع ملفات التعريف المضبوطة قابلة للوصول عبر proxy، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا قمت بضبط `nodeHost.browserProxy.allowProfiles`، فسيتعامل OpenClaw معه كحدّ امتيازات دنيا: لا يمكن استهداف إلا ملفات التعريف الموجودة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح proxy.
- عطّله إذا كنت لا تريده:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على gateway: ‏`gateway.nodes.browser.mode="off"`

## Browserless ‏(CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تكشف
عناوين اتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
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
- إذا منحك Browserless عنوان HTTPS أساسيًا، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو إبقاء عنوان HTTPS والسماح لـ OpenClaw
  باكتشاف `/json/version`.

## مزوّدو CDP عبر WebSocket مباشر

تكشف بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
الاكتشاف القياسي لـ CDP القائم على HTTP ‏(`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين CDP URL ويختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger URL، ثم
  يتصل. لا توجد آلية احتياطية عبر WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket العارية** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` ‏(مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw أولًا
  اكتشاف HTTP ‏`/json/version`
  (مع تطبيع scheme إلى `http`/`https`)؛
  وإذا أعاد الاكتشاف قيمة `webSocketDebuggerUrl` فسيتم استخدامها، وإلا فإن OpenClaw
  يعود إلى مصافحة WebSocket مباشرة عند الجذر العاري. وهذا يغطي
  كلًا من منافذ التصحيح البعيد بأسلوب Chrome والمزوّدين الذين يعملون عبر WebSocket فقط.

إن توجيه `ws://host:port` / `wss://host:port` العادي من دون مسار `/devtools/...`
إلى نسخة Chrome محلية مدعوم عبر آلية الاحتياط التي تبدأ بالاكتشاف —
إذ لا يقبل Chrome ترقيات WebSocket إلا على المسار المحدد لكل متصفح
أو لكل هدف الذي يُرجعه `/json/version`، لذلك فإن مصافحة الجذر العاري وحدها
ستفشل.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج ووضع التخفّي ووسائط residential
proxy.

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

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **مفتاح API**
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي الخاص بك.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند اتصال WebSocket، لذلك لا
  توجد حاجة إلى خطوة إنشاء جلسة يدويًا.
- تتيح الخطة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل وأدلة SDK وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم بالمتصفح يقتصر على loopback فقط؛ ويتم الوصول عبر مصادقة Gateway أو إقران العقدة.
- تستخدم واجهة HTTP المستقلة للمتصفح عبر loopback **مصادقة shared-secret فقط**:
  مصادقة bearer لرمز gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic باستخدام
  كلمة مرور gateway المضبوطة.
- لا تقوم رؤوس هوية Tailscale Serve ووضع `gateway.auth.mode: "trusted-proxy"`
  **بالمصادقة** على واجهة loopback المستقلة هذه الخاصة بالمتصفح.
- إذا كان التحكم بالمتصفح مفعّلًا ولم يتم ضبط أي مصادقة shared-secret، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا يقوم OpenClaw **بإنشاء** هذا الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا مسبقًا على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات Node على شبكة خاصة (Tailscale)؛ وتجنب كشفها للعامة.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد باعتبارها أسرارًا؛ وفضّل متغيرات env أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفّرة (HTTPS أو WSS) والرموز قصيرة العمر قدر الإمكان.
- تجنّب تضمين الرموز طويلة العمر مباشرة في ملفات الإعدادات.

## الملفات الشخصية (متصفحات متعددة)

يدعم OpenClaw عدة ملفات تعريف مسماة (إعدادات توجيه). يمكن أن تكون ملفات التعريف:

- **openclaw-managed**: نسخة متصفح مخصصة قائمة على Chromium مع دليل بيانات مستخدم خاص بها + منفذ CDP
- **بعيد**: عنوان CDP URL صريح (متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يتم إنشاء ملف التعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- ملف التعريف `user` مدمج لإرفاق جلسة Chrome MCP الحالية.
- تكون ملفات تعريف existing-session اختيارية بالإضافة إلى `user`؛ أنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل كل نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## existing-session عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح قائم على Chromium يعمل بالفعل عبر
خادم Chrome DevTools MCP الرسمي. ويعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح ذاك.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المدمج:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا خاصًا بك إذا أردت
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف التعريف المدمج `user` الاتصال التلقائي بـ Chrome MCP، والذي يستهدف
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

1. افتح صفحة inspect الخاصة بذلك المتصفح للتصحيح البعيد.
2. فعّل التصحيح البعيد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرتبط OpenClaw.

صفحات inspect الشائعة:

- Chrome: ‏`chrome://inspect/#remote-debugging`
- Brave: ‏`brave://inspect/#remote-debugging`
- Edge: ‏`edge://inspect/#remote-debugging`

اختبار smoke للإرفاق الحي:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

شكل النجاح:

- يعرض `status` القيمة `driver: existing-session`
- يعرض `status` القيمة `transport: chrome-mcp`
- يعرض `status` القيمة `running: true`
- يعرض `tabs` علامات التبويب المفتوحة بالفعل في متصفحك
- يعيد `snapshot` مراجع من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم ينجح الإرفاق:

- أن يكون إصدار المتصفح المستهدف القائم على Chromium هو `144+`
- أن يكون التصحيح البعيد مفعّلًا في صفحة inspect الخاصة بذلك المتصفح
- أن يكون المتصفح قد عرض مطالبة موافقة الإرفاق وأنك قبلتها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على الامتدادات ويتحقق من
  أن Chrome مثبت محليًا لملفات التعريف الافتراضية ذات الاتصال التلقائي، لكنه لا يستطيع
  تفعيل التصحيح البعيد من جهة المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة متصفح المستخدم المسجّل دخوله.
- إذا استخدمت ملف تعريف existing-session مخصصًا، فمرّر اسم ملف التعريف الصريح هذا.
- اختر هذا الوضع فقط عندما يكون المستخدم موجودًا أمام الكمبيوتر للموافقة على
  مطالبة الإرفاق.
- يمكن لـ Gateway أو مضيف Node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- يُعد هذا المسار أعلى خطورة من ملف التعريف المعزول `openclaw` لأنه يمكنه
  العمل داخل جلسة المتصفح المسجّل دخولك إليها.
- لا يقوم OpenClaw بتشغيل المتصفح لهذا المشغّل؛ بل يرتبط فقط بجلسة
  موجودة.
- يستخدم OpenClaw هنا تدفق `--autoConnect` الرسمي لـ Chrome DevTools MCP. إذا
  تم ضبط `userDataDir`، فإن OpenClaw يمرّره لاستهداف دليل بيانات مستخدم
  Chromium الصريح هذا.
- تدعم لقطات الشاشة في existing-session التقاط الصفحة وعمليات الالتقاط بالعناصر عبر `--ref`
  من snapshots، لكنها لا تدعم محددات CSS عبر `--element`.
- تعمل لقطات شاشة الصفحة في existing-session من دون Playwright عبر Chrome MCP.
  كما تعمل لقطات شاشة العناصر المعتمدة على المرجع (`--ref`) هناك أيضًا، لكن لا يمكن
  الجمع بين `--full-page` و`--ref` أو `--element`.
- لا تزال إجراءات existing-session أكثر محدودية من مسار المتصفح المُدار:
  - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select`
    مراجع snapshot بدلًا من محددات CSS
  - تدعم `click` الزر الأيسر فقط (من دون تجاوزات للأزرار أو modifiers)
  - لا تدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`
  - لا تدعم `press` القيمة `delayMs`
  - لا تدعم `hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate`
    تجاوزات المهلة لكل استدعاء
  - يدعم `select` حاليًا قيمة واحدة فقط
- يدعم `wait --url` في existing-session أنماط المطابقة التامة والجزئية وglob
  مثل مشغّلات المتصفح الأخرى. ولا يدعم `wait --load networkidle` بعد.
- تتطلب hooks الرفع في existing-session القيمة `ref` أو `inputRef`، وتدعم ملفًا واحدًا
  في كل مرة، ولا تدعم الاستهداف عبر CSS باستخدام `element`.
- لا تدعم hooks مربعات الحوار في existing-session تجاوزات المهلة.
- لا تزال بعض الميزات تتطلب مسار المتصفح المُدار، بما في ذلك
  الإجراءات الدفعية وتصدير PDF واعتراض التنزيل و`responsebody`.
- يمكن لـ existing-session الارتباط على المضيف المحدد أو من خلال
  عقدة متصفح متصلة. إذا كان Chrome موجودًا في مكان آخر ولم تكن هناك عقدة متصفح متصلة، فاستخدم
  CDP البعيد أو مضيف Node بدلًا من ذلك.

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس أبدًا ملف تعريف متصفحك الشخصي.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارضات مع تدفقات العمل التطويرية.
- **تحكم حتمي بعلامات التبويب**: يستهدف علامات التبويب عبر `targetId`، وليس “آخر علامة تبويب”.

## اختيار المتصفح

عند التشغيل محليًا، يختار OpenClaw أول متصفح متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز عبر `browser.executablePath`.

المنصات:

- macOS: يتحقق من `/Applications` و`~/Applications`.
- Linux: يبحث عن `google-chrome` و`brave` و`microsoft-edge` و`chromium` وغيرها.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة Control API ‏(اختياري)

للتكاملات المحلية فقط، يكشف Gateway واجهة HTTP صغيرة عبر loopback:

- الحالة/البدء/الإيقاف: `GET /` و`POST /start` و`POST /stop`
- علامات التبويب: `GET /tabs` و`POST /tabs/open` و`POST /tabs/focus` و`DELETE /tabs/:targetId`
- snapshot/لقطة الشاشة: `GET /snapshot` و`POST /screenshot`
- الإجراءات: `POST /navigate` و`POST /act`
- Hooks: ‏`POST /hooks/file-chooser` و`POST /hooks/dialog`
- التنزيلات: `POST /download` و`POST /wait/download`
- التصحيح: `GET /console` و`POST /pdf`
- التصحيح: `GET /errors` و`GET /requests` و`POST /trace/start` و`POST /trace/stop` و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies` و`POST /cookies/set` و`POST /cookies/clear`
- الحالة: `GET /storage/:kind` و`POST /storage/:kind/set` و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline` و`POST /set/headers` و`POST /set/credentials` و`POST /set/geolocation` و`POST /set/media` و`POST /set/timezone` و`POST /set/locale` و`POST /set/device`

تقبل كل نقاط النهاية `?profile=<name>`.

إذا تم ضبط مصادقة gateway بنمط shared-secret، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو مصادقة HTTP Basic باستخدام كلمة المرور تلك

ملاحظات:

- لا تستهلك واجهة loopback المستقلة هذه الخاصة بالمتصفح رؤوس
  trusted-proxy أو هوية Tailscale Serve.
- إذا كان `gateway.auth.mode` هو `none` أو `trusted-proxy`، فإن مسارات متصفح loopback
  هذه لا ترث أوضاع الهوية تلك؛ لذا أبقها مقتصرة على loopback فقط.

### عقد الخطأ لـ `/act`

يستخدم `POST /act` استجابة خطأ مهيكلة لفشل التحقق والسياسات
على مستوى المسار:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` ‏(HTTP 400): القيمة `kind` مفقودة أو غير معروفة.
- `ACT_INVALID_REQUEST` ‏(HTTP 400): فشلت تهيئة أو التحقق من حمولة الإجراء.
- `ACT_SELECTOR_UNSUPPORTED` ‏(HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` ‏(HTTP 403): تم تعطيل `evaluate` ‏(أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` ‏(HTTP 403): يتعارض `targetId` على المستوى الأعلى أو ضمن الدُفعات مع هدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` ‏(HTTP 501): الإجراء غير مدعوم لملفات تعريف existing-session.

قد تُرجع إخفاقات وقت التشغيل الأخرى أيضًا `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot ولقطات شاشة العناصر
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتًا، فستُرجع نقاط النهاية تلك
خطأ 501 واضحًا.

ما الذي يظل يعمل من دون Playwright:

- لقطات ARIA snapshots
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket
  لـ CDP لكل علامة تبويب متاحًا
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات الشاشة المعتمدة على `--ref` في `existing-session` من مخرجات snapshot

ما الذي لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- لقطات شاشة العناصر بمحددات CSS ‏(`--element`)
- تصدير PDF الكامل للمتصفح

كما ترفض لقطات شاشة العناصر أيضًا الخيار `--full-page`؛ إذ تُرجع المسارات الرسالة
`fullPage is not supported for element screenshots`.

إذا رأيت الرسالة `Playwright is not available in this gateway build`، فقم بتثبيت
حزمة Playwright الكاملة (وليس `playwright-core`) وأعد تشغيل gateway، أو أعد تثبيت
OpenClaw مع دعم المتصفح.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل داخل Docker، فتجنب `npx playwright` ‏(تعارضات npm override).
استخدم CLI المضمّن بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، اضبط `PLAYWRIGHT_BROWSERS_PATH` ‏(على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من أن `/home/node` يُحتفظ به عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

التدفق عالي المستوى:

- يقبل **خادم تحكم** صغير طلبات HTTP.
- ويتصل بالمتصفحات القائمة على Chromium ‏(Chrome/Brave/Edge/Chromium) عبر **CDP**.
- وبالنسبة إلى الإجراءات المتقدمة (click/type/snapshot/PDF)، فإنه يستخدم **Playwright** فوق
  CDP.
- وعندما يكون Playwright غير متاح، لا تتوفر إلا العمليات التي لا تعتمد على Playwright.

يحافظ هذا التصميم على الوكيل على واجهة مستقرة وحتمية مع السماح
لك بالتبديل بين المتصفحات المحلية/البعيدة وملفات التعريف.

## مرجع CLI السريع

تقبل كل الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد.
وتقبل كل الأوامر أيضًا `--json` للحصول على مخرجات قابلة للقراءة آليًا (حِمولات مستقرة).

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

- بالنسبة إلى ملفات تعريف attach-only وCDP البعيد، يظل `openclaw browser stop` هو
  أمر التنظيف الصحيح بعد الاختبارات. فهو يغلق جلسة التحكم النشطة ويمسح
  تجاوزات المحاكاة المؤقتة بدلًا من إنهاء
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

- إن `upload` و`dialog` استدعاءات **تسليح**؛ شغّلهما قبل عملية النقر/الضغط
  التي تؤدي إلى تشغيل أداة اختيار الملفات/مربع الحوار.
- تكون مسارات خرج التنزيل وtrace مقيّدة بجذور OpenClaw المؤقتة:
  - traces: ‏`/tmp/openclaw` ‏(الاحتياطي: `${os.tmpdir()}/openclaw`)
  - downloads: ‏`/tmp/openclaw/downloads` ‏(الاحتياطي: `${os.tmpdir()}/openclaw/downloads`)
- تكون مسارات الرفع مقيّدة بجذر رفع مؤقت لـ OpenClaw:
  - uploads: ‏`/tmp/openclaw/uploads` ‏(الاحتياطي: `${os.tmpdir()}/openclaw/uploads`)
- يمكن لـ `upload` أيضًا ضبط مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.
- `snapshot`:
  - يعيد `--format ai` ‏(الافتراضي عند تثبيت Playwright) AI snapshot مع مراجع رقمية (`aria-ref="<n>"`).
  - يعيد `--format aria` شجرة إمكانية الوصول (من دون مراجع؛ للفحص فقط).
  - يوفّر `--efficient` ‏(أو `--mode efficient`) إعدادًا مسبقًا مضغوطًا لـ role snapshot ‏(interactive + compact + depth + maxChars أقل).
  - الإعداد الافتراضي في config ‏(للأداة/CLI فقط): اضبط `browser.snapshotDefaults.mode: "efficient"` لاستخدام اللقطات الفعّالة عندما لا يمرّر المستدعي وضعًا (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
  - تفرض خيارات role snapshot ‏(`--interactive` و`--compact` و`--depth` و`--selector`) role snapshot بمراجع مثل `ref=e12`.
  - يقيّد `--frame "<iframe selector>"` role snapshots إلى iframe ‏(ويقترن بمراجع role مثل `e12`).
  - ينتج `--interactive` قائمة مسطحة وسهلة الاختيار بالعناصر التفاعلية (الأفضل لقيادة الإجراءات).
  - يضيف `--labels` لقطة شاشة مقتصرة على viewport مع تراكب تسميات المراجع (ويطبع `MEDIA:<path>`).
- تتطلب أوامر مثل `click`/`type`/إلخ قيمة `ref` من `snapshot` ‏(سواء المرجع الرقمي `12` أو مرجع role ‏`e12`).
  لا تُدعَم محددات CSS عمدًا في الإجراءات.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “اللقطات”:

- **AI snapshot ‏(مراجع رقمية)**: ‏`openclaw browser snapshot` ‏(الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12` و`openclaw browser type 23 "hello"`.
  - داخليًا، يُحل المرجع عبر `aria-ref` في Playwright.

- **Role snapshot ‏(مراجع role مثل `e12`)**: ‏`openclaw browser snapshot --interactive` ‏(أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - المخرجات: قائمة/شجرة قائمة على role تحتوي على `[ref=e12]` ‏(ومعها اختياريًا `[nth=1]`).
  - الإجراءات: `openclaw browser click e12` و`openclaw browser highlight e12`.
  - داخليًا، يُحل المرجع عبر `getByRole(...)` ‏(مع `nth()` عند وجود تكرارات).
  - أضف `--labels` لإدراج لقطة شاشة للـ viewport مع تراكب تسميات `e12`.

سلوك المراجع:

- إن المراجع **ليست ثابتة عبر التنقلات**؛ فإذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- إذا تم أخذ role snapshot باستخدام `--frame`، فسيتم تقييد مراجع role بذلك iframe حتى role snapshot التالي.

## تعزيزات `wait`

يمكنك الانتظار لأكثر من مجرد الوقت/النص:

- الانتظار لعنوان URL ‏(مع دعم glob بواسطة Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لمحمول JS شرطي:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدد مرئيًا:
  - `openclaw browser wait "#main"`

يمكن دمج هذه الخيارات:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## تدفقات عمل التصحيح

عندما يفشل إجراء ما (مثل “not visible” أو “strict mode violation” أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` ‏(وفضّل مراجع role في الوضع interactive)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما الذي يستهدفه Playwright
4. إذا كان سلوك الصفحة غريبًا:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. للتصحيح العميق: سجّل trace:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` ‏(يطبع `TRACE:<path>`)

## خرج JSON

إن `--json` مخصص للبرمجة والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON قيمة `refs` بالإضافة إلى كتلة `stats` صغيرة
‏(أسطر/محارف/مراجع/interactive) حتى تتمكن الأدوات من فهم حجم الحمولة وكثافتها.

## مفاتيح الحالة والبيئة

هذه مفيدة في تدفقات العمل من نوع “اجعل الموقع يتصرف مثل X”:

- ملفات تعريف الارتباط: `cookies` و`cookies set` و`cookies clear`
- التخزين: `storage local|session get|set|clear`
- عدم الاتصال: `set offline on|off`
- الرؤوس: `set headers --headers-json '{"X-Debug":"1"}'` ‏(لا يزال الشكل القديم `set headers --json '{"X-Debug":"1"}'` مدعومًا)
- مصادقة HTTP basic: ‏`set credentials user pass` ‏(أو `--clear`)
- الموقع الجغرافي: ‏`set geo <lat> <lon> --origin "https://example.com"` ‏(أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...` و`set locale ...`
- الجهاز / viewport:
  - `set device "iPhone 14"` ‏(إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجّل دخولها؛ تعامل معه على أنه حساس.
- ينفّذ `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  JavaScript اعتباطيًا في سياق الصفحة. يمكن لحقن الموجّهات
  توجيه هذا. عطّله عبر `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter وغيرها)، راجع [تسجيل دخول المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/مضيف Node خاصًا (loopback أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ قم بإنشاء نفق لها واحمها.

مثال الوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // سماح تطابق تام اختياري
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux ‏(خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

وبالنسبة لإعدادات المضيف المنقسم WSL2 Gateway + Windows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF أثناء التنقل

هذان نوعان مختلفان من الإخفاقات، ويشيران إلى مسارات كود مختلفة.

- يعني **فشل بدء CDP أو الجاهزية** أن OpenClaw لا يستطيع تأكيد سلامة مستوى التحكم في المتصفح.
- ويعني **حظر SSRF أثناء التنقل** أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض وفق السياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر SSRF أثناء التنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب بسبب خطأ في سياسة المتصفح/الشبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` برسالة `not reachable after start`، فابدأ باستكشاف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فهذا يعني أن مستوى التحكم لا يزال غير سليم. تعامل مع ذلك على أنه مشكلة في إمكانية الوصول إلى CDP، وليس مشكلة في تنقل الصفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح يعمل وأن الإخفاق في سياسة التنقل أو في الصفحة الهدف.
- إذا نجح `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي للمتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تستخدم إعدادات المتصفح افتراضيًا كائن سياسة SSRF مغلقًا عند الفشل حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار المحلي عبر loopback ‏`openclaw`، تتجاوز فحوصات سلامة CDP عمدًا فرض إمكانية الوصول عبر SSRF الخاصة بالمتصفح فيما يتعلق بمستوى التحكم المحلي الخاص بـ OpenClaw نفسه.
- تكون حماية التنقل منفصلة. نجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تقم بتخفيف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيفة ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكات الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون وصول المتصفح إلى الشبكة الخاصة مطلوبًا ومراجعًا.

مثال: التنقل محظور، ومستوى التحكم سليم

- ينجح `start`
- ينجح `tabs`
- يفشل `open http://internal.example`

وهذا يعني عادةً أن بدء تشغيل المتصفح سليم وأن الهدف الخاص بالتنقل يحتاج إلى مراجعة للسياسة.

مثال: بدء التشغيل محظور قبل أن تصبح مسألة التنقل مهمة

- يفشل `start` مع `not reachable after start`
- يفشل `tabs` أيضًا أو لا يمكن تشغيله

وهذا يشير إلى تشغيل المتصفح أو إمكانية الوصول إلى CDP، وليس إلى مشكلة في قائمة السماح لعناوين URL الخاصة بالصفحات.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- يعيد `browser snapshot` شجرة واجهة مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من snapshot من أجل click/type/drag/select.
- يلتقط `browser screenshot` البكسلات (الصفحة كاملة أو عنصرًا).
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمّى (openclaw أو chrome أو CDP بعيد).
  - `target` ‏(`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت هناك عقدة متصلة قادرة على تشغيل المتصفح، فقد تُوجَّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

وهذا يبقي الوكيل حتميًا ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم بالمتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم بالمتصفح ووسائل التحصين

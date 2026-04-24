---
read_when:
    - إضافة أتمتة متصفح يتحكم فيها الوكيل
    - تصحيح سبب تدخل OpenClaw في Chrome الخاص بكцҳауеитanalysis to=functions.read 中央値との差json 21 0 2000 {"path":"/home/runner/work/docs/docs/source/.i18n/glossary.ar.json"}
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة تحكم متكاملة بالمتصفح + أوامر الإجراءات
title: المتصفح (مُدار بواسطة OpenClaw)
x-i18n:
    generated_at: "2026-04-24T08:07:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fb0fc0b6235fa8a0324b754e247e015d5ca19d114d324d565ed4a19f9313f7e
    source_path: tools/browser.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **profile مخصصة لـ Chrome/Brave/Edge/Chromium** يتحكم بها الوكيل.
وهي معزولة عن متصفحك الشخصي وتُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway ‏(loopback فقط).

منظور المبتدئ:

- فكّر فيها على أنها **متصفح منفصل خاص بالوكيل فقط**.
- لا تلمس profile ‏`openclaw` profile متصفحك الشخصي.
- يستطيع الوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** ضمن مسار آمن.
- ترتبط profile ‏`user` المضمنة بجلسة Chrome الحقيقية المسجل الدخول بها عبر Chrome MCP.

## ما الذي تحصل عليه

- profile متصفح منفصلة باسم **openclaw** ‏(بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (إدراج/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات snapshots، ولقطات شاشة، وPDF.
- دعم اختياري لعدة profiles ‏(`openclaw`, `work`, `remote`, ...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## بدء سريع

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا حصلت على الرسالة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كانت `openclaw browser` مفقودة بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح المفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

تُعد أداة `browser` الافتراضية Plugin مضمنة. قم بتعطيلها لاستبدالها بـ Plugin أخرى تسجل اسم الأداة نفسه `browser`:

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

تحتاج القيم الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. ويؤدي تعطيل Plugin فقط إلى إزالة CLI الخاصة بـ `openclaw browser`، والطريقة `browser.request` في gateway، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ بينما تبقى إعدادات `browser.*` الخاصة بك سليمة من أجل بديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## أمر أو أداة المتصفح المفقودة

إذا أصبحت `openclaw browser` غير معروفة بعد ترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` تستثني `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تُعد `browser.enabled=true` و`plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` بدائل عن العضوية في قائمة السماح — فقائمة السماح تتحكم في تحميل Plugin، ولا تعمل سياسة الأدوات إلا بعد التحميل. كما أن إزالة `plugins.allow` بالكامل تعيد الإعداد الافتراضي أيضًا.

## Profiles: ‏`openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يحتاج إلى extension).
- `user`: profile ارتباط Chrome MCP المضمنة لجلسة **Chrome الحقيقية المسجل الدخول بها**
  لديك.

بالنسبة إلى استدعاءات أداة المتصفح الخاصة بالوكيل:

- افتراضيًا: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات المسجل الدخول بها فعلًا مهمة، وعندما
  يكون المستخدم أمام الحاسوب للنقر/الموافقة على أي مطالبة ارتباط.
- تمثل `profile` التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعداد

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // default: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500, // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
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

- ترتبط خدمة التحكم بـ loopback على منفذ مشتق من `gateway.port` ‏(الافتراضي `18791` = gateway + 2). ويؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى إزاحة المنافذ المشتقة في العائلة نفسها.
- تقوم profiles ‏`openclaw` المحلية بإسناد `cdpPort`/`cdpUrl` تلقائيًا؛ ولا تضبطهما إلا من أجل remote CDP. تكون `cdpUrl` افتراضيًا منفذ CDP المحلي المُدار عند عدم ضبطها.
- تنطبق `remoteCdpTimeoutMs` على فحوصات الوصول HTTP إلى CDP البعيدة (غير loopback)؛ وتنطبق `remoteCdpHandshakeTimeoutMs` على مصافحات CDP WebSocket البعيدة.

</Accordion>

<Accordion title="سياسة SSRF">

- تكون الملاحة في المتصفح وفتح علامات التبويب محمية ضد SSRF قبل الملاحة وتُعاد فحصها بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد ذلك.
- في وضع SSRF الصارم، يتم أيضًا فحص اكتشاف نقطة نهاية remote CDP ومسابير `/json/version` ‏(`cdpUrl`).
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` متوقفة افتراضيًا؛ فعّلها فقط عندما يكون الوصول إلى المتصفح في الشبكة الخاصة موثوقًا عمدًا.
- تظل `browser.ssrfPolicy.allowPrivateNetwork` مدعومة كاسم مستعار قديم.

</Accordion>

<Accordion title="سلوك Profiles">

- تعني `attachOnly: true` عدم تشغيل متصفح محلي مطلقًا؛ بل الارتباط فقط إذا كان هناك واحد يعمل بالفعل.
- تقوم `color` ‏(على المستوى الأعلى ولكل profile) بتلوين واجهة المتصفح بحيث تستطيع رؤية profile النشطة.
- profile الافتراضية هي `openclaw` ‏(مُدارة ومستقلة). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم المسجل الدخول به.
- ترتيب الاكتشاف التلقائي: المتصفح الافتراضي للنظام إذا كان مبنيًا على Chromium؛ وإلا Chrome → Brave → Edge → Chromium → Chrome Canary.
- يستخدم `driver: "existing-session"` أداة Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` مع ذلك driver.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن ترتبط profile من نوع existing-session بملف تعريف مستخدم غير افتراضي في Chromium ‏(Brave أو Edge وما إلى ذلك).

</Accordion>

</AccordionGroup>

## استخدم Brave ‏(أو متصفحًا آخر مبنيًا على Chromium)

إذا كان متصفحك **الافتراضي على النظام** مبنيًا على Chromium ‏(Chrome/Brave/Edge/etc)،
فإن OpenClaw تستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

أو اضبطه في الإعدادات، بحسب المنصة:

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

- **التحكم المحلي (افتراضي):** تبدأ Gateway خدمة التحكم على loopback ويمكنها تشغيل متصفح محلي.
- **التحكم البعيد (مضيف node):** شغّل مضيف node على الجهاز الذي يحتوي على المتصفح؛ وستقوم Gateway بتمرير إجراءات المتصفح إليه.
- **Remote CDP:** اضبط `browser.profiles.<name>.cdpUrl` ‏(أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد مبني على Chromium. وفي هذه الحالة، لن تشغّل OpenClaw متصفحًا محليًا.

يختلف سلوك الإيقاف بحسب وضع profile:

- profiles المحلية المُدارة: يقوم `openclaw browser stop` بإيقاف عملية المتصفح التي
  شغّلتها OpenClaw
- profiles ‏attach-only وremote CDP: يقوم `openclaw browser stop` بإغلاق جلسة
  التحكم النشطة وتحرير تجاوزات محاكاة Playwright/CDP ‏(منفذ العرض،
  ومخطط الألوان، واللغة المحلية، والمنطقة الزمنية، ووضع offline، والحالة المماثلة)،
  حتى وإن لم تُشغّل OpenClaw أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ Remote CDP مصادقة:

- Query tokens ‏(مثل `https://provider.example?token=<token>`)
- HTTP Basic auth ‏(مثل `https://user:pass@provider.example`)

تحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل متغيرات البيئة أو مديري الأسرار من أجل
الرموز بدلًا من تضمينها في ملفات الإعدادات.

## وكيل متصفح Node ‏(افتراضي من دون إعداد)

إذا كنت تشغّل **مضيف node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى تلك node من دون أي إعداد إضافي للمتصفح.
وهذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يكشف مضيف node خادم التحكم المحلي في المتصفح عبر **أمر وكيل**.
- تأتي profiles من إعدادات `browser.profiles` الخاصة بالـ node نفسها (مثل المحلي).
- تكون `nodeHost.browserProxy.allowProfiles` اختيارية. اتركها فارغة لسلوك الرجوع/الافتراضي القديم: تظل جميع profiles المضبوطة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف profile.
- إذا قمت بضبط `nodeHost.browserProxy.allowProfiles`، فإن OpenClaw تتعامل معها على أنها حد أقل امتيازًا: لا يمكن استهداف إلا profiles الموجودة في قائمة السماح، كما يتم حظر مسارات إنشاء/حذف profiles الدائمة على سطح الوكيل.
- عطّلها إذا كنت لا تريد ذلك:
  - على node: ‏`nodeHost.browserProxy.enabled=false`
  - على gateway: ‏`gateway.nodes.browser.mode="off"`

## Browserless ‏(CDP بعيدة مستضافة)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تكشف
عناوين اتصال CDP عبر HTTPS وWebSocket. ويمكن لـ OpenClaw استخدام أيٍّ من الشكلين، لكن
بالنسبة إلى profile متصفح بعيدة فإن أبسط خيار هو عنوان WebSocket المباشر
من وثائق اتصال Browserless.

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

- استبدل `<BROWSERLESS_API_KEY>` برمز Browserless الحقيقي لديك.
- اختر نقطة نهاية المنطقة المطابقة لحساب Browserless لديك (راجع وثائقهم).
- إذا أعطتك Browserless عنوان HTTPS أساسيًا، فيمكنك إما تحويله إلى
  `wss://` من أجل اتصال CDP مباشر، أو الاحتفاظ بعنوان HTTPS وترك OpenClaw
  تكتشف `/json/version`.

## موفرو CDP المباشرة عبر WebSocket

تكشف بعض خدمات المتصفح المستضافة **نقطة نهاية WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المعتمد على HTTP ‏(`/json/version`). تقبل OpenClaw ثلاثة
أشكال لعناوين CDP URL وتختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  تستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger URL، ثم
  تتصل. ولا يوجد رجوع إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  تتصل OpenClaw مباشرة عبر مصافحة WebSocket وتتخطى
  `/json/version` بالكامل.
- **جذور WebSocket العارية** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` ‏(مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). تحاول OpenClaw أولًا
  اكتشاف HTTP ‏`/json/version` ‏(مع تطبيع المخطط إلى `http`/`https`)؛
  وإذا أعاد الاكتشاف `webSocketDebuggerUrl` تُستخدم، وإلا فإن OpenClaw
  ترجع إلى مصافحة WebSocket مباشرة عند الجذر العاري. ويتيح هذا
  لاتصال bare ‏`ws://` موجّه إلى Chrome محلية أن ينجح أيضًا، لأن Chrome لا
  تقبل ترقيات WebSocket إلا على مسار الهدف المحدد لكل غرض من
  `/json/version`.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء
سكنيين.

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
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي.
- تقوم Browserbase بإنشاء جلسة متصفح تلقائيًا عند اتصال WebSocket، لذلك
  لا حاجة إلى خطوة إنشاء جلسة يدويًا.
- يتيح المستوى المجاني جلسة متزامنة واحدة وساعة متصفح واحدة في الشهر.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على
  المرجع الكامل لـ API، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- يكون التحكم بالمتصفح مقتصرًا على loopback فقط؛ ويتدفق الوصول عبر مصادقة Gateway أو اقتران node.
- يستخدم Browser HTTP API المستقلة على loopback **مصادقة السر المشترك فقط**:
  مصادقة bearer برمز gateway، أو `x-openclaw-password`، أو HTTP Basic auth مع
  كلمة مرور gateway المضبوطة.
- لا تقوم رؤوس هوية Tailscale Serve ولا `gateway.auth.mode: "trusted-proxy"`
  بمصادقة Browser API المستقلة على loopback.
- إذا تم تمكين التحكم بالمتصفح ولم يتم ضبط مصادقة سر مشترك، فإن OpenClaw
  تنشئ `gateway.auth.token` تلقائيًا عند البدء وتحفظها في الإعدادات.
- لا تقوم OpenClaw **بإنشاء** هذا الرمز تلقائيًا عندما تكون `gateway.auth.mode`
  مضبوطة أصلًا على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات node على شبكة خاصة (Tailscale)؛ وتجنب التعرض العام.
- تعامل مع عناوين/tokens الخاصة بـ Remote CDP على أنها أسرار؛ وفضّل متغيرات البيئة أو مدير أسرار.

نصائح Remote CDP:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين رموز طويلة العمر مباشرة في ملفات الإعدادات.

## Profiles ‏(متعددة المتصفحات)

يدعم OpenClaw عدة profiles مسماة (إعدادات توجيه). ويمكن أن تكون profiles:

- **مُدارة بواسطة openclaw**: مثيل متصفح مخصص مبني على Chromium مع دليل بيانات مستخدم خاص به + منفذ CDP
- **بعيدة**: عنوان CDP URL صريح (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: profile ‏Chrome الحالية لديك عبر الاتصال التلقائي Chrome DevTools MCP

القيم الافتراضية:

- يتم إنشاء profile ‏`openclaw` تلقائيًا إذا كانت مفقودة.
- تكون profile ‏`user` مضمّنة من أجل ارتباط Chrome MCP للجلسات الموجودة.
- تكون profiles من نوع existing-session اختيارية beyond ‏`user`؛ أنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف profile إلى نقل دليل بياناتها المحلي إلى Trash.

تقبل كل نقاط النهاية الخاصة بالتحكم `?profile=<name>`؛ وتستخدم CLI القيمة `--browser-profile`.

## existing-session عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بمتصفح Chromium-based يعمل بالفعل من خلال
خادم Chrome DevTools MCP الرسمي. ويؤدي هذا إلى إعادة استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في profile ذلك المتصفح.

المراجع الرسمية للخلفية والإعداد:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة المتصفح الخاصة بك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [ملف README الخاص بـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

profile المضمنة:

- `user`

اختياري: أنشئ profile existing-session مخصصة إذا كنت تريد
اسمًا مختلفًا أو لونًا مختلفًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- تستخدم profile المضمنة `user` الاتصال التلقائي عبر Chrome MCP، والذي يستهدف
  profile ‏Google Chrome المحلية الافتراضية.

استخدم `userDataDir` من أجل Brave أو Edge أو Chromium أو profile ‏Chrome غير افتراضية:

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

1. افتح صفحة الفحص الخاصة بذلك المتصفح من أجل التصحيح البعيد.
2. فعّل التصحيح البعيد.
3. أبقِ المتصفح يعمل ووافق على مطالبة الاتصال عندما ترتبط OpenClaw.

صفحات الفحص الشائعة:

- Chrome: ‏`chrome://inspect/#remote-debugging`
- Brave: ‏`brave://inspect/#remote-debugging`
- Edge: ‏`edge://inspect/#remote-debugging`

اختبار smoke للارتباط المباشر:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

كيف يبدو النجاح:

- تعرض `status` القيمة `driver: existing-session`
- تعرض `status` القيمة `transport: chrome-mcp`
- تعرض `status` القيمة `running: true`
- تعرض `tabs` علامات التبويب المفتوحة بالفعل في المتصفح
- تعيد `snapshot` مراجع refs من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم يعمل الارتباط:

- أن يكون إصدار المتصفح المستهدف المبني على Chromium هو `144+`
- تم تمكين التصحيح البعيد في صفحة الفحص الخاصة بذلك المتصفح
- عرض المتصفح مطالبة الموافقة على الارتباط وقمت بقبولها
- تقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على extension وتتحقق من
  أن Chrome مثبتة محليًا للprofiles الافتراضية ذات الاتصال التلقائي، لكنها لا تستطيع
  تمكين التصحيح البعيد من جهة المتصفح نيابة عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجّل الدخول بها الخاصة بالمستخدم.
- إذا كنت تستخدم profile existing-session مخصصة، فمرّر اسم تلك profile صراحةً.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على
  مطالبة الارتباط.
- يمكن لـ Gateway أو مضيف node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- يُعد هذا المسار أعلى خطورة من profile ‏`openclaw` المعزولة لأنه يستطيع
  العمل داخل جلسة المتصفح المسجّل الدخول بها لديك.
- لا تقوم OpenClaw بتشغيل المتصفح لهذا driver؛ بل ترتبط فقط.
- تستخدم OpenClaw التدفق الرسمي لـ Chrome DevTools MCP ‏`--autoConnect` هنا. وإذا
  تم ضبط `userDataDir`، فإنه يُمرر لاستهداف دليل بيانات المستخدم ذاك.
- يمكن لـ existing-session الارتباط على المضيف المحدد أو عبر
  browser node متصلة. وإذا كانت Chrome موجودة في مكان آخر ولم تكن هناك browser node متصلة، فاستخدم
  remote CDP أو مضيف node بدلًا من ذلك.

<Accordion title="قيود ميزات existing-session">

مقارنةً مع profile ‏`openclaw` المُدارة، تكون drivers من نوع existing-session أكثر تقييدًا:

- **لقطات الشاشة** — تعمل عمليات التقاط الصفحة وعمليات التقاط العناصر عبر `--ref`؛ أما CSS `--element` فلا تعمل. ولا يمكن الجمع بين `--full-page` و`--ref` أو `--element`. ولا تتطلب Playwright لقطات شاشة الصفحة أو العناصر القائمة على ref.
- **الإجراءات** — تتطلب `click`, `type`, `hover`, `scrollIntoView`, `drag`, و`select` مراجع snapshot ‏(ولا تدعم CSS selectors). وتقتصر `click` على الزر الأيسر فقط. ولا تدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`. ولا تدعم `press` المعلمة `delayMs`. ولا تدعم `hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلات timeout خاصة بكل استدعاء. وتقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** — يدعم `wait --url` الأنماط exact وsubstring وglob؛ ولا يدعم `wait --load networkidle`. وتتطلب hooks الخاصة بالرفع `ref` أو `inputRef`، ملفًا واحدًا في كل مرة، ومن دون CSS `element`. ولا تدعم hooks مربعات الحوار تجاوزات timeout.
- **ميزات خاصة بالوضع المُدار فقط** — لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس profile متصفحك الشخصية أبدًا.
- **منافذ مخصصة**: يتجنب `9222` لتفادي التعارضات مع تدفقات التطوير.
- **تحكم حتمي في علامات التبويب**: استهدف علامات التبويب عبر `targetId`، وليس "آخر علامة تبويب".

## اختيار المتصفح

عند التشغيل محليًا، تختار OpenClaw أول متصفح متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز عبر `browser.executablePath`.

المنصات:

- macOS: يفحص `/Applications` و`~/Applications`.
- Linux: يبحث عن `google-chrome`, `brave`, `microsoft-edge`, `chromium`، إلخ.
- Windows: يفحص مواقع التثبيت الشائعة.

## Control API ‏(اختياري)

لأغراض السكربتات والتصحيح، تكشف Gateway واجهة **HTTP تحكم صغيرة مقتصرة على loopback**
بالإضافة إلى CLI مطابقة باسم `openclaw browser` ‏(لقطات snapshots، وrefs، وتعزيزات الانتظار،
وإخراج JSON، وتدفقات التصحيح). راجع
[Browser control API](/ar/tools/browser-control) للحصول على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

بالنسبة إلى مشكلات Linux الخاصة (وخاصة snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

بالنسبة إلى إعدادات WSL2 Gateway + Windows Chrome المنقسمة بين مضيفين، راجع
[استكشاف أخطاء WSL2 + Windows + remote Chrome CDP وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF أثناء الملاحة

هذان صنفان مختلفان من الإخفاقات ويشيران إلى مسارات شيفرة مختلفة.

- **فشل بدء أو جاهزية CDP** يعني أن OpenClaw لا تستطيع تأكيد سلامة طبقة التحكم بالمتصفح.
- **حظر SSRF أثناء الملاحة** يعني أن طبقة التحكم بالمتصفح سليمة، لكن هدف ملاحة الصفحة مرفوض بسبب السياسة.

أمثلة شائعة:

- فشل بدء أو جاهزية CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر SSRF أثناء الملاحة:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ سياسة متصفح/شبكة بينما تستمر `start` و`tabs` في العمل

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشلت `start` مع `not reachable after start`، فابدأ بتصحيح جاهزية CDP أولًا.
- إذا نجحت `start` لكن فشلت `tabs`، فلا تزال طبقة التحكم غير سليمة. تعامل مع هذا على أنه مشكلة وصول CDP، لا مشكلة ملاحة صفحة.
- إذا نجحت `start` و`tabs` لكن فشلت `open` أو `navigate`، فهذا يعني أن طبقة التحكم بالمتصفح تعمل وأن الفشل في سياسة الملاحة أو الصفحة المستهدفة.
- إذا نجحت `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تستخدم إعدادات المتصفح افتراضيًا كائن سياسة SSRF يفشل بشكل مغلق حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى profile ‏`openclaw` المُدارة المحلية على loopback، تتخطى فحوصات صحة CDP عمدًا فرض الوصول SSRF الخاص بالمتصفح من أجل طبقة التحكم المحلية الخاصة بـ OpenClaw نفسها.
- تكون حماية الملاحة منفصلة. ونجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح.

إرشادات الأمان:

- **لا** تخفف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` على الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في بيئات موثوقة عمدًا حيث يكون الوصول إلى المتصفح ضمن الشبكة الخاصة مطلوبًا ومراجعًا.

## أدوات الوكيل + كيف يعمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيف يتم الربط:

- تعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- تستخدم `browser act` معرّفات `ref` من snapshot من أجل click/type/drag/select.
- تلتقط `browser screenshot` البكسلات (صفحة كاملة أو عنصر).
- تقبل `browser`:
  - `profile` لاختيار profile متصفح مسماة (openclaw أو chrome أو remote CDP).
  - `target` ‏(`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات المعزولة، تتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: تستخدم الجلسات المعزولة افتراضيًا `sandbox`، وتستخدم الجلسات غير المعزولة افتراضيًا `host`.
  - إذا كانت هناك browser node قادرة متصلة، فقد تقوم الأداة بالتوجيه إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

وهذا يبقي الوكيل حتميًا ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم بالمتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم بالمتصفح وتقويته

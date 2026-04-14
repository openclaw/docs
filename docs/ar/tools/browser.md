---
read_when:
    - إضافة أتمتة متصفح يتحكم بها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المتكاملة في المتصفح + أوامر الإجراءات
title: المتصفح (تحت إدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-14T13:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# المتصفح (تحت إدارة openclaw)

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (حلقة محلية فقط).

عرض المبتدئين:

- فكّر فيه على أنه **متصفح منفصل مخصص للوكيل فقط**.
- ملف تعريف `openclaw` **لا** يلمس ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات التبويب وقراءة الصفحات والنقر والكتابة** ضمن مسار آمن.
- يرتبط ملف تعريف `user` المدمج بجلسة Chrome الحقيقية المسجل الدخول إليها عبر Chrome MCP.

## ما الذي ستحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بلمسة برتقالية افتراضيًا).
- تحكم حتمي بعلامات التبويب (إدراج/فتح/تركيز/إغلاق).
- إجراءات الوكيل (النقر/الكتابة/السحب/التحديد)، واللقطات، ولقطات الشاشة، وملفات PDF.
- دعم اختياري لملفات تعريف متعددة (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. إنه مساحة آمنة ومعزولة
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

إذا كان `openclaw browser` مفقودًا بالكامل، أو إذا قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح المفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية أصبحت الآن Plugin مدمجًا ويأتي مفعّلًا
افتراضيًا. وهذا يعني أنه يمكنك تعطيله أو استبداله دون إزالة بقية
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

قم بتعطيل Plugin المدمج قبل تثبيت Plugin آخر يوفّر
اسم الأداة `browser` نفسه. تتطلب تجربة المتصفح الافتراضية كلا الأمرين:

- `plugins.entries.browser.enabled` غير معطّل
- `browser.enabled=true`

إذا عطّلت الـ Plugin فقط، فإن CLI المتصفح المدمج (`openclaw browser`)
وطريقة gateway (`browser.request`) وأداة الوكيل وخدمة التحكم الافتراضية في المتصفح
ستختفي كلها معًا. ستبقى إعدادات `browser.*` كما هي
ليعيد Plugin بديل استخدامها.

يمتلك Plugin المتصفح المدمج الآن أيضًا تنفيذ وقت تشغيل المتصفح.
ويحتفظ Core فقط بمساعدات Plugin SDK المشتركة بالإضافة إلى عمليات إعادة تصدير
توافقية لمسارات الاستيراد الداخلية الأقدم. عمليًا، تؤدي إزالة
حزمة Plugin المتصفح أو استبدالها إلى إزالة مجموعة ميزات المتصفح بدلًا
من ترك وقت تشغيل ثانٍ يملكه Core.

لا تزال تغييرات إعدادات المتصفح تتطلب إعادة تشغيل Gateway حتى يتمكن Plugin
المدمج من إعادة تسجيل خدمة المتصفح الخاصة به باستخدام الإعدادات الجديدة.

## أمر أو أداة المتصفح المفقودة

إذا أصبح `openclaw browser` فجأة أمرًا غير معروف بعد الترقية، أو
أبلغ الوكيل أن أداة المتصفح مفقودة، فالسبب الأكثر شيوعًا هو وجود
قائمة `plugins.allow` مقيّدة لا تتضمن `browser`.

مثال على إعدادات معطّلة:

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

- `browser.enabled=true` ليس كافيًا وحده عندما يتم تعيين `plugins.allow`.
- `plugins.entries.browser.enabled=true` ليس كافيًا وحده أيضًا عندما يتم تعيين `plugins.allow`.
- `tools.alsoAllow: ["browser"]` **لا** يحمّل Plugin المتصفح المدمج. بل يضبط فقط سياسة الأدوات بعد أن يكون Plugin قد تم تحميله بالفعل.
- إذا لم تكن بحاجة إلى قائمة سماح مقيّدة للـ Plugin، فإن إزالة `plugins.allow` تعيد أيضًا سلوك المتصفح المدمج الافتراضي.

الأعراض المعتادة:

- `openclaw browser` أمر غير معروف.
- `browser.request` مفقود.
- يبلّغ الوكيل أن أداة المتصفح غير متاحة أو مفقودة.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب أي إضافة).
- `user`: ملف تعريف إرفاق Chrome MCP مدمج لجلسة **Chrome الحقيقية المسجل الدخول إليها**
  الخاصة بك.

بالنسبة لاستدعاءات أداة متصفح الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجل الدخول إليها مهمة ويكون المستخدم
  موجودًا أمام الجهاز للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

عيّن `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // فعّل هذا فقط عند الاشتراك المقصود في الوصول إلى شبكة خاصة موثوقة
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

- ترتبط خدمة التحكم في المتصفح بحلقة محلية على منفذ مشتق من `gateway.port`
  (الافتراضي: `18791`، أي gateway + 2).
- إذا تجاوزت منفذ Gateway (`gateway.port` أو `OPENCLAW_GATEWAY_PORT`)،
  فإن منافذ المتصفح المشتقة تتغيّر للحفاظ على بقائها ضمن "العائلة" نفسها.
- يستخدم `cdpUrl` منفذ CDP المحلي المُدار افتراضيًا عند عدم تعيينه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات الوصول إلى CDP البعيد (غير الخاص بالحلقة المحلية).
- ينطبق `remoteCdpHandshakeTimeoutMs` على فحوصات الوصول إلى WebSocket لـ CDP البعيد.
- تتم حماية التنقل/فتح علامة تبويب في المتصفح من SSRF قبل التنقل، وتُعاد محاولة التحقق بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد التنقل.
- في وضع SSRF الصارم، يتم أيضًا التحقق من اكتشاف/فحص نقطة نهاية CDP البعيدة (`cdpUrl`، بما في ذلك عمليات البحث `/json/version`).
- يكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا افتراضيًا. اضبطه على `true` فقط عندما تثق عمدًا في الوصول إلى المتصفح عبر شبكة خاصة.
- لا يزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم من أجل التوافق.
- `attachOnly: true` يعني "لا تُشغّل متصفحًا محليًا أبدًا؛ ارتبط فقط إذا كان يعمل بالفعل."
- يقوم `color` و`color` لكل ملف تعريف بتلوين واجهة المتصفح حتى تتمكن من معرفة ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` (متصفح OpenClaw مستقل تحت الإدارة). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجل الدخول إليه.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مستندًا إلى Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- تقوم ملفات تعريف `openclaw` المحلية بتعيين `cdpPort`/`cdpUrl` تلقائيًا — اضبط هذه القيم فقط لـ CDP البعيد.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا
  تقم بتعيين `cdpUrl` لهذا المشغل.
- عيّن `browser.profiles.<name>.userDataDir` عندما ينبغي لملف تعريف existing-session
  الارتباط بملف تعريف مستخدم Chromium غير افتراضي مثل Brave أو Edge.

## استخدام Brave (أو أي متصفح آخر مستند إلى Chromium)

إذا كان متصفح **النظام الافتراضي** لديك مستندًا إلى Chromium (Chrome/Brave/Edge/إلخ)،
فإن OpenClaw يستخدمه تلقائيًا. عيّن `browser.executablePath` لتجاوز
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

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم عبر الحلقة المحلية ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف node):** شغّل مضيف node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** عيّن `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد مستند إلى Chromium. في هذه الحالة، لن يقوم OpenClaw بتشغيل متصفح محلي.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يقوم `openclaw browser stop` بإيقاف عملية المتصفح التي
  شغّلها OpenClaw
- ملفات تعريف attach-only وCDP البعيدة: يقوم `openclaw browser stop` بإغلاق جلسة
  التحكم النشطة وتحرير تجاوزات محاكاة Playwright/CDP (منفذ العرض،
  ونظام الألوان، واللغة المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، وحالات مشابهة)، حتى
  لو لم يتم تشغيل أي عملية متصفح بواسطة OpenClaw

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد مصادقة:

- رموز استعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل استخدام متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من تضمينها في ملفات الإعدادات.

## وكيل متصفح Node (إعداد صفري افتراضي)

إذا كنت تشغّل **مضيف node** على الجهاز الذي يحتوي على متصفحك، يمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى ذلك الـ Node بدون أي إعدادات متصفح إضافية.
هذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يعرّض مضيف node خادم التحكم المحلي في المتصفح الخاص به عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالعقدة نفسها (مثل المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للحصول على السلوك القديم/الافتراضي: ستظل جميع ملفات التعريف المضبوطة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا قمت بتعيين `nodeHost.browserProxy.allowProfiles`، فسيتعامل OpenClaw معه على أنه حدّ أقل الامتيازات: لا يمكن استهداف سوى ملفات التعريف الموجودة في قائمة السماح، وتُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على الـ gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تعرض
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة لملف تعريف متصفح بعيد فإن أبسط خيار هو عنوان WebSocket المباشر
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
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless الخاص بك (انظر وثائقهم).
- إذا منحك Browserless عنوان URL أساسيًا من نوع HTTPS، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الاحتفاظ بعنوان HTTPS ودع OpenClaw
  يكتشف `/json/version`.

## مزودو WebSocket CDP المباشر

تكشف بعض خدمات المتصفح المستضافة عن نقطة نهاية **WebSocket مباشرة**
بدلًا من اكتشاف CDP القياسي المعتمد على HTTP (`/json/version`). يدعم OpenClaw كلا الخيارين:

- **نقاط نهاية HTTP(S)** — يستدعي OpenClaw ‎`/json/version` لاكتشاف
  عنوان WebSocket الخاص بالمصحح، ثم يتصل به.
- **نقاط نهاية WebSocket** (`ws://` / `wss://`) — يتصل OpenClaw مباشرة،
  متجاوزًا ‎`/json/version`. استخدم هذا لخدمات مثل
  [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)، أو أي مزود يزوّدك
  بعنوان URL لـ WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
المتصفحات بدون واجهة مع دعم مدمج لحل CAPTCHA ووضع التخفي
ووكلاء سكنيين.

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
  الخاص بك من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي الخاص بك.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذلك
  لا حاجة إلى خطوة إنشاء جلسة يدويًا.
- تتيح الخطة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للاطلاع على
  مرجع API الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم في المتصفح يقتصر على الحلقة المحلية فقط؛ ويجري الوصول عبر مصادقة Gateway أو اقتران العقدة.
- تستخدم واجهة HTTP المستقلة للمتصفح على الحلقة المحلية **مصادقة secret مشترك فقط**:
  مصادقة bearer لرمز gateway، أو `x-openclaw-password`، أو HTTP Basic auth مع
  كلمة مرور gateway المضبوطة.
- ترويسات هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` **لا**
  تقوم بمصادقة واجهة المتصفح المستقلة هذه على الحلقة المحلية.
- إذا كان التحكم في المتصفح مفعّلًا ولم يتم إعداد مصادقة secret مشترك، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا ينشئ OpenClaw هذا الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفي عقد على شبكة خاصة (Tailscale)؛ وتجنب تعريضها للعامة.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد على أنها أسرار؛ وفضّل متغيرات البيئة أو مدير الأسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرةً في ملفات الإعدادات.

## ملفات التعريف (متصفحات متعددة)

يدعم OpenClaw ملفات تعريف متعددة مسماة (إعدادات توجيه). يمكن أن تكون ملفات التعريف:

- **تحت إدارة openclaw**: مثيل متصفح مستقل مستند إلى Chromium له دليل بيانات مستخدم خاص + منفذ CDP
- **بعيد**: عنوان CDP URL صريح (متصفح مستند إلى Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف Chrome الحالي الخاص بك عبر الاتصال التلقائي لـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يتم إنشاء ملف التعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- ملف التعريف `user` مدمج لإرفاق جلسة موجودة عبر Chrome MCP.
- ملفات تعريف الجلسات الموجودة اختيارية بخلاف `user`؛ أنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## الجلسة الموجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح مستند إلى Chromium قيد التشغيل من خلال
خادم Chrome DevTools MCP الرسمي. يتيح ذلك إعادة استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح هذا.

مراجع رسمية للخلفية والإعداد:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المدمج:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا إذا كنت تريد
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف التعريف `user` المدمج الاتصال التلقائي لـ Chrome MCP، والذي يستهدف
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

اختبار دخاني للارتباط المباشر:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

شكل النجاح:

- يُظهر `status` القيمة `driver: existing-session`
- يُظهر `status` القيمة `transport: chrome-mcp`
- يُظهر `status` القيمة `running: true`
- يعرض `tabs` علامات التبويب المفتوحة بالفعل في متصفحك
- يُرجع `snapshot` مراجع من علامة التبويب المباشرة المحددة

ما الذي يجب التحقق منه إذا لم ينجح الارتباط:

- أن يكون إصدار المتصفح المستهدف المستند إلى Chromium هو `144+`
- أن يكون تصحيح الأخطاء عن بُعد مفعّلًا في صفحة الفحص الخاصة بذلك المتصفح
- أن يكون المتصفح قد عرض مطالبة موافقة الارتباط وقمت بقبولها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المستندة إلى الإضافات ويتحقق من
  أن Chrome مثبت محليًا لملفات تعريف الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل تصحيح الأخطاء عن بُعد من جهة المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجل دخول المستخدم فيه.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرر اسم ملف التعريف الصريح هذا.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الجهاز للموافقة على
  مطالبة الارتباط.
- يمكن لـ Gateway أو مضيف العقدة تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى خطورة من ملف التعريف `openclaw` المعزول لأنه يمكنه
  العمل داخل جلسة المتصفح المسجل الدخول إليها الخاصة بك.
- لا يقوم OpenClaw بتشغيل المتصفح لهذا المشغل؛ بل يرتبط
  بجلسة موجودة فقط.
- يستخدم OpenClaw تدفق `--autoConnect` الرسمي من Chrome DevTools MCP هنا. إذا
  تم تعيين `userDataDir`، فإن OpenClaw يمرره لاستهداف
  دليل بيانات مستخدم Chromium الصريح هذا.
- تدعم لقطات الشاشة في existing-session التقاط الصفحة ولقطات العناصر باستخدام `--ref`
  من مخرجات اللقطة، لكن ليس محددات CSS `--element`.
- تعمل لقطات شاشة الصفحة في existing-session بدون Playwright عبر Chrome MCP.
  كما تعمل لقطات عناصر `--ref` هناك أيضًا، لكن لا يمكن دمج `--full-page`
  مع `--ref` أو `--element`.
- لا تزال إجراءات existing-session أكثر محدودية من
  مسار المتصفح المُدار:
  - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select`
    مراجع snapshot بدلًا من محددات CSS
  - `click` يقتصر على الزر الأيسر فقط (من دون تجاوزات للأزرار أو المعدّلات)
  - `type` لا يدعم `slowly=true`؛ استخدم `fill` أو `press`
  - `press` لا يدعم `delayMs`
  - لا تدعم `hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate`
    تجاوزات المهلة لكل استدعاء
  - يدعم `select` حاليًا قيمة واحدة فقط
- يدعم `wait --url` في existing-session الأنماط المطابقة التامة والجزئية وglob
  مثل بقية مشغلات المتصفح. أمّا `wait --load networkidle` فغير مدعوم بعد.
- تتطلب خطافات الرفع في existing-session `ref` أو `inputRef`، وتدعم ملفًا واحدًا في كل مرة،
  ولا تدعم الاستهداف عبر CSS `element`.
- لا تدعم خطافات الحوارات في existing-session تجاوزات المهلة.
- لا تزال بعض الميزات تتطلب مسار المتصفح المُدار، بما في ذلك
  الإجراءات المجمعة، وتصدير PDF، واعتراض التنزيلات، و`responsebody`.
- إن existing-session محلي على المضيف. إذا كان Chrome موجودًا على جهاز آخر أو
  ضمن مساحة اسم شبكة مختلفة، فاستخدم CDP البعيد أو مضيف عقدة بدلًا من ذلك.

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس أبدًا ملف تعريف متصفحك الشخصي.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارض مع سير عمل التطوير.
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
- Linux: يبحث عن `google-chrome` و`brave` و`microsoft-edge` و`chromium` وما إلى ذلك.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## Control API (اختياري)

لأغراض التكامل المحلي فقط، يوفّر Gateway واجهة HTTP صغيرة على الحلقة المحلية:

- الحالة/البدء/الإيقاف: `GET /` و`POST /start` و`POST /stop`
- علامات التبويب: `GET /tabs` و`POST /tabs/open` و`POST /tabs/focus` و`DELETE /tabs/:targetId`
- اللقطة/لقطة الشاشة: `GET /snapshot` و`POST /screenshot`
- الإجراءات: `POST /navigate` و`POST /act`
- الخطافات: `POST /hooks/file-chooser` و`POST /hooks/dialog`
- التنزيلات: `POST /download` و`POST /wait/download`
- تصحيح الأخطاء: `GET /console` و`POST /pdf`
- تصحيح الأخطاء: `GET /errors` و`GET /requests` و`POST /trace/start` و`POST /trace/stop` و`POST /highlight`
- الشبكة: `POST /response/body`
- الحالة: `GET /cookies` و`POST /cookies/set` و`POST /cookies/clear`
- الحالة: `GET /storage/:kind` و`POST /storage/:kind/set` و`POST /storage/:kind/clear`
- الإعدادات: `POST /set/offline` و`POST /set/headers` و`POST /set/credentials` و`POST /set/geolocation` و`POST /set/media` و`POST /set/timezone` و`POST /set/locale` و`POST /set/device`

تقبل جميع نقاط النهاية `?profile=<name>`.

إذا كانت مصادقة gateway ذات secret المشترك مهيأة، فإن مسارات HTTP الخاصة بالمتصفح تتطلب المصادقة أيضًا:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` أو HTTP Basic auth باستخدام كلمة المرور هذه

ملاحظات:

- واجهة المتصفح المستقلة هذه على الحلقة المحلية **لا** تستخدم trusted-proxy أو
  ترويسات هوية Tailscale Serve.
- إذا كانت قيمة `gateway.auth.mode` هي `none` أو `trusted-proxy`، فإن مسارات المتصفح
  هذه على الحلقة المحلية لا ترث أوضاع الهوية تلك؛ أبقِها مقتصرة على الحلقة المحلية فقط.

### عقد أخطاء `/act`

يستخدم `POST /act` استجابة خطأ مهيكلة لأخطاء التحقق على مستوى المسار
وأعطال السياسة:

```json
{ "error": "<message>", "code": "ACT_*" }
```

قيم `code` الحالية:

- `ACT_KIND_REQUIRED` (HTTP 400): القيمة `kind` مفقودة أو غير معروفة.
- `ACT_INVALID_REQUEST` (HTTP 400): فشل تطبيع حمولة الإجراء أو التحقق منها.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): تم استخدام `selector` مع نوع إجراء غير مدعوم.
- `ACT_EVALUATE_DISABLED` (HTTP 403): تم تعطيل `evaluate` (أو `wait --fn`) عبر الإعدادات.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): يوجد تعارض بين `targetId` الأعلى مستوى أو المجمّع وهدف الطلب.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): الإجراء غير مدعوم لملفات تعريف existing-session.

قد تُرجع أعطال وقت التشغيل الأخرى أيضًا `{ "error": "<message>" }` من دون
حقل `code`.

### متطلب Playwright

تتطلب بعض الميزات (navigate/act/AI snapshot/role snapshot ولقطات العناصر،
وPDF) وجود Playwright. إذا لم يكن Playwright مثبتًا، فستُرجع نقاط النهاية تلك
خطأ 501 واضحًا.

ما الذي لا يزال يعمل بدون Playwright:

- لقطات ARIA
- لقطات شاشة الصفحة لمتصفح `openclaw` المُدار عندما يكون WebSocket
  CDP لكل علامة تبويب متاحًا
- لقطات شاشة الصفحة لملفات تعريف `existing-session` / Chrome MCP
- لقطات الشاشة المعتمدة على `--ref` في `existing-session` من مخرجات snapshot

ما الذي لا يزال يحتاج إلى Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- لقطات عناصر محددات CSS (`--element`)
- تصدير PDF الكامل للمتصفح

ترفض لقطات العناصر أيضًا `--full-page`؛ إذ يعيد المسار الرسالة `fullPage is
not supported for element screenshots`.

إذا ظهرت لك الرسالة `Playwright is not available in this gateway build`، فقم بتثبيت
حزمة Playwright الكاملة (وليس `playwright-core`) ثم أعد تشغيل gateway، أو أعد تثبيت
OpenClaw مع دعم المتصفح.

#### تثبيت Playwright في Docker

إذا كان Gateway يعمل في Docker، فتجنب `npx playwright` (تعارضات تجاوز npm).
استخدم CLI المدمج بدلًا من ذلك:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

للاحتفاظ بتنزيلات المتصفح، عيّن `PLAYWRIGHT_BROWSERS_PATH` (على سبيل المثال،
`/home/node/.cache/ms-playwright`) وتأكد من حفظ `/home/node` عبر
`OPENCLAW_HOME_VOLUME` أو bind mount. راجع [Docker](/ar/install/docker).

## كيف يعمل (داخليًا)

التدفق عالي المستوى:

- يقبل **خادم تحكم** صغير طلبات HTTP.
- ويتصل بالمتصفحات المستندة إلى Chromium (Chrome/Brave/Edge/Chromium) عبر **CDP**.
- وللإجراءات المتقدمة (النقر/الكتابة/اللقطة/PDF)، يستخدم **Playwright** فوق
  CDP.
- وعندما لا يكون Playwright موجودًا، لا تتوفر سوى العمليات التي لا تعتمد على Playwright.

يبقي هذا التصميم الوكيل على واجهة مستقرة وحتمية مع السماح
لك بتبديل المتصفحات وملفات التعريف المحلية/البعيدة.

## مرجع CLI السريع

تقبل جميع الأوامر `--browser-profile <name>` لاستهداف ملف تعريف محدد.
وتقبل جميع الأوامر أيضًا `--json` للحصول على مخرجات قابلة للقراءة آليًا (حِمولات مستقرة).

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

ملاحظة دورة الحياة:

- بالنسبة إلى ملفات تعريف attach-only وCDP البعيدة، يظل `openclaw browser stop` هو
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

- `upload` و`dialog` هما استدعاءان من نوع **arming**؛ شغّلهما قبل النقر/الضغط
  الذي يفعّل أداة الاختيار/الحوار.
- تكون مسارات مخرجات التنزيل والتتبع مقيّدة بجذور مؤقتة خاصة بـ OpenClaw:
  - التتبعات: `/tmp/openclaw` (الاحتياطي: `${os.tmpdir()}/openclaw`)
  - التنزيلات: `/tmp/openclaw/downloads` (الاحتياطي: `${os.tmpdir()}/openclaw/downloads`)
- تكون مسارات الرفع مقيّدة بجذر رفع مؤقت خاص بـ OpenClaw:
  - الرفوعات: `/tmp/openclaw/uploads` (الاحتياطي: `${os.tmpdir()}/openclaw/uploads`)
- يمكن لـ `upload` أيضًا تعيين مدخلات الملفات مباشرة عبر `--input-ref` أو `--element`.
- `snapshot`:
  - `--format ai` (الافتراضي عند تثبيت Playwright): يعيد لقطة AI بمراجع رقمية (`aria-ref="<n>"`).
  - `--format aria`: يعيد شجرة إمكانية الوصول (من دون مراجع؛ للفحص فقط).
  - `--efficient` (أو `--mode efficient`): إعداد مسبق مضغوط لـ role snapshot (تفاعلي + مضغوط + عمق + قيمة maxChars أقل).
  - الافتراضي في الإعدادات (للأداة/CLI فقط): عيّن `browser.snapshotDefaults.mode: "efficient"` لاستخدام اللقطات الفعالة عندما لا يمرر المستدعي وضعًا (راجع [إعدادات Gateway](/ar/gateway/configuration-reference#browser)).
  - خيارات role snapshot (`--interactive` و`--compact` و`--depth` و`--selector`) تفرض لقطة قائمة على الدور مع مراجع مثل `ref=e12`.
  - يقيّد `--frame "<iframe selector>"` لقطات الدور إلى iframe معيّن (ويقترن بمراجع دور مثل `e12`).
  - ينتج `--interactive` قائمة مسطحة وسهلة الاختيار للعناصر التفاعلية (وهي الأفضل لتوجيه الإجراءات).
  - يضيف `--labels` لقطة شاشة مقتصرة على إطار العرض مع تراكب تسميات المراجع (ويطبع `MEDIA:<path>`).
- تتطلب `click`/`type`/إلخ `ref` من `snapshot` (إما رقمية `12` أو مرجع دور `e12`).
  ومحددات CSS غير مدعومة عمدًا للإجراءات.

## اللقطات والمراجع

يدعم OpenClaw نمطين من “snapshot”:

- **AI snapshot (مراجع رقمية)**: `openclaw browser snapshot` (الافتراضي؛ `--format ai`)
  - المخرجات: لقطة نصية تتضمن مراجع رقمية.
  - الإجراءات: `openclaw browser click 12`، `openclaw browser type 23 "hello"`.
  - داخليًا، يتم حل المرجع عبر `aria-ref` الخاص بـ Playwright.

- **Role snapshot (مراجع أدوار مثل `e12`)**: `openclaw browser snapshot --interactive` (أو `--compact` أو `--depth` أو `--selector` أو `--frame`)
  - المخرجات: قائمة/شجرة قائمة على الدور تتضمن `[ref=e12]` (واختياريًا `[nth=1]`).
  - الإجراءات: `openclaw browser click e12`، `openclaw browser highlight e12`.
  - داخليًا، يتم حل المرجع عبر `getByRole(...)` (مع `nth()` عند التكرار).
  - أضف `--labels` لتضمين لقطة شاشة لإطار العرض مع تراكب تسميات `e12`.

سلوك المراجع:

- المراجع **ليست ثابتة عبر التنقلات**؛ إذا فشل شيء ما، فأعد تشغيل `snapshot` واستخدم مرجعًا جديدًا.
- إذا تم أخذ role snapshot باستخدام `--frame`، فسيتم تقييد مراجع الدور إلى ذلك الـ iframe حتى role snapshot التالية.

## تحسينات الانتظار

يمكنك الانتظار على أكثر من الوقت/النص:

- الانتظار لعنوان URL (مع دعم glob بواسطة Playwright):
  - `openclaw browser wait --url "**/dash"`
- الانتظار لحالة التحميل:
  - `openclaw browser wait --load networkidle`
- الانتظار لشرط JS:
  - `openclaw browser wait --fn "window.ready===true"`
- الانتظار حتى يصبح محدد مرئيًا:
  - `openclaw browser wait "#main"`

يمكن جمعها معًا:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## مسارات تصحيح الأخطاء

عندما يفشل إجراء ما (مثل “not visible” أو “strict mode violation” أو “covered”):

1. `openclaw browser snapshot --interactive`
2. استخدم `click <ref>` / `type <ref>` (وفضّل مراجع الأدوار في الوضع التفاعلي)
3. إذا استمر الفشل: استخدم `openclaw browser highlight <ref>` لمعرفة ما الذي يستهدفه Playwright
4. إذا تصرفت الصفحة بشكل غريب:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. لتصحيح أخطاء أعمق: سجّل تتبعًا:
   - `openclaw browser trace start`
   - أعد إنتاج المشكلة
   - `openclaw browser trace stop` (يطبع `TRACE:<path>`)

## مخرجات JSON

`--json` مخصص للبرمجة والأدوات المنظمة.

أمثلة:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تتضمن role snapshots في JSON قيمة `refs` بالإضافة إلى كتلة `stats` صغيرة (lines/chars/refs/interactive) حتى تتمكن الأدوات من الاستدلال على حجم الحمولة وكثافتها.

## عناصر التحكم في الحالة والبيئة

هذه مفيدة لمسارات عمل “اجعل الموقع يتصرف مثل X”:

- ملفات تعريف الارتباط: `cookies` و`cookies set` و`cookies clear`
- التخزين: `storage local|session get|set|clear`
- دون اتصال: `set offline on|off`
- الترويسات: `set headers --headers-json '{"X-Debug":"1"}'` (لا يزال الشكل القديم `set headers --json '{"X-Debug":"1"}'` مدعومًا)
- مصادقة HTTP basic: `set credentials user pass` (أو `--clear`)
- الموقع الجغرافي: `set geo <lat> <lon> --origin "https://example.com"` (أو `--clear`)
- الوسائط: `set media dark|light|no-preference|none`
- المنطقة الزمنية / اللغة المحلية: `set timezone ...` و`set locale ...`
- الجهاز / إطار العرض:
  - `set device "iPhone 14"` (إعدادات أجهزة Playwright المسبقة)
  - `set viewport 1280 720`

## الأمان والخصوصية

- قد يحتوي ملف تعريف متصفح openclaw على جلسات مسجل الدخول إليها؛ تعامل معه على أنه حساس.
- يقوم `browser act kind=evaluate` / `openclaw browser evaluate` و`wait --fn`
  بتنفيذ JavaScript عشوائي في سياق الصفحة. ويمكن لتوجيهات الحقن في المطالبات
  توجيه هذا السلوك. عطّله عبر `browser.evaluateEnabled=false` إذا لم تكن بحاجة إليه.
- لتسجيلات الدخول وملاحظات مكافحة الروبوتات (X/Twitter وما إلى ذلك)، راجع [تسجيل الدخول في المتصفح + النشر على X/Twitter](/ar/tools/browser-login).
- أبقِ Gateway/مضيف العقدة خاصًا (حلقة محلية أو tailnet فقط).
- نقاط نهاية CDP البعيدة قوية؛ قم بتمريرها عبر نفق واحمها.

مثال للوضع الصارم (حظر الوجهات الخاصة/الداخلية افتراضيًا):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // السماح المطابق تمامًا اختياري
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (وخاصة snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات الاستضافة المنقسمة بين WSL2 Gateway وWindows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF أثناء التنقل

هذان صنفان مختلفان من الأعطال، ويشيران إلى مسارات برمجية مختلفة.

- **فشل بدء CDP أو الجاهزية** يعني أن OpenClaw لا يستطيع التأكد من أن مستوى تحكم المتصفح يعمل بشكل سليم.
- **حظر SSRF أثناء التنقل** يعني أن مستوى تحكم المتصفح يعمل بشكل سليم، لكن هدف تنقل الصفحة مرفوض بموجب السياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- حظر SSRF أثناء التنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ سياسة متصفح/شبكة بينما لا يزال `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع الرسالة `not reachable after start`، فابدأ باستكشاف جاهزية CDP وإصلاحها.
- إذا نجح `start` لكن فشل `tabs`، فهذا يعني أن مستوى التحكم لا يزال غير سليم. تعامل مع هذا على أنه مشكلة في الوصول إلى CDP، وليس مشكلة في تنقل الصفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح يعمل وأن الفشل في سياسة التنقل أو في الصفحة الهدف.
- إذا نجح `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي للمتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تُضبط إعدادات المتصفح افتراضيًا على كائن سياسة SSRF مغلق افتراضيًا حتى عندما لا تقوم بتهيئة `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار المحلي `openclaw` على الحلقة المحلية، فإن فحوصات سلامة CDP تتجاوز عمدًا فرض الوصول الخاص بـ SSRF للمتصفح فيما يتعلق بمستوى التحكم المحلي الخاص بـ OpenClaw نفسه.
- حماية التنقل منفصلة. ونجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تقم بتخفيف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من السماح الواسع بالشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون الوصول إلى المتصفح عبر الشبكة الخاصة مطلوبًا وتمت مراجعته.

مثال: التنقل محظور، ومستوى التحكم سليم

- ينجح `start`
- ينجح `tabs`
- يفشل `open http://internal.example`

وهذا يعني عادةً أن بدء تشغيل المتصفح سليم وأن هدف التنقل يحتاج إلى مراجعة للسياسة.

مثال: بدء التشغيل محظور قبل أن يصبح التنقل مهمًا

- يفشل `start` مع `not reachable after start`
- يفشل `tabs` أيضًا أو لا يمكن تشغيله

وهذا يشير إلى تشغيل المتصفح أو الوصول إلى CDP، وليس إلى مشكلة في قائمة السماح لعناوين URL الخاصة بالصفحات.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من `snapshot` من أجل النقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (الصفحة كاملة أو عنصرًا معينًا).
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` تعيين `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا تم حذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت هناك عقدة متصلة تدعم المتصفح، فقد تقوم الأداة بالتوجيه إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

وهذا يحافظ على حتمية الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وأساليب تقويته

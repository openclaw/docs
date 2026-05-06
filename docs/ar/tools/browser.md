---
read_when:
    - إضافة أتمتة المتصفح التي يتحكم بها الوكيل
    - استكشاف سبب تداخل OpenClaw مع متصفح Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المتكامل في المتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-05-06T18:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c9f79b4f8b9921724130b4793584facf1bfbe2de5fb21faa54274a4294dedd0
    source_path: tools/browser.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **ملف تعريف Chrome/Brave/Edge/Chromium مخصص** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي، وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (استرجاع محلي فقط).

نظرة للمبتدئين:

- فكّر فيه كأنه **متصفح منفصل مخصص للوكيل فقط**.
- لا يلمس ملف تعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح التبويبات، وقراءة الصفحات، والنقر، والكتابة** في مسار آمن.
- يتصل ملف التعريف المدمج `user` بجلسة Chrome الحقيقية المسجل دخولك فيها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيا).
- تحكم حتمي في التبويبات (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات حالة، ولقطات شاشة، وملفات PDF.
- Skill مدمجة باسم `browser-automation` تعلّم الوكلاء حلقة الاسترداد الخاصة بلقطة الحالة،
  والتبويبة المستقرة، والمرجع القديم، والعائق اليدوي عند تمكين
  Plugin المتصفح.
- دعم اختياري لملفات تعريف متعددة (`openclaw`، و`work`، و`remote`، ...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول
لأتمتة الوكيل والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهر لك "Browser disabled"، فمكّنه في الإعدادات (انظر أدناه) وأعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح مفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## تحكم Plugin

أداة `browser` الافتراضية هي Plugin مدمجة. عطّلها لاستبدالها بـ Plugin أخرى تسجل اسم أداة `browser` نفسه:

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

تحتاج الإعدادات الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. تعطيل Plugin فقط يزيل CLI الخاص بـ `openclaw browser`، وطريقة Gateway `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ وتبقى إعدادات `browser.*` لديك سليمة من أجل بديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## إرشادات الوكيل

ملاحظة ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` كل من `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. إذا كان على الوكيل أو
وكيل فرعي مولّد استخدام أتمتة المتصفح، فأضف المتصفح في مرحلة ملف التعريف:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

لوكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
لا يكفي `tools.subagents.tools.allow: ["browser"]` وحده لأن سياسة الوكيل الفرعي
تُطبق بعد ترشيح ملف التعريف.

تشحن Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد المختصر المفعّل دائما: اختر
  ملف التعريف الصحيح، وأبق المراجع على التبويبة نفسها، واستخدم `tabId`/التسميات لاستهداف
  التبويبات، وحمّل Skill المتصفح للعمل متعدد الخطوات.
- تحمل Skill `browser-automation` المدمجة حلقة التشغيل الأطول:
  افحص الحالة/التبويبات أولا، وسمّ تبويبات المهمة، وخذ لقطة حالة قبل التصرف، وأعد أخذ لقطة حالة
  بعد تغييرات الواجهة، واستعد المراجع القديمة مرة واحدة، وأبلغ عن عوائق تسجيل الدخول/2FA/captcha أو
  الكاميرا/الميكروفون كإجراء يدوي بدلا من التخمين.

تُدرج Skills المدمجة مع Plugin ضمن Skills المتاحة للوكيل عندما تكون
Plugin مفعلة. تُحمّل تعليمات Skill الكاملة عند الطلب، لذلك لا تتحمل
الجولات الروتينية تكلفة الرموز الكاملة.

## أمر أو أداة المتصفح مفقودة

إذا أصبح `openclaw browser` غير معروف بعد ترقية، أو كان `browser.request` مفقودا، أو أفاد الوكيل بأن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` تحذف `browser` ولا توجد كتلة إعدادات جذرية `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

تعمل كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو `browser.profiles.<name>`، على تنشيط Plugin المتصفح المدمجة حتى ضمن `plugins.allow` مقيّدة، بما يطابق سلوك إعدادات القناة. لا يحل `plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` محل عضوية قائمة السماح بحد ذاتهما. كما أن إزالة `plugins.allow` بالكامل تستعيد الإعداد الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف Chrome MCP مدمج للإرفاق بجلسة **Chrome الحقيقية المسجل دخولك فيها**.

لاستدعاءات أداة متصفح الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات الحالية المسجل دخولها مهمة ويكون المستخدم
  على الحاسوب للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددا.

اضبط `browser.defaultProfile: "openclaw"` إذا أردت الوضع المُدار افتراضيا.

## الإعدادات

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
    localLaunchTimeoutMs: 15000, // local managed Chrome discovery timeout (ms)
    localCdpReadyTimeoutMs: 8000, // local managed post-launch CDP readiness timeout (ms)
    actionTimeoutMs: 60000, // default browser act timeout (ms)
    tabCleanup: {
      enabled: true, // default: true
      idleMinutes: 120, // set 0 to disable idle cleanup
      maxTabsPerSession: 8, // set 0 to disable the per-session cap
      sweepMinutes: 5,
    },
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
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

<Accordion title="المنافذ وقابلية الوصول">

- ترتبط خدمة التحكم بالاسترجاع المحلي على منفذ مشتق من `gateway.port` (الافتراضي `18791` = Gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى إزاحة المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيا؛ اضبط هذه فقط من أجل CDP البعيد. يكون `cdpUrl` افتراضيا على منفذ CDP المحلي المُدار عند عدم ضبطه.
- ينطبق `remoteCdpTimeoutMs` على فحوص قابلية الوصول عبر HTTP إلى CDP البعيد و`attachOnly`
  وطلبات HTTP لفتح التبويبات؛ وينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات CDP WebSocket الخاصة بها.
- `localLaunchTimeoutMs` هو الميزانية المتاحة لعملية Chrome مُدارة مطلقة محليا
  كي تعرض نقطة نهاية CDP HTTP الخاصة بها. `localCdpReadyTimeoutMs` هو
  الميزانية اللاحقة لجاهزية CDP websocket بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi أو VPS منخفض الموارد أو العتاد الأقدم حيث يبدأ Chromium
  ببطء. يجب أن تكون القيم أعدادا صحيحة موجبة حتى `120000` مللي ثانية؛ وترفض
  قيم الإعدادات غير الصالحة.
- تُكسر دائرة إخفاقات تشغيل/جاهزية Chrome المُدار المتكررة لكل
  ملف تعريف. بعد عدة إخفاقات متتالية، يوقف OpenClaw مؤقتا محاولات التشغيل
  الجديدة لفترة وجيزة بدلا من إطلاق Chromium عند كل استدعاء لأداة المتصفح. أصلح
  مشكلة بدء التشغيل، أو عطّل المتصفح إن لم تكن هناك حاجة إليه، أو أعد تشغيل
  Gateway بعد الإصلاح.
- `actionTimeoutMs` هو الميزانية الافتراضية لطلبات `act` الخاصة بالمتصفح عندما لا يمرر المستدعي `timeoutMs`. يضيف نقل العميل نافذة سماح صغيرة كي تنتهي فترات الانتظار الطويلة بدلا من انتهاء المهلة عند حد HTTP.
- `tabCleanup` هو تنظيف بأفضل جهد للتبويبات التي تفتحها جلسات متصفح الوكيل الأساسي. لا يزال تنظيف دورة حياة الوكلاء الفرعيين وcron وACP يغلق تبويباتها المتتبعة الصريحة عند نهاية الجلسة؛ وتبقي الجلسات الأساسية التبويبات النشطة قابلة لإعادة الاستخدام، ثم تغلق التبويبات المتتبعة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تخضع ملاحة المتصفح وفتح التبويبات لحماية SSRF قبل الملاحة، ويعاد فحص عنوان URL النهائي `http(s)` بعدها بأفضل جهد.
- في وضع SSRF الصارم، يتم فحص اكتشاف نقطة نهاية CDP البعيدة ومجسات `/json/version` (`cdpUrl`) أيضا.
- لا تقوم متغيرات بيئة Gateway/الموفر `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` بتمرير متصفح OpenClaw المُدار عبر وكيل تلقائيا. يبدأ Chrome المُدار باتصال مباشر افتراضيا حتى لا تضعف إعدادات وكيل الموفر فحوص SSRF للمتصفح.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرر رايات Chrome وكيل صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يحظر وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يُمكّن وصول المتصفح إلى الشبكة الخاصة عمدا.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطل افتراضيا؛ مكّنه فقط عندما يكون وصول المتصفح إلى الشبكة الخاصة موثوقا به عمدا.
- يظل `browser.ssrfPolicy.allowPrivateNetwork` مدعوما كاسم بديل قديم.

</Accordion>

<Accordion title="سلوك ملف التعريف">

- يعني `attachOnly: true` عدم تشغيل متصفح محلي أبدا؛ بل الإرفاق فقط إذا كان هناك متصفح قيد التشغيل بالفعل.
- يمكن ضبط `headless` عموميا أو لكل ملف تعريف محلي مدار. تتجاوز القيم الخاصة بملف التعريف `browser.headless`، لذلك يمكن أن يبقى ملف تعريف مشغل محليا دون واجهة مرئية بينما يبقى ملف آخر مرئيا.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless` تشغيلا
  لمرة واحدة دون واجهة مرئية لملفات التعريف المحلية المدارة من دون إعادة كتابة
  `browser.headless` أو إعدادات ملف التعريف. ترفض ملفات تعريف الجلسات الموجودة، والإرفاق فقط،
  وCDP البعيدة هذا التجاوز لأن OpenClaw لا يشغل عمليات
  المتصفح هذه.
- على مضيفي Linux من دون `DISPLAY` أو `WAYLAND_DISPLAY`، تضبط ملفات التعريف المحلية المدارة
  الوضع دون واجهة مرئية تلقائيا عندما لا تختار البيئة ولا إعدادات ملف التعريف/العامة
  وضعا بواجهة مرئية صراحة. يبلغ `openclaw browser status --json`
  عن `headlessSource` بالقيمة `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيل الملفات المحلية المدارة دون واجهة مرئية للعملية
  الحالية. يفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع الواجهة المرئية لعمليات التشغيل العادية
  ويعيد خطأ قابلا للتنفيذ على مضيفي Linux من دون خادم عرض؛
  ولا يزال طلب `start --headless` الصريح هو الفائز في عملية التشغيل تلك فقط.
- يمكن ضبط `executablePath` عموميا أو لكل ملف تعريف محلي مدار. تتجاوز القيم الخاصة بملف التعريف `browser.executablePath`، لذلك يمكن لملفات تعريف مدارة مختلفة تشغيل متصفحات مختلفة مبنية على Chromium. يقبل الشكلان كليهما `~` لدليل المنزل في نظام التشغيل لديك.
- يلون `color` (على المستوى الأعلى ولكل ملف تعريف) واجهة مستخدم المتصفح حتى تتمكن من رؤية ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` (مستقل مدار). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم الذي سجل دخوله.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيا على Chromium؛ وإلا Chrome → Brave → Edge → Chromium → Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلا من CDP الخام. لا تضبط `cdpUrl` لذلك المشغل.
- اضبط `browser.profiles.<name>.userDataDir` عندما ينبغي أن يرفق ملف تعريف جلسة موجودة بملف تعريف مستخدم Chromium غير افتراضي (Brave، Edge، إلخ). يقبل هذا المسار أيضا `~` لدليل المنزل في نظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدم Brave أو متصفحا آخر مبنيا على Chromium

إذا كان متصفح **النظام الافتراضي** لديك مبنيا على Chromium (Chrome/Brave/Edge/إلخ)،
فسيستخدمه OpenClaw تلقائيا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. تقبل قيم `executablePath` على المستوى الأعلى ولكل ملف تعريف `~`
لدليل المنزل في نظام التشغيل لديك:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

أو اضبطه في الإعدادات، لكل منصة:

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

لا يؤثر `executablePath` الخاص بملف التعريف إلا في ملفات التعريف المحلية المدارة التي
يشغلها OpenClaw. ترفق ملفات تعريف `existing-session` بمتصفح قيد التشغيل بالفعل
بدلا من ذلك، وتستخدم ملفات تعريف CDP البعيدة المتصفح خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (افتراضيا):** يشغل Gateway خدمة تحكم local loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ يمرر Gateway إجراءات المتصفح إليه.
- **CDP بعيدة:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الإرفاق بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغل OpenClaw متصفحا محليا.
- لخدمات CDP المدارة خارجيا على loopback (على سبيل المثال Browserless في
  Docker المنشور إلى `127.0.0.1`)، اضبط أيضا `attachOnly: true`. تعامل CDP على loopback
  من دون `attachOnly` كملف تعريف متصفح محلي مدار بواسطة OpenClaw.
- لا يؤثر `headless` إلا في ملفات التعريف المحلية المدارة التي يشغلها OpenClaw. ولا يعيد تشغيل متصفحات الجلسات الموجودة أو CDP البعيدة ولا يغيرها.
- يتبع `executablePath` قاعدة ملف التعريف المحلي المدار نفسها. يؤدي تغييره على
  ملف تعريف محلي مدار قيد التشغيل إلى وضع علامة على ملف التعريف ذاك لإعادة التشغيل/المواءمة حتى
  يستخدم التشغيل التالي الملف الثنائي الجديد.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المدارة: يوقف `openclaw browser stop` عملية المتصفح التي
  شغلها OpenClaw
- ملفات تعريف الإرفاق فقط وCDP البعيدة: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات محاكاة Playwright/CDP (إطار العرض،
  نظام الألوان، اللغة، المنطقة الزمنية، وضع عدم الاتصال، والحالة المشابهة)، حتى
  مع عدم تشغيل أي عملية متصفح بواسطة OpenClaw

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيدة المصادقة:

- رموز الاستعلام (مثلا، `https://provider.example?token=<token>`)
- مصادقة HTTP الأساسية (مثلا، `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضل متغيرات البيئة أو مديري الأسرار للرموز
بدلا من تثبيتها في ملفات الإعدادات.

## وكيل متصفح Node (افتراضي من دون إعداد)

إذا شغلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، يمكن لـ OpenClaw
توجيه استدعاءات أدوات المتصفح تلقائيا إلى ذلك Node من دون أي إعداد متصفح إضافي.
هذا هو المسار الافتراضي للبوابات البعيدة.

ملاحظات:

- يعرض مضيف Node خادم التحكم في المتصفح المحلي الخاص به عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بـ Node نفسه (كما في المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغا للسلوك القديم/الافتراضي: تظل كل ملفات التعريف المهيأة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، يتعامل OpenClaw معه كحد أقل امتيازا: يمكن استهداف ملفات التعريف المدرجة في قائمة السماح فقط، وتحظر مسارات إنشاء/حذف ملفات التعريف المستمرة على سطح الوكيل.
- عطله إذا لم تكن تريده:
  - على Node: `nodeHost.browserProxy.enabled=false`
  - على Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيدة مستضافة)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تعرض
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
لملف تعريف متصفح بعيد يكون أبسط خيار هو عنوان WebSocket المباشر
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
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless لديك (راجع وثائقهم).
- إذا أعطاك Browserless عنوان URL أساسيا لـ HTTPS، يمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الاحتفاظ بعنوان HTTPS وترك OpenClaw
  يكتشف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما يكون Browserless مستضافا ذاتيا في Docker ويعمل OpenClaw على المضيف، تعامل مع
Browserless كخدمة CDP مدارة خارجيا:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

يجب أن يكون العنوان في `browser.profiles.browserless.cdpUrl` قابلا للوصول من عملية
OpenClaw. يجب أن يعلن Browserless أيضا عن نقطة نهاية مطابقة قابلة للوصول؛ اضبط `EXTERNAL` في Browserless إلى قاعدة WebSocket نفسها العامة إلى OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان شبكة Docker
خاص ثابت. إذا أعاد `/json/version` قيمة `webSocketDebuggerUrl` تشير إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد تبدو CDP HTTP سليمة بينما يفشل
إرفاق WebSocket مع ذلك.

لا تترك `attachOnly` غير مضبوط لملف تعريف Browserless على loopback. من دون
`attachOnly`، يتعامل OpenClaw مع منفذ loopback كملف تعريف متصفح محلي مدار
وقد يبلغ بأن المنفذ قيد الاستخدام لكنه ليس مملوكا لـ OpenClaw.

## مزودو CDP المباشر عبر WebSocket

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلا من
اكتشاف CDP القياسي المبني على HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال المناسبة تلقائيا:

- **اكتشاف HTTP(S)** - `http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw `/json/version` لاكتشاف عنوان URL لمصحح WebSocket، ثم
  يتصل. لا يوجد رجوع احتياطي إلى WebSocket.
- **نقاط نهاية WebSocket مباشرة** - `ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتخطى
  `/json/version` بالكامل.
- **جذور WebSocket مجردة** - `ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). يحاول OpenClaw اكتشاف
  `/json/version` عبر HTTP أولا (مع توحيد المخطط إلى `http`/`https`)؛
  إذا أعاد الاكتشاف `webSocketDebuggerUrl` فيتم استخدامه، وإلا يرجع OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر المجرد. إذا رفضت نقطة نهاية
  WebSocket المعلن عنها مصافحة CDP لكن الجذر المجرد المهيأ
  قبلها، يرجع OpenClaw إلى ذلك الجذر أيضا. يتيح هذا لجذر مجرد `ws://`
  موجه إلى Chrome محلي أن يتصل رغم ذلك، لأن Chrome لا يقبل ترقيات WebSocket
  إلا على المسار المحدد لكل هدف من `/json/version`، بينما لا يزال بإمكان
  المزودين المستضافين استخدام نقطة نهاية WebSocket الجذرية لديهم عندما تعلن نقطة نهاية
  الاكتشاف لديهم عن عنوان URL قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
متصفحات دون واجهة مرئية مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء
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

- [سجل](https://www.browserbase.com/sign-up) وانسخ **API Key**
  من [لوحة معلومات Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح API الحقيقي الخاص بـ Browserbase لديك.
- ينشئ Browserbase جلسة متصفح تلقائيا عند الاتصال عبر WebSocket، لذلك لا
  حاجة إلى خطوة إنشاء جلسة يدوية.
- تتيح الطبقة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم في المتصفح مقتصر على loopback فقط؛ تمر مسارات الوصول عبر مصادقة Gateway أو اقتران العقدة.
- تستخدم واجهة HTTP API المستقلة لمتصفح loopback **مصادقة السر المشترك فقط**:
  مصادقة حامل رمز gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic باستخدام
  كلمة مرور gateway المضبوطة.
- رؤوس هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` لا
  **تصادق** على واجهة API المستقلة هذه لمتصفح loopback.
- إذا كان التحكم في المتصفح مفعلا ولم تضبط مصادقة بسر مشترك، فإن OpenClaw
  ينشئ رمز gateway خاصا بوقت التشغيل فقط لعملية البدء تلك. اضبط
  `gateway.auth.token`، أو `gateway.auth.password`، أو `OPENCLAW_GATEWAY_TOKEN`، أو
  `OPENCLAW_GATEWAY_PASSWORD` صراحة إذا احتاج العملاء إلى سر ثابت عبر
  عمليات إعادة التشغيل.
- لا ينشئ OpenClaw ذلك الرمز تلقائيا عندما يكون `gateway.auth.mode`
  مضبوطا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبق Gateway وأي مضيفي عقد على شبكة خاصة (Tailscale)؛ وتجنب التعريض العام.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد كأسرار؛ ويفضل استخدام متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات الإعداد.

## ملفات التعريف (متعدد المتصفحات)

يدعم OpenClaw عدة ملفات تعريف مسماة (إعدادات توجيه). يمكن أن تكون ملفات التعريف:

- **openclaw-managed**: نسخة مخصصة من متصفح مبني على Chromium مع دليل بيانات مستخدم خاص بها + منفذ CDP
- **remote**: عنوان CDP URL صريح (متصفح مبني على Chromium يعمل في مكان آخر)
- **existing session**: ملف تعريف Chrome الحالي لديك عبر الاتصال التلقائي لـ Chrome DevTools MCP

الإعدادات الافتراضية:

- ينشأ ملف التعريف `openclaw` تلقائيا إذا كان مفقودا.
- ملف التعريف `user` مدمج لإرفاق جلسة Chrome MCP الحالية.
- ملفات تعريف الجلسة الحالية اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- تخصص منافذ CDP المحلية من **18800-18899** افتراضيا.
- حذف ملف تعريف ينقل دليل بياناته المحلي إلى سلة المهملات.

تقبل كل نقاط نهاية التحكم `?profile=<name>`؛ وتستخدم CLI الخيار `--browser-profile`.

## الجلسة الحالية عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضا الإرفاق بملف تعريف متصفح مبني على Chromium قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. يعيد ذلك استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف تعريف المتصفح ذلك.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المدمج:

- `user`

اختياري: أنشئ ملف تعريف جلسة حالية مخصصا إذا أردت
اسما أو لونا أو دليل بيانات متصفح مختلفا.

السلوك الافتراضي:

- يستخدم ملف التعريف المدمج `user` الاتصال التلقائي لـ Chrome MCP، والذي يستهدف
  ملف تعريف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` لـ Brave أو Edge أو Chromium أو ملف تعريف Chrome غير افتراضي.
يوسع `~` إلى دليل المنزل في نظام التشغيل لديك:

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

1. افتح صفحة الفحص لذلك المتصفح للتصحيح عن بعد.
2. فعل التصحيح عن بعد.
3. أبق المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرفق OpenClaw.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار دخان للإرفاق الحي:

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
- يسرد `tabs` علامات تبويب المتصفح المفتوحة لديك بالفعل
- يعيد `snapshot` مراجع من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم يعمل الإرفاق:

- المتصفح الهدف المبني على Chromium بإصدار `144+`
- التصحيح عن بعد مفعل في صفحة الفحص لذلك المتصفح
- عرض المتصفح مطالبة موافقة الإرفاق وقبلتها
- يرحل `openclaw doctor` إعداد المتصفح القديم القائم على Plugin ويتحقق من أن
  Chrome مثبت محليا لملفات تعريف الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل التصحيح عن بعد من جانب المتصفح نيابة عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة متصفح المستخدم المسجل دخوله.
- إذا استخدمت ملف تعريف جلسة حالية مخصصا، فمرر اسم ملف التعريف الصريح ذلك.
- اختر هذا الوضع فقط عندما يكون المستخدم على الكمبيوتر للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف العقدة تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من ملف التعريف المعزول `openclaw` لأنه يمكنه
  العمل داخل جلسة المتصفح المسجل دخولك فيها.
- لا يطلق OpenClaw المتصفح لهذا المشغل؛ بل يرفق فقط.
- يستخدم OpenClaw هنا مسار Chrome DevTools MCP الرسمي `--autoConnect`. إذا
  ضبط `userDataDir`، فإنه يمرر لاستهداف دليل بيانات المستخدم ذلك.
- يمكن للجلسة الحالية الإرفاق على المضيف المحدد أو عبر عقدة متصفح متصلة.
  إذا كان Chrome موجودا في مكان آخر ولم تكن هناك عقدة متصفح متصلة، فاستخدم
  CDP بعيدا أو مضيف عقدة بدلا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP المشغل لكل ملف تعريف عندما لا يكون مسار
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفون غير متصلين،
إصدارات مثبتة، ثنائيات موردة):

| الحقل        | ما يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | ملف تنفيذي يشغل بدلا من `npx`. يحل كما هو؛ وتحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة وسيطات تمرر حرفيا إلى `mcpCommand`. تستبدل وسيطات `chrome-devtools-mcp@latest --autoConnect` الافتراضية. |

عندما يضبط `cdpUrl` على ملف تعريف جلسة حالية، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيا:

- `http(s)://...` → `--browserUrl <url>` (نقطة نهاية اكتشاف HTTP الخاصة بـ DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مباشر).

لا يمكن دمج أعلام نقاط النهاية و`userDataDir`: عندما يضبط `cdpUrl`،
يتجاهل `userDataDir` لتشغيل Chrome MCP، لأن Chrome MCP يرفق بالمتصفح
قيد التشغيل خلف نقطة النهاية بدلا من فتح دليل ملف تعريف.

<Accordion title="Existing-session feature limitations">

مقارنة بملف التعريف المدار `openclaw`، تكون مشغلات الجلسة الحالية أكثر تقييدا:

- **لقطات الشاشة** - تعمل لقطات الصفحة والتقاط عناصر `--ref`؛ ولا تعمل محددات CSS `--element`. لا يمكن دمج `--full-page` مع `--ref` أو `--element`. لا يكون Playwright مطلوبا للصفحة أو لقطات عناصر قائمة على المرجع.
- **الإجراءات** - تتطلب `click`، و`type`، و`hover`، و`scrollIntoView`، و`drag`، و`select` مراجع لقطة (بلا محددات CSS). ينقر `click-coords` إحداثيات إطار العرض المرئية ولا يتطلب مرجع لقطة. `click` بزر اليسار فقط. لا يدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`. لا يدعم `press` الخيار `delayMs`. لا تدعم `type`، و`hover`، و`scrollIntoView`، و`drag`، و`select`، و`fill`، و`evaluate` مهلات لكل استدعاء. يقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** - يدعم `wait --url` أنماط المطابقة الدقيقة والجزئية وglob؛ ولا يدعم `wait --load networkidle`. تتطلب خطافات الرفع `ref` أو `inputRef`، ملفا واحدا في كل مرة، بلا `element` من CSS. لا تدعم خطافات مربع الحوار تجاوزات المهلة.
- **ميزات المدار فقط** - ما زالت الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس أبدا ملف تعريف متصفحك الشخصي.
- **منافذ مخصصة**: يتجنب `9222` لمنع التصادم مع سير عمل التطوير.
- **تحكم حتمي في علامات التبويب**: يعيد `tabs` أولا `suggestedTargetId`، ثم
  مقابض `tabId` ثابتة مثل `t1`، وتسميات اختيارية، و`targetId` الخام.
  يجب على الوكلاء إعادة استخدام `suggestedTargetId`؛ وتبقى المعرفات الخام متاحة
  للتصحيح والتوافق.

## اختيار المتصفح

عند التشغيل محليا، يختار OpenClaw أول متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز باستخدام `browser.executablePath`.

المنصات:

- macOS: يتحقق من `/Applications` و`~/Applications`.
- Linux: يتحقق من مواقع Chrome/Brave/Edge/Chromium الشائعة تحت `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختيارية)

لأغراض البرمجة النصية والتصحيح، يعرض Gateway واجهة HTTP API صغيرة
**مقتصرة على loopback فقط** للتحكم، إضافة إلى CLI `openclaw browser` مطابق
(لقطات، مراجع، تعزيزات انتظار، إخراج JSON، وسير عمل تصحيح). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للمرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (خصوصا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات WSL2 Gateway + Windows Chrome ذات المضيفين المنفصلين، راجع
[استكشاف أخطاء WSL2 + Windows + CDP بعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF للتنقل

هذه فئات فشل مختلفة وتشير إلى مسارات كود مختلفة.

- **فشل بدء CDP أو الجاهزية** يعني أن OpenClaw لا يستطيع تأكيد أن مستوى التحكم في المتصفح سليم.
- **حظر SSRF للتنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بالسياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تضبط
    خدمة CDP خارجية على loopback من دون `attachOnly: true`
- حظر SSRF للتنقل:
  - تفشل مسارات `open` أو `navigate` أو اللقطة أو فتح علامة التبويب مع خطأ سياسة متصفح/شبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الاثنين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولا.
- إذا نجح `start` لكن فشل `tabs`، فإن مستوى التحكم لا يزال غير سليم. تعامل مع ذلك كمشكلة قابلية وصول CDP، وليس مشكلة تنقل صفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح يعمل والفشل في سياسة التنقل أو الصفحة الهدف.
- إذا نجحت `start` و`tabs` و`open` جميعها، فإن مسار التحكم الأساسي للمتصفح المدار سليم.

تفاصيل سلوك مهمة:

- تضبط إعدادات المتصفح افتراضيا على كائن سياسة SSRF مغلق عند الفشل حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المدار `openclaw` على local loopback، تتخطى فحوصات صحة CDP عمدا إنفاذ قابلية وصول SSRF للمتصفح لمستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا يعني نجاح نتيجة `start` أو `tabs` أن هدف `open` أو `navigate` لاحق مسموح.

إرشادات الأمان:

- لا ترخ سياسة SSRF للمتصفح افتراضيا.
- فضل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلا من وصول واسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدا حيث يكون وصول المتصفح إلى الشبكة الخاصة مطلوبا ومراجعا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

طريقة الربط:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من اللقطة للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو مراجع موسومة).
- يتحقق `browser doctor` من جاهزية Gateway، وPlugin، والملف الشخصي، والمتصفح، والتبويب.
- يقبل `browser` ما يلي:
  - `profile` لاختيار ملف شخصي مسمى للمتصفح (openclaw، أو chrome، أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت عقدة قادرة على تشغيل المتصفح متصلة، فقد توجه الأداة إليها تلقائيًا ما لم تثبت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية الوكيل ويتجنب المحددات الهشة.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) - التحكم في المتصفح ضمن البيئات المعزولة
- [الأمان](/ar/gateway/security) - مخاطر التحكم في المتصفح والتحصين

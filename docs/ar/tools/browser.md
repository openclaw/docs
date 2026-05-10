---
read_when:
    - إضافة أتمتة المتصفح التي يتحكم فيها الوكيل
    - استكشاف سبب تداخل openclaw مع Chrome الخاص بك وإصلاحه
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المتكاملة في المتصفح + أوامر الإجراءات
title: المتصفح (تتم إدارته بواسطة OpenClaw)
x-i18n:
    generated_at: "2026-05-10T20:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51a78cc860ef4951548aba1e60bc686dfc19c156f69b6a59cf7c671eeaa67a0a
    source_path: tools/browser.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي، وتديره خدمة تحكم محلية صغيرة
داخل Gateway (loopback فقط).

نظرة المبتدئ:

- فكّر فيه بوصفه **متصفحًا منفصلًا مخصصًا للوكيل فقط**.
- لا يلمس ملف تعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يستطيع الوكيل **فتح علامات التبويب، وقراءة الصفحات، والنقر، والكتابة** ضمن مسار آمن.
- يتصل ملف تعريف `user` المدمج بجلسة Chrome الحقيقية التي سجّلت الدخول إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات الحالة، ولقطات الشاشة، وملفات PDF.
- مهارة `browser-automation` مرفقة تعلّم الوكلاء حلقة الاسترداد الخاصة بلقطة الحالة،
  وعلامة التبويب المستقرة، والمرجع القديم، والعائق اليدوي عند تفعيل
  Plugin المتصفح.
- دعم اختياري لعدة ملفات تعريف (`openclaw`، و`work`، و`remote`، ...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول من أجل
أتمتة الوكيل والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة "Browser disabled"، ففعّله في الإعدادات (انظر أدناه) وأعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح مفقودان](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مرفق. عطّله لاستبداله بـ Plugin آخر يسجل اسم أداة `browser` نفسه:

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

تحتاج الإعدادات الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. تعطيل Plugin فقط يزيل CLI الخاص بـ `openclaw browser`، وطريقة Gateway `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ وتبقى إعدادات `browser.*` كما هي لاستخدام بديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى يستطيع Plugin إعادة تسجيل خدمته.

## إرشادات الوكيل

ملاحظة ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` كلًا من `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. إذا كان على الوكيل أو
الوكيل الفرعي المُنشأ استخدام أتمتة المتصفح، فأضف المتصفح في مرحلة ملف
التعريف:

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
تُطبَّق بعد ترشيح ملف التعريف.

يوفر Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد المختصر الدائم: اختر
  ملف التعريف الصحيح، وأبقِ المراجع على علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف
  علامات التبويب، وحمّل مهارة المتصفح للأعمال متعددة الخطوات.
- تحمل مهارة `browser-automation` المرفقة حلقة التشغيل الأطول:
  افحص الحالة/علامات التبويب أولًا، وسمِّ علامات تبويب المهمة، وخذ لقطة حالة قبل التنفيذ، ثم أعد أخذ لقطة حالة
  بعد تغييرات واجهة المستخدم، واستعد المراجع القديمة مرة واحدة، وأبلغ عن تسجيل الدخول/2FA/captcha أو
  عوائق الكاميرا/الميكروفون كإجراء يدوي بدلًا من التخمين.

تُدرج Skills المرفقة بـ Plugin ضمن Skills المتاحة للوكيل عند تفعيل
Plugin. تُحمَّل تعليمات المهارة الكاملة عند الطلب، لذلك لا تتحمل
الجولات الروتينية تكلفة الرموز الكاملة.

## أمر أو أداة المتصفح مفقودان

إذا كان `openclaw browser` غير معروف بعد ترقية، أو كان `browser.request` مفقودًا، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` لا تتضمن `browser` ولا توجد كتلة إعدادات جذرية لـ `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو `browser.profiles.<name>`، تفعّل Plugin المتصفح المرفق حتى ضمن `plugins.allow` مقيّدة، بما يطابق سلوك إعدادات القناة. لا يحل `plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` محل عضوية قائمة السماح بذاتهما. كما أن إزالة `plugins.allow` بالكامل تستعيد الإعداد الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف Chrome MCP مدمج للاتصال بجلسة Chrome **الحقيقية التي سجّلت الدخول إليها**.

لاستدعاءات أداة متصفح الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون جلسات تسجيل الدخول الحالية مهمة ويكون المستخدم
  أمام الكمبيوتر للنقر/الموافقة على أي مطالبة اتصال.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

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

<Accordion title="المنافذ وإمكانية الوصول">

- ترتبط خدمة التحكم بـ loopback على منفذ مشتق من `gateway.port` (افتراضيًا `18791` = Gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى نقل المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ اضبط هذه القيم فقط لـ CDP البعيد. يكون `cdpUrl` افتراضيًا منفذ CDP المحلي المُدار عند عدم ضبطه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات قابلية الوصول عبر HTTP لـ CDP البعيد و`attachOnly`
  وطلبات HTTP لفتح علامات التبويب؛ وينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات CDP WebSocket الخاصة بها.
- `localLaunchTimeoutMs` هو الميزانية الزمنية لعملية Chrome مُدارة ومُشغّلة محليًا
  حتى تعرض نقطة نهاية CDP HTTP الخاصة بها. `localCdpReadyTimeoutMs` هو
  الميزانية اللاحقة لجاهزية CDP websocket بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi، أو خوادم VPS منخفضة المواصفات، أو العتاد الأقدم حيث يبدأ Chromium
  ببطء. يجب أن تكون القيم أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض
  قيم الإعدادات غير الصالحة.
- تُقطع دائرة إخفاقات تشغيل/جاهزية Chrome المُدار المتكررة لكل
  ملف تعريف. بعد عدة إخفاقات متتالية، يوقف OpenClaw محاولات التشغيل الجديدة
  مؤقتًا بدلًا من إنشاء Chromium عند كل استدعاء لأداة المتصفح. أصلح
  مشكلة بدء التشغيل، أو عطّل المتصفح إذا لم يكن مطلوبًا، أو أعد تشغيل
  Gateway بعد الإصلاح.
- `actionTimeoutMs` هو الميزانية الافتراضية لطلبات `act` الخاصة بالمتصفح عندما لا يمرر المستدعي `timeoutMs`. يضيف نقل العميل نافذة سماح صغيرة حتى تنتهي الانتظارات الطويلة بدلًا من انتهاء مهلتها عند حد HTTP.
- `tabCleanup` هو تنظيف بأفضل جهد لعلامات التبويب التي تفتحها جلسات متصفح الوكيل الأساسي. لا يزال تنظيف دورة حياة الوكيل الفرعي، وcron، وACP يغلق علامات التبويب المتتبعة الصريحة في نهاية الجلسة؛ وتُبقي الجلسات الأساسية علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتتبعة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تخضع ملاحة المتصفح وفتح علامات التبويب لحماية SSRF قبل الملاحة، مع إعادة فحص بأفضل جهد على عنوان URL النهائي `http(s)` بعد ذلك.
- في وضع SSRF الصارم، تُفحص أيضًا عملية اكتشاف نقطة نهاية CDP البعيدة ومجسات `/json/version` (`cdpUrl`).
- لا تقوم متغيرات البيئة `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` الخاصة بـ Gateway/الموفر بتمرير متصفح OpenClaw المُدار عبر الوكيل تلقائيًا. يبدأ Chrome المُدار باتصال مباشر افتراضيًا حتى لا تُضعف إعدادات وكيل الموفر فحوصات SSRF للمتصفح.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرّر أعلام وكيل Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يمنع وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يُفعّل الوصول إلى متصفح الشبكة الخاصة عمدًا.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` متوقف افتراضيًا؛ فعّله فقط عندما يكون الوصول إلى متصفح الشبكة الخاصة موثوقًا عمدًا.
- يظل `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم مستعار قديم.

</Accordion>

<Accordion title="سلوك ملف التعريف">

- يعني `attachOnly: true` عدم تشغيل متصفح محلي مطلقا؛ بل الاتصال فقط إذا كان أحدها قيد التشغيل بالفعل.
- يمكن تعيين `headless` عالميا أو لكل ملف تعريف محلي مدار. تتجاوز قيم كل ملف تعريف `browser.headless`، لذلك يمكن أن يبقى ملف تعريف مشغل محليا دون واجهة بينما يبقى آخر مرئيا.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless`
  تشغيلا مؤقتا لمرة واحدة دون واجهة لملفات التعريف المحلية المدارة دون إعادة كتابة
  `browser.headless` أو إعدادات ملف التعريف. ترفض ملفات تعريف الجلسات القائمة، والاتصال فقط،
  وملفات تعريف CDP البعيدة هذا التجاوز لأن OpenClaw لا يشغل عمليات
  المتصفح تلك.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تعتمد ملفات التعريف المحلية المدارة
  الوضع دون واجهة تلقائيا عندما لا تختار البيئة ولا إعدادات ملف التعريف/الإعدادات العامة
  وضعا بواجهة صراحة. يبلغ `openclaw browser status --json`
  عن `headlessSource` كواحدة من `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيل الإطلاقات المحلية المدارة دون واجهة للعملية
  الحالية. يفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع الواجهة للإطلاقات العادية
  ويعيد خطأ قابلا للتنفيذ على مضيفات Linux التي لا تحتوي على خادم عرض؛
  ويظل طلب `start --headless` الصريح هو الفائز لذلك الإطلاق الواحد.
- يمكن تعيين `executablePath` عالميا أو لكل ملف تعريف محلي مدار. تتجاوز قيم كل ملف تعريف `browser.executablePath`، لذلك يمكن لملفات تعريف مدارة مختلفة تشغيل متصفحات مختلفة مبنية على Chromium. يقبل كلا الشكلين `~` للدليل الرئيسي لنظام التشغيل لديك.
- يلون `color` (على المستوى الأعلى ولكل ملف تعريف) واجهة مستخدم المتصفح حتى تتمكن من معرفة ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` (مدار مستقل). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم الذي تم تسجيل الدخول إليه.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلا من CDP الخام. لا تضبط `cdpUrl` لذلك المشغل.
- عيّن `browser.profiles.<name>.userDataDir` عندما يجب أن يتصل ملف تعريف جلسة قائمة بملف تعريف مستخدم Chromium غير افتراضي (Brave وEdge وما إلى ذلك). يقبل هذا المسار أيضا `~` للدليل الرئيسي لنظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدام Brave أو متصفح آخر مبني على Chromium

إذا كان متصفح **النظام الافتراضي** لديك مبنيا على Chromium (Chrome/Brave/Edge/etc)،
فسيستخدمه OpenClaw تلقائيا. عيّن `browser.executablePath` لتجاوز
الاكتشاف التلقائي. تقبل قيم `executablePath` على المستوى الأعلى ولكل ملف تعريف `~`
للدليل الرئيسي لنظام التشغيل لديك:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

أو عيّنه في الإعدادات، حسب المنصة:

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

يؤثر `executablePath` لكل ملف تعريف فقط على ملفات التعريف المحلية المدارة التي يشغلها
OpenClaw. تتصل ملفات تعريف `existing-session` بمتصفح قيد التشغيل بالفعل
بدلا من ذلك، وتستخدم ملفات تعريف CDP البعيدة المتصفح خلف `cdpUrl`.

## التحكم المحلي مقابل البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة تحكم local loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ يمرر Gateway إجراءات المتصفح إليه.
- **CDP البعيد:** عيّن `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الاتصال بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغل OpenClaw متصفحا محليا.
- لخدمات CDP المدارة خارجيا على local loopback (على سبيل المثال Browserless في
  Docker منشور إلى `127.0.0.1`)، عيّن أيضا `attachOnly: true`. يعامل CDP على local loopback
  دون `attachOnly` كملف تعريف متصفح محلي مدار بواسطة OpenClaw.
- يؤثر `headless` فقط على ملفات التعريف المحلية المدارة التي يشغلها OpenClaw. ولا يعيد تشغيل أو يغير متصفحات الجلسات القائمة أو CDP البعيدة.
- يتبع `executablePath` قاعدة ملف التعريف المحلي المدار نفسها. يؤدي تغييره على
  ملف تعريف محلي مدار قيد التشغيل إلى وسم ذلك الملف لإعادة التشغيل/المواءمة بحيث
  يستخدم الإطلاق التالي الملف التنفيذي الجديد.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المدارة: يوقف `openclaw browser stop` عملية المتصفح التي
  شغلها OpenClaw
- ملفات تعريف الاتصال فقط وCDP البعيد: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات محاكاة Playwright/CDP (إطار العرض،
  ونظام الألوان، واللغة، والمنطقة الزمنية، ووضع عدم الاتصال، والحالة المشابهة)، حتى
  لو لم يشغل OpenClaw أي عملية متصفح

يمكن أن تتضمن عناوين URL البعيدة لـ CDP المصادقة:

- رموز الاستعلام (مثلا، `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثلا، `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل متغيرات البيئة أو مديري الأسرار للرموز
بدلا من تثبيتها في ملفات الإعدادات.

## وكيل متصفح Node (افتراضي بلا إعداد)

إذا شغّلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، يمكن لـ OpenClaw
توجيه استدعاءات أدوات المتصفح تلقائيا إلى ذلك الـ Node دون أي إعدادات متصفح إضافية.
هذا هو المسار الافتراضي للـ gateways البعيدة.

ملاحظات:

- يعرض مضيف Node خادم التحكم في متصفحه المحلي عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالـ Node نفسه (مثل المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغا للسلوك القديم/الافتراضي: تظل جميع ملفات التعريف المكونة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا عيّنت `nodeHost.browserProxy.allowProfiles`، يعامله OpenClaw كحد أدنى من الامتيازات: يمكن استهداف ملفات التعريف المدرجة في قائمة السماح فقط، وتُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على الـ Node: `nodeHost.browserProxy.enabled=false`
  - على الـ gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) هي خدمة Chromium مستضافة تعرض
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
أبسط خيار لملف تعريف متصفح بعيد هو عنوان WebSocket URL المباشر
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
- إذا أعطاك Browserless عنوان HTTPS أساسي، يمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو إبقاء عنوان HTTPS وترك OpenClaw
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
OpenClaw. يجب أن يعلن Browserless أيضا عن نقطة نهاية مطابقة وقابلة للوصول؛
عيّن `EXTERNAL` في Browserless إلى أساس WebSocket نفسه العام إلى OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان شبكة Docker
خاص ثابت. إذا أعاد `/json/version` قيمة `webSocketDebuggerUrl` تشير إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو HTTP الخاص بـ CDP سليما بينما يظل
اتصال WebSocket يفشل.

لا تترك `attachOnly` غير معين لملف تعريف Browserless على local loopback. بدون
`attachOnly`، يعامل OpenClaw منفذ local loopback كملف تعريف متصفح محلي مدار
وقد يبلغ أن المنفذ قيد الاستخدام لكنه ليس مملوكا لـ OpenClaw.

## مزودو CDP عبر WebSocket مباشر

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلا من
اكتشاف CDP القياسي المعتمد على HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال الصحيحة تلقائيا:

- **اكتشاف HTTP(S)** - `http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw `/json/version` لاكتشاف عنوان WebSocket debugger URL، ثم
  يتصل. لا يوجد رجوع احتياطي إلى WebSocket.
- **نقاط نهاية WebSocket مباشرة** - `ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket عارية** - `ws://host[:port]` أو `wss://host[:port]` بلا
  مسار `/devtools/...` (مثلا [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). يحاول OpenClaw اكتشاف HTTP
  عبر `/json/version` أولا (مع تطبيع المخطط إلى `http`/`https`)؛
  إذا أعاد الاكتشاف `webSocketDebuggerUrl` فسيُستخدم، وإلا يرجع OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر العاري. إذا رفضت نقطة نهاية
  WebSocket المعلنة مصافحة CDP لكن الجذر العاري المكوّن
  قبلها، يرجع OpenClaw إلى ذلك الجذر أيضا. يتيح هذا لجذر `ws://` عارٍ
  موجه إلى Chrome محلي أن يتصل مع ذلك، لأن Chrome يقبل ترقيات WebSocket فقط
  على المسار المحدد لكل هدف من `/json/version`، بينما يمكن للمزودين المستضافين
  الاستمرار في استخدام نقطة نهاية WebSocket الجذرية لديهم عندما تعلن نقطة نهاية
  الاكتشاف لديهم عن عنوان URL قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات دون واجهة مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء سكنيين.

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

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **API Key**
  من [لوحة معلومات Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي لديك.
- ينشئ Browserbase جلسة متصفح تلقائيا عند اتصال WebSocket، لذلك لا
  حاجة إلى خطوة إنشاء جلسة يدوية.
- تتيح الخطة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريا.
  راجع [التسعير](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الرئيسية:

- التحكم في المتصفح مقيّد بـ local loopback فقط؛ يمر الوصول عبر مصادقة Gateway أو إقران العقدة.
- تستخدم واجهة HTTP API المستقلة لمتصفح local loopback **مصادقة السر المشترك فقط**:
  مصادقة حامل رمز Gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic باستخدام
  كلمة مرور Gateway المهيأة.
- لا تصادق رؤوس هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` على
  واجهة API المستقلة هذه لمتصفح local loopback.
- إذا كان التحكم في المتصفح ممكّنًا ولم تكن مصادقة السر المشترك مهيأة، فإن OpenClaw
  ينشئ رمز Gateway خاصًا بوقت التشغيل فقط لذلك بدء التشغيل. هيّئ
  `gateway.auth.token` أو `gateway.auth.password` أو `OPENCLAW_GATEWAY_TOKEN` أو
  `OPENCLAW_GATEWAY_PASSWORD` صراحة إذا كانت العملاء تحتاج إلى سر ثابت عبر
  عمليات إعادة التشغيل.
- لا ينشئ OpenClaw ذلك الرمز تلقائيًا عندما يكون `gateway.auth.mode` هو
  `password` أو `none` أو `trusted-proxy` بالفعل.
- أبقِ Gateway وأي مضيفي عقد على شبكة خاصة (Tailscale)؛ وتجنب التعريض العام.
- عامل عناوين URL/الرموز الخاصة بـ CDP البعيد كأسرار؛ وفضّل متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات التهيئة.

## الملفات الشخصية (متعددة المتصفحات)

يدعم OpenClaw عدة ملفات شخصية مسماة (تهيئات توجيه). يمكن أن تكون الملفات الشخصية:

- **مدارة بواسطة openclaw**: مثيل متصفح مخصص قائم على Chromium مع دليل بيانات مستخدم خاص به + منفذ CDP
- **بعيدة**: عنوان URL صريح لـ CDP (متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف Chrome الشخصي الموجود لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يُنشأ ملف `openclaw` الشخصي تلقائيًا إذا كان مفقودًا.
- ملف `user` الشخصي مدمج لإرفاق الجلسة الموجودة عبر Chrome MCP.
- ملفات الجلسات الموجودة اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصص منافذ CDP المحلية من **18800-18899** افتراضيًا.
- يؤدي حذف ملف شخصي إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل كل نقاط نهاية التحكم `?profile=<name>`؛ وتستخدم CLI الخيار `--browser-profile`.

## الجلسة الموجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الإرفاق بملف شخصي لمتصفح قائم على Chromium قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. يعيد هذا استخدام الألسنة وحالة تسجيل الدخول
المفتوحة بالفعل في ذلك الملف الشخصي للمتصفح.

مراجع الخلفية والإعداد الرسمية:

- [Chrome للمطورين: استخدام Chrome DevTools MCP مع جلسة متصفحك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [ملف README الخاص بـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المدمج:

- `user`

اختياري: أنشئ ملف جلسة موجودة مخصصًا إذا أردت
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف `user` الشخصي المدمج الاتصال التلقائي بـ Chrome MCP، والذي يستهدف
  ملف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` لـ Brave أو Edge أو Chromium أو ملف Chrome شخصي غير افتراضي.
يتوسع `~` إلى دليل المنزل في نظام التشغيل لديك:

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

1. افتح صفحة الفحص لذلك المتصفح للتصحيح عن بُعد.
2. مكّن التصحيح عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرفق OpenClaw.

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
- يسرد `tabs` ألسنة المتصفح المفتوحة لديك بالفعل
- يعيد `snapshot` مراجع من اللسان الحي المحدد

ما يجب فحصه إذا لم ينجح الإرفاق:

- المتصفح الهدف القائم على Chromium هو الإصدار `144+`
- التصحيح عن بُعد ممكّن في صفحة الفحص لذلك المتصفح
- عرض المتصفح مطالبة موافقة الإرفاق وقبلتها
- يرحّل `openclaw doctor` تهيئة المتصفح القديمة القائمة على الإضافة ويتحقق من أن
  Chrome مثبت محليًا لملفات الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تمكين التصحيح عن بُعد من جانب المتصفح نيابة عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجل دخوله الخاصة بالمستخدم.
- إذا كنت تستخدم ملف جلسة موجودة مخصصًا، فمرر اسم الملف الشخصي الصريح ذلك.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الحاسوب للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف العقدة تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من ملف `openclaw` الشخصي المعزول لأنه يمكنه
  التصرف داخل جلسة المتصفح المسجل دخولها لديك.
- لا يطلق OpenClaw المتصفح لهذا المشغل؛ إنه يرفق فقط.
- يستخدم OpenClaw تدفق `--autoConnect` الرسمي الخاص بـ Chrome DevTools MCP هنا. إذا
  كان `userDataDir` مضبوطًا، فيُمرر لاستهداف دليل بيانات المستخدم ذلك.
- يمكن للجلسة الموجودة الإرفاق على المضيف المحدد أو عبر عقدة متصفح متصلة. إذا كان Chrome في مكان آخر ولم تكن أي عقدة متصفح متصلة، فاستخدم
  CDP البعيد أو مضيف عقدة بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP الذي يتم تشغيله لكل ملف شخصي عندما لا يكون تدفق
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفون غير متصلين،
إصدارات مثبتة، ثنائيات موردة):

| الحقل        | ما يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي المراد تشغيله بدلًا من `npx`. يُحل كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط التي تمرر حرفيًا إلى `mcpCommand`. تستبدل وسائط `chrome-devtools-mcp@latest --autoConnect` الافتراضية. |

عندما يُضبط `cdpUrl` على ملف جلسة موجودة، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → `--browserUrl <url>` (نقطة نهاية اكتشاف DevTools عبر HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket مباشر لـ CDP).

لا يمكن دمج أعلام نقطة النهاية و`userDataDir`: عندما يُضبط `cdpUrl`،
يُتجاهل `userDataDir` عند تشغيل Chrome MCP، لأن Chrome MCP يرفق بالمتصفح
قيد التشغيل خلف نقطة النهاية بدلًا من فتح دليل ملف شخصي.

<Accordion title="قيود ميزة الجلسة الموجودة">

مقارنة بملف `openclaw` الشخصي المدار، تكون مشغلات الجلسة الموجودة أكثر تقييدًا:

- **لقطات الشاشة** - تعمل التقاطات الصفحة والتقاطات عنصر `--ref`؛ أما محددات CSS `--element` فلا تعمل. لا يمكن دمج `--full-page` مع `--ref` أو `--element`. لا يكون Playwright مطلوبًا للقطات شاشة الصفحة أو العناصر القائمة على المرجع.
- **الإجراءات** - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (بدون محددات CSS). ينقر `click-coords` إحداثيات منفذ العرض المرئية ولا يتطلب مرجع snapshot. `click` للزر الأيسر فقط. لا يدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`. لا يدعم `press` الخيار `delayMs`. لا تدعم `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلات لكل استدعاء. يقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** - يدعم `wait --url` أنماط المطابقة الدقيقة والجزئية وglob؛ ولا يدعم `wait --load networkidle`. تتطلب خطافات الرفع `ref` أو `inputRef`، ملفًا واحدًا في كل مرة، بدون CSS `element`. لا تدعم خطافات مربع الحوار تجاوزات المهلة.
- **الميزات الخاصة بالمتصفح المدار فقط** - لا تزال إجراءات الدُفعات، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف متصفحك الشخصي أبدًا.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارضات مع سير عمل التطوير.
- **تحكم حتمي في الألسنة**: يعيد `tabs` أولًا `suggestedTargetId`، ثم
  مقابض `tabId` مستقرة مثل `t1`، وتسميات اختيارية، و`targetId` الخام.
  ينبغي للوكلاء إعادة استخدام `suggestedTargetId`؛ وتظل المعرفات الخام متاحة
  للتصحيح والتوافق.

## اختيار المتصفح

عند التشغيل محليًا، يختار OpenClaw أول متاح:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز باستخدام `browser.executablePath`.

المنصات:

- macOS: يتحقق من `/Applications` و`~/Applications`.
- Linux: يتحقق من مواقع Chrome/Brave/Edge/Chromium الشائعة ضمن `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`، إضافة إلى Chromium المدار بواسطة Playwright ضمن
  `PLAYWRIGHT_BROWSERS_PATH` أو `~/.cache/ms-playwright`.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختيارية)

للسكربتات والتصحيح، يعرّض Gateway واجهة HTTP
API صغيرة للتحكم **مقيدة بـ local loopback فقط** بالإضافة إلى CLI `openclaw browser` مطابق (لقطات، مراجع، تعزيزات انتظار،
مخرجات JSON، وسير عمل تصحيح). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للمرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات WSL2 Gateway + Windows Chrome على مضيفين منفصلين، راجع
[استكشاف أخطاء WSL2 + Windows + CDP بعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء تشغيل CDP مقابل حظر SSRF للتنقل

هذه فئات فشل مختلفة وتشير إلى مسارات كود مختلفة.

- **فشل بدء تشغيل CDP أو الجاهزية** يعني أن OpenClaw لا يستطيع تأكيد سلامة مستوى التحكم في المتصفح.
- **حظر SSRF للتنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بالسياسة.

أمثلة شائعة:

- فشل بدء تشغيل CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية على loopback مهيأة دون `attachOnly: true`
- حظر SSRF للتنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح اللسان مع خطأ سياسة متصفح/شبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى لفصل الاثنين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. عامل هذا كمشكلة قابلية وصول CDP، وليس كمشكلة تنقل صفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح يعمل والفشل في سياسة التنقل أو الصفحة الهدف.
- إذا نجحت `start` و`tabs` و`open` جميعها، فإن مسار التحكم الأساسي في المتصفح المدار سليم.

تفاصيل سلوك مهمة:

- تعود تهيئة المتصفح افتراضيًا إلى كائن سياسة SSRF مغلق عند الفشل حتى عندما لا تهيئ `browser.ssrfPolicy`.
- بالنسبة إلى ملف `openclaw` المدار عبر local loopback، تتخطى فحوصات صحة CDP عمدًا إنفاذ قابلية وصول SSRF للمتصفح على مستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا تعني نتيجة `start` أو `tabs` الناجحة أن هدف `open` أو `navigate` لاحق مسموح به.

إرشادات الأمان:

- لا **تخفف** سياسة SSRF للمتصفح افتراضيًا.
- فضّل استثناءات المضيف الضيقة مثل `hostnameAllowlist` أو `allowedHostnames` على الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عن قصد حيث يكون وصول المتصفح إلى الشبكة الخاصة مطلوبًا ومراجعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` - التشخيص/الحالة/البدء/الإيقاف/علامات التبويب/الفتح/التركيز/الإغلاق/اللقطة/لقطة الشاشة/التنقل/التنفيذ

كيفية المطابقة:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (ذكاء اصطناعي أو ARIA).
- يستخدم `browser act` معرّفات `ref` من اللقطة للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (الصفحة الكاملة، أو العنصر، أو المراجع المسماة).
- يتحقق `browser doctor` من جاهزية Gateway، وPlugin، والملف الشخصي، والمتصفح، وعلامة التبويب.
- يقبل `browser`:
  - `profile` لاختيار ملف شخصي مسمى للمتصفح (openclaw، أو chrome، أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذف `target`: تكون القيمة الافتراضية للجلسات المعزولة هي `sandbox`، وتكون القيمة الافتراضية للجلسات غير المعزولة هي `host`.
  - إذا كانت عقدة قادرة على تشغيل المتصفح متصلة، فقد توجّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

هذا يبقي الوكيل حتميًا ويتجنب المحددات الهشة.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) - التحكم بالمتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) - مخاطر التحكم بالمتصفح وتقويته

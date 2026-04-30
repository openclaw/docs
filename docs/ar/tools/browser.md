---
read_when:
    - إضافة أتمتة للمتصفح يتحكم بها الوكيل
    - استكشاف سبب تداخل openclaw مع Chrome الخاص بك وإصلاحه
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم في المتصفح المدمجة + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-30T08:28:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8f0456505f4e1711626a539a0a0c48d67ca10d4788838eb53855bc83c766d2f
    source_path: tools/browser.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **ملف تعريف Chrome/Brave/Edge/Chromium مخصص** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي، وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (عبر local loopback فقط).

نظرة للمبتدئين:

- اعتبره **متصفحًا منفصلًا مخصصًا للوكيل فقط**.
- لا يلمس ملف تعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يستطيع الوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** في مسار آمن.
- يتصل ملف التعريف المدمج `user` بجلسة Chrome الحقيقية التي سجلت الدخول إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات حالة، ولقطات شاشة، وملفات PDF.
- Skill مدمجة باسم `browser-automation` تعلّم الوكلاء حلقة الاسترداد الخاصة بلقطة الحالة،
  وعلامة التبويب المستقرة، والمرجع القديم، والمعوّق اليدوي عندما يكون
  Plugin المتصفح ممكّنًا.
- دعم اختياري لعدة ملفات تعريف (`openclaw`، `work`، `remote`، ...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول لأتمتة
الوكلاء والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة “Browser disabled”، فقم بتمكينه في الإعدادات (انظر أدناه) وأعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح مفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مدمج. عطّله لاستبداله بـ Plugin آخر يسجل اسم أداة `browser` نفسه:

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

تحتاج الإعدادات الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. يؤدي تعطيل Plugin فقط إلى إزالة CLI `openclaw browser`، وطريقة Gateway `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ وتبقى إعدادات `browser.*` لديك سليمة لاستبدالها.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى يتمكن Plugin من إعادة تسجيل خدمته.

## إرشادات الوكيل

ملاحظة ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` الأداتين `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. إذا كان يجب على الوكيل أو
وكيل فرعي منشأ استخدام أتمتة المتصفح، فأضف المتصفح في مرحلة ملف التعريف:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

بالنسبة لوكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
لا يكفي `tools.subagents.tools.allow: ["browser"]` وحده لأن سياسة الوكيل الفرعي
تُطبق بعد تصفية ملف التعريف.

يشحن Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد المختصر النشط دائمًا: اختر
  ملف التعريف الصحيح، وأبقِ المراجع على علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف
  علامات التبويب، وحمّل Skill المتصفح للعمل متعدد الخطوات.
- تحمل Skill المدمجة `browser-automation` حلقة التشغيل الأطول:
  تحقق من الحالة/علامات التبويب أولًا، وسمّ علامات تبويب المهمة، وخذ لقطة حالة قبل التنفيذ، وأعد أخذ لقطة الحالة
  بعد تغييرات الواجهة، واستعد المراجع القديمة مرة واحدة، وأبلغ عن تسجيل الدخول/المصادقة الثنائية/اختبار captcha أو
  معوّقات الكاميرا/الميكروفون كإجراء يدوي بدلًا من التخمين.

تظهر Skills المدمجة في Plugin ضمن Skills المتاحة للوكيل عندما يكون
Plugin ممكّنًا. تُحمّل تعليمات Skill الكاملة عند الطلب، لذلك لا تتحمل
الدورات الروتينية تكلفة الرموز الكاملة.

## أمر أو أداة المتصفح مفقودة

إذا كان `openclaw browser` غير معروف بعد ترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` تحذف `browser` ولا توجد كتلة إعدادات `browser` جذرية. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

تؤدي كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو `browser.profiles.<name>`، إلى تنشيط Plugin المتصفح المدمج حتى مع `plugins.allow` مقيّد، بما يطابق سلوك إعدادات القنوات. لا يحل `plugins.entries.browser.enabled=true` و `tools.alsoAllow: ["browser"]` محل عضوية قائمة السماح بمفردهما. كما أن إزالة `plugins.allow` بالكامل تستعيد الوضع الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف Chrome MCP مدمج للاتصال بجلسة **Chrome الحقيقية التي سجلت الدخول إليها**.

بالنسبة لاستدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون جلسات تسجيل الدخول الحالية مهمة ويكون المستخدم
  أمام الكمبيوتر للنقر/الموافقة على أي مطالبة اتصال.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

عيّن `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

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

- ترتبط خدمة التحكم بـ local loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى نقل المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ عيّنها فقط لـ CDP البعيد. تكون القيمة الافتراضية لـ `cdpUrl` هي منفذ CDP المحلي المُدار عندما لا تكون معينة.
- ينطبق `remoteCdpTimeoutMs` على فحوصات قابلية وصول HTTP لـ CDP البعيد و `attachOnly`
  وطلبات HTTP لفتح علامات التبويب؛ وينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات CDP WebSocket الخاصة بها.
- `localLaunchTimeoutMs` هو الميزانية المخصصة لعملية Chrome مُدارة مشغلة محليًا
  لكشف نقطة نهاية HTTP الخاصة بـ CDP. أما `localCdpReadyTimeoutMs` فهو
  الميزانية اللاحقة لجاهزية CDP websocket بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi، أو VPS منخفض المواصفات، أو الأجهزة الأقدم حيث يبدأ Chromium
  ببطء. يجب أن تكون القيم أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض
  قيم الإعدادات غير الصالحة.
- تُكسر دائرة إخفاقات تشغيل/جاهزية Chrome المُدار المتكررة لكل
  ملف تعريف. بعد عدة إخفاقات متتالية، يوقف OpenClaw محاولات التشغيل الجديدة
  مؤقتًا بدلًا من إنشاء Chromium عند كل استدعاء لأداة المتصفح. أصلح
  مشكلة بدء التشغيل، أو عطّل المتصفح إذا لم يكن مطلوبًا، أو أعد تشغيل
  Gateway بعد الإصلاح.
- `actionTimeoutMs` هو الميزانية الافتراضية لطلبات `act` في المتصفح عندما لا يمرر المستدعي `timeoutMs`. يضيف نقل العميل نافذة هامش صغيرة حتى تتمكن الانتظارات الطويلة من الانتهاء بدلًا من انتهاء المهلة عند حد HTTP.
- `tabCleanup` هو تنظيف بأفضل جهد لعلامات التبويب التي تفتحها جلسات متصفح الوكيل الأساسي. لا يزال تنظيف دورة حياة الوكيل الفرعي و cron و ACP يغلق علامات التبويب المتتبعة صراحة عند نهاية الجلسة؛ وتبقي الجلسات الأساسية علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب الخاملة أو الزائدة المتتبعة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تخضع ملاحة المتصفح وفتح علامات التبويب لحماية SSRF قبل الملاحة، ويُعاد فحصها بأفضل جهد على عنوان URL النهائي `http(s)` بعد ذلك.
- في وضع SSRF الصارم، تُفحص أيضًا عملية اكتشاف نقطة نهاية CDP البعيدة ومجسات `/json/version` (`cdpUrl`).
- لا تجعل متغيرات بيئة Gateway/المزوّد `HTTP_PROXY` و `HTTPS_PROXY` و `ALL_PROXY` و `NO_PROXY` متصفح OpenClaw المُدار يستخدم الوكيل تلقائيًا. يبدأ Chrome المُدار اتصالًا مباشرًا افتراضيًا حتى لا تُضعف إعدادات وكيل المزوّد فحوصات SSRF الخاصة بالمتصفح.
- لاستخدام وكيل للمتصفح المُدار نفسه، مرر أعلام وكيل Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يحظر وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يكن وصول المتصفح إلى الشبكة الخاصة ممكّنًا عن قصد.
- يكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` متوقفًا افتراضيًا؛ لا تمكّنه إلا عندما يكون وصول المتصفح إلى الشبكة الخاصة موثوقًا عن قصد.
- يبقى `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.

</Accordion>

<Accordion title="سلوك ملف التعريف">

- يعني `attachOnly: true` عدم تشغيل متصفح محلي مطلقاً؛ والإرفاق فقط إذا كان هناك متصفح قيد التشغيل بالفعل.
- يمكن ضبط `headless` عالمياً أو لكل ملف تعريف مُدار محلي. تتجاوز قيم كل ملف تعريف `browser.headless`، لذلك يمكن أن يبقى ملف تعريف مُشغَّل محلياً بلا واجهة بينما يبقى آخر مرئياً.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless` تشغيلاً
  بلا واجهة لمرة واحدة لملفات التعريف المُدارة محلياً من دون إعادة كتابة
  `browser.headless` أو إعداد ملف التعريف. ترفض ملفات تعريف الجلسات الموجودة، والإرفاق فقط، وملفات
  CDP البعيدة هذا التجاوز لأن OpenClaw لا يشغّل
  عمليات المتصفح تلك.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تتحول ملفات التعريف المُدارة محلياً
  افتراضياً إلى وضع بلا واجهة تلقائياً عندما لا تختار البيئة ولا إعدادات ملف التعريف/العالمية
  وضع الواجهة صراحةً. يُبلغ `openclaw browser status --json`
  عن `headlessSource` بالقيم `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيل الملفات المُدارة محلياً بلا واجهة للعملية
  الحالية. يفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع الواجهة لعمليات البدء العادية
  ويُرجع خطأً قابلاً للتنفيذ على مضيفات Linux التي لا تحتوي على خادم عرض؛
  يظل طلب `start --headless` الصريح هو الغالب لذلك التشغيل الواحد.
- يمكن ضبط `executablePath` عالمياً أو لكل ملف تعريف مُدار محلي. تتجاوز قيم كل ملف تعريف `browser.executablePath`، لذلك يمكن لملفات التعريف المُدارة المختلفة تشغيل متصفحات مختلفة مبنية على Chromium. يقبل كلا الشكلين `~` لدليل المنزل في نظام التشغيل لديك.
- يلوّن `color` (على المستوى الأعلى ولكل ملف تعريف) واجهة المتصفح حتى يمكنك رؤية ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم المسجّل دخوله.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنياً على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلاً من CDP الخام. لا تضبط `cdpUrl` لذلك المشغّل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن يُرفق ملف تعريف جلسة موجودة بملف تعريف مستخدم Chromium غير افتراضي (Brave وEdge وغيرهما). يقبل هذا المسار أيضاً `~` لدليل المنزل في نظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدام Brave أو متصفح آخر مبني على Chromium

إذا كان متصفح **النظام الافتراضي** لديك مبنياً على Chromium (Chrome/Brave/Edge/إلخ)،
فسيستخدمه OpenClaw تلقائياً. اضبط `browser.executablePath` لتجاوز
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

يؤثر `executablePath` لكل ملف تعريف فقط في ملفات التعريف المُدارة محلياً التي
يشغّلها OpenClaw. تُرفق ملفات تعريف `existing-session` بمتصفح قيد التشغيل بالفعل
بدلاً من ذلك، وتستخدم ملفات تعريف CDP البعيدة المتصفح خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم عبر loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ يمرّر Gateway إجراءات المتصفح إليه.
- **CDP بعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) لكي
  تُرفق بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغّل OpenClaw متصفحاً محلياً.
- بالنسبة إلى خدمات CDP المُدارة خارجياً على loopback (على سبيل المثال Browserless في
  Docker منشور إلى `127.0.0.1`)، اضبط أيضاً `attachOnly: true`. يُعامل CDP عبر loopback
  من دون `attachOnly` كملف تعريف متصفح محلي مُدار من OpenClaw.
- يؤثر `headless` فقط في ملفات التعريف المُدارة محلياً التي يشغّلها OpenClaw. لا يعيد تشغيل متصفحات الجلسات الموجودة أو CDP البعيدة ولا يغيّرها.
- يتبع `executablePath` قاعدة ملف التعريف المُدار محلياً نفسها. يؤدي تغييره على
  ملف تعريف مُدار محلياً قيد التشغيل إلى وضع علامة على ذلك الملف لإعادة التشغيل/التوفيق حتى يستخدم
  التشغيل التالي الملف الثنائي الجديد.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المُدارة محلياً: يوقف `openclaw browser stop` عملية المتصفح التي
  شغّلها OpenClaw
- ملفات تعريف الإرفاق فقط وCDP البعيدة: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات محاكاة Playwright/CDP (منفذ العرض،
  ونظام الألوان، واللغة، والمنطقة الزمنية، ووضع عدم الاتصال، والحالة المشابهة)، حتى
  مع أن OpenClaw لم يشغّل أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد بيانات مصادقة:

- رموز الاستعلام (مثلاً `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثلاً `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل متغيرات البيئة أو مديري الأسرار للرموز
بدلاً من تثبيتها في ملفات الإعداد.

## وكيل متصفح Node (افتراضي بلا إعداد)

إذا شغّلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، يستطيع OpenClaw
توجيه استدعاءات أدوات المتصفح تلقائياً إلى ذلك Node من دون أي إعداد متصفح إضافي.
هذا هو المسار الافتراضي للبوابات البعيدة.

ملاحظات:

- يعرّض مضيف Node خادم التحكم بالمتصفح المحلي الخاص به عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعداد `browser.profiles` الخاص بـ Node نفسه (كما في المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغاً للسلوك القديم/الافتراضي: تبقى كل ملفات التعريف المضبوطة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، يعامله OpenClaw كحدّ أدنى للصلاحيات: يمكن استهداف ملفات التعريف المدرجة في قائمة السماح فقط، وتُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على Node: `nodeHost.browserProxy.enabled=false`
  - على Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) خدمة Chromium مستضافة تعرض
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة إلى ملف تعريف متصفح بعيد، فإن أبسط خيار هو عنوان WebSocket المباشر
من مستندات الاتصال الخاصة بـ Browserless.

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
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless لديك (راجع مستنداتهم).
- إذا أعطاك Browserless عنوان HTTPS أساسياً، يمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الإبقاء على عنوان HTTPS والسماح لـ OpenClaw
  باكتشاف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما يكون Browserless مستضافاً ذاتياً في Docker ويعمل OpenClaw على المضيف، تعامل مع
Browserless كخدمة CDP مُدارة خارجياً:

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

يجب أن يكون العنوان في `browser.profiles.browserless.cdpUrl` قابلاً للوصول من عملية
OpenClaw. يجب أيضاً أن يعلن Browserless عن نقطة نهاية مطابقة قابلة للوصول؛ اضبط
`EXTERNAL` في Browserless إلى قاعدة WebSocket العامة نفسها بالنسبة إلى OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان شبكة Docker
خاص مستقر. إذا أرجع `/json/version` قيمة `webSocketDebuggerUrl` تشير إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو CDP HTTP سليماً بينما يظل إرفاق
WebSocket يفشل.

لا تترك `attachOnly` غير مضبوط لملف تعريف Browserless عبر loopback. من دون
`attachOnly`، يعامل OpenClaw منفذ loopback كملف تعريف متصفح محلي مُدار
وقد يُبلغ بأن المنفذ مستخدم لكنه ليس مملوكاً لـ OpenClaw.

## مزودو CDP عبر WebSocket المباشر

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلاً من
اكتشاف CDP القياسي القائم على HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال المناسبة تلقائياً:

- **اكتشاف HTTP(S)** — `http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw `/json/version` لاكتشاف عنوان URL لمصحح WebSocket، ثم
  يتصل. لا يوجد رجوع احتياطي إلى WebSocket.
- **نقاط نهاية WebSocket مباشرة** — `ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket عارية** — `ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثلاً [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). يحاول OpenClaw اكتشاف HTTP
  عبر `/json/version` أولاً (مع تطبيع المخطط إلى `http`/`https`)؛
  إذا أعاد الاكتشاف `webSocketDebuggerUrl` فسيُستخدم، وإلا يرجع OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر العاري. إذا رفضت نقطة نهاية
  WebSocket المُعلنة مصافحة CDP لكن الجذر العاري المضبوط
  قبلها، يرجع OpenClaw إلى ذلك الجذر أيضاً. يتيح ذلك لجذر `ws://` عارٍ
  موجّه إلى Chrome محلي أن يتصل، لأن Chrome لا يقبل ترقيات WebSocket
  إلا على المسار المحدد لكل هدف من `/json/version`، بينما لا يزال بإمكان
  المزودين المستضافين استخدام نقطة نهاية WebSocket الجذرية لديهم عندما تعلن نقطة نهاية
  الاكتشاف الخاصة بهم عن عنوان URL قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات بلا واجهة مع حل CAPTCHA مدمج، ووضع تخفٍ، ووكلاء سكنيين.

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
- ينشئ Browserbase جلسة متصفح تلقائياً عند الاتصال عبر WebSocket، لذلك لا
  توجد حاجة إلى خطوة إنشاء جلسة يدوية.
- تتيح الخطة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهرياً.
  راجع [التسعير](https://www.browserbase.com/pricing) لحدود الخطط المدفوعة.
- راجع [مستندات Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الرئيسية:

- التحكم في المتصفح مقصور على loopback؛ تمر عمليات الوصول عبر مصادقة Gateway أو إقران Node.
- تستخدم واجهة HTTP API المستقلة لمتصفح loopback **مصادقة السر المشترك فقط**:
  مصادقة حامل رمز Gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic باستخدام
  كلمة مرور Gateway المكوّنة.
- لا تقوم ترويسات هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"`
  **بمصادقة** واجهة API المستقلة هذه لمتصفح loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم تُكوَّن مصادقة بسر مشترك، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا ينشئ OpenClaw ذلك الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفات Node على شبكة خاصة (Tailscale)؛ وتجنب تعريضها للعامة.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد كأسرار؛ وفضّل متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرةً في ملفات الإعدادات.

## الملفات الشخصية (متعددة المتصفحات)

يدعم OpenClaw عدة ملفات شخصية مسماة (إعدادات توجيه). يمكن أن تكون الملفات الشخصية:

- **مدارة بواسطة openclaw**: مثيل متصفح مخصص قائم على Chromium له دليل بيانات مستخدم خاص به + منفذ CDP
- **بعيدة**: عنوان URL صريح لـ CDP (متصفح قائم على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملفك الشخصي الحالي في Chrome عبر الاتصال التلقائي بـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يُنشأ الملف الشخصي `openclaw` تلقائيًا إذا كان مفقودًا.
- الملف الشخصي `user` مضمّن لإرفاق جلسة Chrome MCP موجودة.
- ملفات الجلسات الموجودة اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف شخصي إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل كل نقاط نهاية التحكم `?profile=<name>`؛ وتستخدم CLI الخيار `--browser-profile`.

## الجلسة الموجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الإرفاق بملف شخصي جارٍ لمتصفح قائم على Chromium عبر
خادم Chrome DevTools MCP الرسمي. يعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ذلك الملف الشخصي للمتصفح.

مراجع الخلفية والإعداد الرسمية:

- [Chrome للمطورين: استخدام Chrome DevTools MCP مع جلسة متصفحك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README لـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المضمّن:

- `user`

اختياري: أنشئ ملفك الشخصي المخصص لجلسة موجودة إذا كنت تريد
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي المضمّن `user` الاتصال التلقائي بـ Chrome MCP، والذي يستهدف
  الملف الشخصي المحلي الافتراضي في Google Chrome.

استخدم `userDataDir` مع Brave أو Edge أو Chromium أو ملف شخصي غير افتراضي في Chrome.
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

1. افتح صفحة الفحص الخاصة بذلك المتصفح للتصحيح عن بُعد.
2. فعّل التصحيح عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يُرفق OpenClaw.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار سريع للإرفاق الحي:

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
- يسرد `tabs` علامات تبويب المتصفح المفتوحة لديك بالفعل
- يعيد `snapshot` مراجع من علامة التبويب الحية المحددة

ما يجب التحقق منه إذا لم يعمل الإرفاق:

- المتصفح المستهدف القائم على Chromium بإصدار `144+`
- التصحيح عن بُعد مفعّل في صفحة الفحص الخاصة بذلك المتصفح
- عرض المتصفح مطالبة موافقة الإرفاق وقبلتها
- ينقل `openclaw doctor` إعدادات المتصفح القديمة القائمة على Plugin ويتحقق من
  تثبيت Chrome محليًا لملفات الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تمكين التصحيح عن بُعد في جانب المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجل دخول المستخدم فيه.
- إذا استخدمت ملفًا شخصيًا مخصصًا لجلسة موجودة، فمرّر اسم ذلك الملف الشخصي الصريح.
- اختر هذا الوضع فقط عندما يكون المستخدم عند الكمبيوتر للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف Node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من الملف الشخصي المعزول `openclaw` لأنه يستطيع
  التصرف داخل جلسة متصفحك المسجل دخولها.
- لا يطلق OpenClaw المتصفح لهذا المشغل؛ بل يرفق به فقط.
- يستخدم OpenClaw هنا تدفق Chrome DevTools MCP `--autoConnect` الرسمي. إذا
  ضُبط `userDataDir`، فيُمرر لاستهداف دليل بيانات المستخدم ذلك.
- يمكن للجلسة الموجودة الإرفاق على المضيف المحدد أو عبر Node متصفح متصل.
  إذا كان Chrome موجودًا في مكان آخر ولا توجد Node متصفح متصلة، فاستخدم
  CDP البعيد أو مضيف Node بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP المُشغَّل لكل ملف شخصي عندما لا يكون تدفق
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفات بلا اتصال،
إصدارات مثبتة، ثنائيات موردة):

| الحقل        | ما يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي المراد تشغيله بدلًا من `npx`. يُحل كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط الممررة حرفيًا إلى `mcpCommand`. تستبدل وسائط `chrome-devtools-mcp@latest --autoConnect` الافتراضية. |

عندما يُضبط `cdpUrl` في ملف شخصي لجلسة موجودة، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` ← `--browserUrl <url>` (نقطة نهاية اكتشاف HTTP في DevTools).
- `ws(s)://...` ← `--wsEndpoint <url>` (WebSocket مباشر لـ CDP).

لا يمكن الجمع بين أعلام نقاط النهاية و`userDataDir`: عندما يُضبط `cdpUrl`،
يُتجاهل `userDataDir` عند تشغيل Chrome MCP، لأن Chrome MCP يرفق بالمتصفح
الجاري خلف نقطة النهاية بدلًا من فتح دليل ملف شخصي.

<Accordion title="قيود ميزة الجلسة الموجودة">

مقارنةً بالملف الشخصي المُدار `openclaw`، تكون مشغلات الجلسة الموجودة أكثر تقييدًا:

- **لقطات الشاشة** — تعمل لقطات الصفحة ولقطات العناصر باستخدام `--ref`؛ أما محددات CSS عبر `--element` فلا تعمل. لا يمكن دمج `--full-page` مع `--ref` أو `--element`. لا يكون Playwright مطلوبًا للقطات شاشة الصفحة أو العناصر المعتمدة على المراجع.
- **الإجراءات** — تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (من دون محددات CSS). ينقر `click-coords` على إحداثيات إطار العرض المرئي ولا يتطلب مرجع snapshot. يكون `click` بزر الفأرة الأيسر فقط. لا يدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`. لا يدعم `press` الخيار `delayMs`. لا تدعم `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلات لكل استدعاء. يقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** — يدعم `wait --url` أنماط المطابقة التامة والجزئية وglob؛ ولا يدعم `wait --load networkidle`. تتطلب خطافات الرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، ولا تدعم `element` في CSS. لا تدعم خطافات مربعات الحوار تجاوزات المهلة.
- **الميزات الخاصة بالوضع المُدار فقط** — لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملفك الشخصي في المتصفح.
- **منافذ مخصصة**: يتجنب `9222` لمنع التضارب مع تدفقات عمل التطوير.
- **تحكم حتمي في علامات التبويب**: يعيد `tabs` أولًا `suggestedTargetId`، ثم
  مقابض `tabId` ثابتة مثل `t1`، وتسميات اختيارية، و`targetId` الخام.
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

- macOS: يفحص `/Applications` و`~/Applications`.
- Linux: يفحص مواقع Chrome/Brave/Edge/Chromium الشائعة تحت `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`.
- Windows: يفحص مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختياري)

لأغراض البرمجة النصية والتصحيح، يوفّر Gateway واجهة HTTP
API صغيرة للتحكم **مقصورة على loopback** بالإضافة إلى CLI `openclaw browser`
مطابق (لقطات snapshot، ومراجع، وتعزيزات انتظار، وإخراج JSON، وتدفقات عمل تصحيح). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للمرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات WSL2 Gateway + Windows Chrome ذات المضيفين المنفصلين، راجع
[استكشاف أخطاء WSL2 + Windows + Chrome CDP البعيد وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF عند التنقل

هذه فئات فشل مختلفة وتشير إلى مسارات كود مختلفة.

- **فشل بدء CDP أو جاهزيته** يعني أن OpenClaw لا يستطيع تأكيد سلامة مستوى التحكم في المتصفح.
- **حظر SSRF عند التنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بموجب السياسة.

أمثلة شائعة:

- فشل بدء CDP أو جاهزيته:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية على loopback مكوّنة من دون `attachOnly: true`
- حظر SSRF عند التنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامة تبويب مع خطأ سياسة متصفح/شبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الاثنين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فإن مستوى التحكم لا يزال غير سليم. تعامل مع هذا كمشكلة قابلية وصول CDP، لا كمشكلة تنقل صفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح يعمل والفشل في سياسة التنقل أو الصفحة الهدف.
- إذا نجحت `start` و`tabs` و`open` كلها، فإن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل مهمة عن السلوك:

- تضبط إعدادات المتصفح افتراضيًا كائن سياسة SSRF يفشل بشكل مغلق حتى عندما لا تكوّن `browser.ssrfPolicy`.
- بالنسبة إلى ملف local loopback الشخصي المُدار `openclaw`، تتخطى فحوصات صحة CDP عمدًا فرض قابلية الوصول الخاصة بسياسة SSRF في المتصفح لمستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا تعني نتيجة `start` أو `tabs` الناجحة أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- لا **تخفف** سياسة SSRF في المتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا التي يكون فيها وصول المتصفح إلى الشبكة الخاصة مطلوبًا ومراجعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية تعيينها:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من اللقطة للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو مراجع موسومة).
- يفحص `browser doctor` جاهزية Gateway وPlugin والملف الشخصي والمتصفح والتبويب.
- يقبل `browser` ما يلي:
  - `profile` لاختيار ملف شخصي مسمى للمتصفح (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت عقدة قادرة على تشغيل المتصفح متصلة، فقد تُوجّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

هذا يبقي الوكيل حتميًا ويتجنب المحددات الهشة.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وتقويته

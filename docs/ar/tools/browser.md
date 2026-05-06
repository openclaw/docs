---
read_when:
    - إضافة أتمتة للمتصفح يتحكم بها الوكيل
    - استكشاف سبب تداخل OpenClaw مع Chrome الخاص بك وإصلاحه
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم في المتصفح المدمجة + أوامر الإجراءات
title: المتصفح (مُدار بواسطة OpenClaw)
x-i18n:
    generated_at: "2026-05-06T08:15:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3588ee1205d34df7604f1c660829c5f373b0fa76080d36c460f4ed4a08777a39
    source_path: tools/browser.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **ملف تعريف Chrome/Brave/Edge/Chromium مخصص** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي وتتم إدارته عبر خدمة تحكم محلية صغيرة
داخل Gateway (loopback فقط).

نظرة للمبتدئين:

- فكر فيه على أنه **متصفح منفصل مخصص للوكيل فقط**.
- ملف تعريف `openclaw` لا يمس ملف تعريف متصفحك الشخصي.
- يستطيع الوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** في مسار آمن.
- يتصل ملف التعريف المدمج `user` بجلسة Chrome الحقيقية التي سجّلت الدخول إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (النقر/الكتابة/السحب/التحديد)، واللقطات، ولقطات الشاشة، وملفات PDF.
- Skill مدمجة باسم `browser-automation` تعلّم الوكلاء حلقة الاسترداد الخاصة باللقطات،
  وعلامات التبويب المستقرة، والمراجع القديمة، والعوائق اليدوية عند تفعيل
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

إذا ظهرت لك الرسالة "Browser disabled"، ففعّله في التكوين (انظر أدناه) وأعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر المتصفح أو الأداة مفقودان](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مدمجة. عطّلها لاستبدالها بـ Plugin آخر يسجل اسم أداة `browser` نفسه:

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

تحتاج الإعدادات الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. تعطيل Plugin فقط يزيل `openclaw browser` CLI، وطريقة Gateway `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ ويبقى تكوين `browser.*` لديك كما هو لاستخدام بديل.

تتطلب تغييرات تكوين المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## إرشادات الوكيل

ملاحظة ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` كلًا من `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. إذا كان ينبغي للوكيل أو
وكيل فرعي مُنشأ استخدام أتمتة المتصفح، فأضف المتصفح في مرحلة ملف التعريف:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

بالنسبة إلى وكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
استخدام `tools.subagents.tools.allow: ["browser"]` وحده لا يكفي لأن سياسة الوكيل الفرعي
تُطبّق بعد ترشيح ملف التعريف.

توفر Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد الموجز الدائم: اختر
  ملف التعريف الصحيح، وأبقِ المراجع على علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف
  علامات التبويب، وحمّل Skill المتصفح للعمل متعدد الخطوات.
- تحمل Skill المدمجة `browser-automation` حلقة التشغيل الأطول:
  افحص الحالة/علامات التبويب أولًا، وسمّ علامات تبويب المهام، وخذ لقطة قبل الإجراء، وأعد أخذ لقطة
  بعد تغييرات الواجهة، واستعد المراجع القديمة مرة واحدة، وبلّغ عن تسجيل الدخول/2FA/captcha أو
  عوائق الكاميرا/الميكروفون كإجراء يدوي بدلًا من التخمين.

تُدرج Skills المدمجة في Plugin ضمن Skills المتاحة للوكيل عندما تكون
Plugin مفعلة. تُحمّل تعليمات Skill الكاملة عند الطلب، لذلك
لا تتحمل الجولات الروتينية تكلفة الرموز الكاملة.

## أمر المتصفح أو الأداة مفقودان

إذا كان `openclaw browser` غير معروف بعد ترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` تحذف `browser` مع عدم وجود كتلة تكوين جذرية `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

كتلة جذرية صريحة `browser`، مثل `browser.enabled=true` أو `browser.profiles.<name>`، تنشّط Plugin المتصفح المدمجة حتى ضمن `plugins.allow` مقيّدة، بما يطابق سلوك تكوين القنوات. لا يحل `plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` محل العضوية في قائمة السماح بمفردهما. كما أن إزالة `plugins.allow` بالكامل تعيد الوضع الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب إضافة).
- `user`: ملف تعريف مدمج للإرفاق عبر Chrome MCP بجلسة **Chrome الحقيقية التي سجّلت الدخول إليها**.

لاستدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون الجلسات القائمة المسجل دخولها مهمة ويكون المستخدم
  أمام الحاسوب للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

عيّن `browser.defaultProfile: "openclaw"` إذا أردت الوضع المُدار افتراضيًا.

## التكوين

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

<Accordion title="Ports and reachability">

- ترتبط خدمة التحكم بـ loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى إزاحة المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيًا؛ عيّن هذه القيم فقط لـ CDP البعيد. تكون القيمة الافتراضية لـ `cdpUrl` هي منفذ CDP المحلي المُدار عندما لا يتم تعيينها.
- ينطبق `remoteCdpTimeoutMs` على فحوصات قابلية الوصول إلى CDP HTTP البعيد و`attachOnly`
  وطلبات HTTP لفتح علامات التبويب؛ وينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات CDP WebSocket الخاصة بها.
- `localLaunchTimeoutMs` هو الميزانية الزمنية لعملية Chrome مُدارة ومُشغّلة محليًا
  حتى تكشف نقطة نهاية CDP HTTP الخاصة بها. `localCdpReadyTimeoutMs` هو
  ميزانية المتابعة لجاهزية CDP websocket بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi، أو VPS منخفض الموارد، أو الأجهزة الأقدم حيث يبدأ Chromium
  ببطء. يجب أن تكون القيم أعدادًا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض
  قيم التكوين غير الصالحة.
- تُقطع دائرة إخفاقات تشغيل/جاهزية Chrome المُدار المتكررة لكل
  ملف تعريف. بعد عدة إخفاقات متتالية، يوقف OpenClaw محاولات التشغيل الجديدة
  مؤقتًا بدلًا من تشغيل Chromium عند كل استدعاء لأداة المتصفح. أصلح
  مشكلة بدء التشغيل، أو عطّل المتصفح إذا لم تكن بحاجة إليه، أو أعد تشغيل
  Gateway بعد الإصلاح.
- `actionTimeoutMs` هو الميزانية الافتراضية لطلبات `act` الخاصة بالمتصفح عندما لا يمرر المستدعي `timeoutMs`. يضيف نقل العميل نافذة سماح صغيرة بحيث يمكن للانتظارات الطويلة أن تنتهي بدلًا من انتهاء المهلة عند حد HTTP.
- `tabCleanup` هو تنظيف بأفضل جهد لعلامات التبويب التي تفتحها جلسات متصفح الوكيل الأساسي. لا يزال تنظيف دورة حياة الوكيل الفرعي، وcron، وACP يغلق علامات التبويب المتتبعة الصريحة في نهاية الجلسة؛ وتبقي الجلسات الأساسية علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتتبعة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="SSRF policy">

- تخضع تنقلات المتصفح وفتح علامات التبويب لحماية SSRF قبل التنقل، وتُعاد فحوصها بأفضل جهد على عنوان URL النهائي `http(s)` بعد ذلك.
- في وضع SSRF الصارم، تُفحص أيضًا عمليات اكتشاف نقطة نهاية CDP البعيدة ومجسات `/json/version` (`cdpUrl`).
- لا تقوم متغيرات بيئة Gateway/المزوّد `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` بتمرير متصفح OpenClaw المُدار عبر وكيل تلقائيًا. يبدأ Chrome المُدار باتصال مباشر افتراضيًا حتى لا تضعف إعدادات وكيل المزوّد فحوصات SSRF الخاصة بالمتصفح.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرّر أعلام Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يحظر وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يتم تفعيل وصول المتصفح إلى الشبكة الخاصة عمدًا.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّل افتراضيًا؛ فعّله فقط عندما يكون وصول المتصفح إلى الشبكة الخاصة موثوقًا عمدًا.
- يظل `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.

</Accordion>

<Accordion title="Profile behavior">

- يعني `attachOnly: true` عدم تشغيل متصفح محلي أبدًا؛ لا يتم إلا الاتصال إذا كان هناك متصفح قيد التشغيل بالفعل.
- يمكن ضبط `headless` عموميًا أو لكل ملف تعريف مُدار محليًا. تتجاوز القيم الخاصة بملف التعريف `browser.headless`، بحيث يمكن أن يبقى ملف تعريف مُشغّل محليًا بلا واجهة بينما يظل آخر مرئيًا.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless` تشغيلًا
  بلا واجهة لمرة واحدة لملفات التعريف المُدارة محليًا من دون إعادة كتابة
  `browser.headless` أو إعدادات ملف التعريف. ترفض ملفات تعريف الجلسات الموجودة مسبقًا، وملفات تعريف الاتصال فقط، وملفات تعريف CDP
  البعيدة هذا التجاوز لأن OpenClaw لا يشغّل عمليات
  المتصفح تلك.
- على مضيفي Linux من دون `DISPLAY` أو `WAYLAND_DISPLAY`، تتحول ملفات التعريف المُدارة محليًا
  افتراضيًا إلى وضع بلا واجهة تلقائيًا عندما لا تختار البيئة ولا إعدادات ملف التعريف/الإعدادات العمومية
  وضع الواجهة صراحةً. يعرض `openclaw browser status --json`
  قيمة `headlessSource` باعتبارها `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيل الإطلاقات المُدارة محليًا بلا واجهة للعملية
  الحالية. يفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع الواجهة للبدايات العادية
  ويُرجع خطأً قابلًا للتنفيذ على مضيفي Linux الذين لا يملكون خادم عرض؛
  ولا يزال طلب `start --headless` الصريح يتفوق لهذا التشغيل الواحد.
- يمكن ضبط `executablePath` عموميًا أو لكل ملف تعريف مُدار محليًا. تتجاوز القيم الخاصة بملف التعريف `browser.executablePath`، بحيث يمكن لملفات تعريف مُدارة مختلفة تشغيل متصفحات مختلفة مبنية على Chromium. يقبل كلا الشكلين `~` للدليل الرئيسي لنظام التشغيل لديك.
- يلوّن `color` (في المستوى الأعلى ولكل ملف تعريف) واجهة المتصفح حتى تتمكن من معرفة ملف التعريف النشط.
- ملف التعريف الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم الذي تم تسجيل الدخول إليه.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` لذلك المشغل.
- اضبط `browser.profiles.<name>.userDataDir` عندما ينبغي لملف تعريف جلسة موجودة مسبقًا الاتصال بملف تعريف مستخدم Chromium غير افتراضي (Brave وEdge وما إلى ذلك). يقبل هذا المسار أيضًا `~` للدليل الرئيسي لنظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدام Brave أو متصفح آخر مبني على Chromium

إذا كان متصفح **النظام الافتراضي** لديك مبنيًا على Chromium (Chrome/Brave/Edge/إلخ)،
فسيستخدمه OpenClaw تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. تقبل قيم `executablePath` في المستوى الأعلى ولكل ملف تعريف `~`
للدليل الرئيسي لنظام التشغيل لديك:

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

لا يؤثر `executablePath` الخاص بملف التعريف إلا في ملفات التعريف المُدارة محليًا التي
يشغّلها OpenClaw. تتصل ملفات تعريف `existing-session` بمتصفح قيد التشغيل بالفعل
بدلًا من ذلك، وتستخدم ملفات تعريف CDP البعيدة المتصفح خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة تحكم local loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ يوكّل Gateway إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الاتصال بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغّل OpenClaw متصفحًا محليًا.
- لخدمات CDP المُدارة خارجيًا على local loopback (على سبيل المثال Browserless في
  Docker المنشور إلى `127.0.0.1`)، اضبط أيضًا `attachOnly: true`. يُعامل CDP على local loopback
  من دون `attachOnly` باعتباره ملف تعريف متصفح محليًا مُدارًا بواسطة OpenClaw.
- لا يؤثر `headless` إلا في ملفات التعريف المُدارة محليًا التي يشغّلها OpenClaw. ولا يعيد تشغيل متصفحات الجلسات الموجودة مسبقًا أو CDP البعيدة أو يغيّرها.
- يتبع `executablePath` قاعدة ملف التعريف المُدار محليًا نفسها. تغييره على
  ملف تعريف مُدار محليًا قيد التشغيل يضع علامة على ذلك الملف لإعادة التشغيل/المصالحة بحيث
  يستخدم التشغيل التالي الملف التنفيذي الجديد.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المُدارة محليًا: يوقف `openclaw browser stop` عملية المتصفح التي
  شغّلها OpenClaw
- ملفات تعريف الاتصال فقط وملفات تعريف CDP البعيدة: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات محاكاة Playwright/CDP (إطار العرض،
  ونظام الألوان، واللغة المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، والحالات المشابهة)، حتى
  لو لم يكن OpenClaw قد شغّل أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد المصادقة:

- رموز الاستعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ WebSocket الخاص بـ CDP. فضّل متغيرات البيئة أو مديري الأسرار من أجل
الرموز بدلًا من تثبيتها في ملفات الإعدادات.

## وكيل متصفح Node (افتراضي بلا إعدادات)

إذا شغّلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أدوات المتصفح تلقائيًا إلى ذلك Node من دون أي إعداد متصفح إضافي.
هذا هو المسار الافتراضي للـ Gateways البعيدة.

ملاحظات:

- يعرض مضيف Node خادم التحكم في المتصفح المحلي عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بـ Node نفسه (مثل المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للسلوك القديم/الافتراضي: تبقى جميع ملفات التعريف المكوّنة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، يعامله OpenClaw كحدّ بأقل صلاحيات: لا يمكن استهداف إلا ملفات التعريف المدرجة في قائمة السماح، وتُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على Node: `nodeHost.browserProxy.enabled=false`
  - على Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

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
- إذا أعطاك Browserless عنوان URL أساسيًا من نوع HTTPS، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو إبقاء عنوان HTTPS وترك OpenClaw
  يكتشف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما يكون Browserless مستضافًا ذاتيًا في Docker ويعمل OpenClaw على المضيف، عامل
Browserless كخدمة CDP مُدارة خارجيًا:

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

يجب أن يكون العنوان في `browser.profiles.browserless.cdpUrl` قابلًا للوصول من عملية
OpenClaw. يجب أن يعلن Browserless أيضًا عن نقطة نهاية مطابقة وقابلة للوصول؛
اضبط `EXTERNAL` في Browserless على أساس WebSocket نفسه العام إلى OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان شبكة Docker خاصة
مستقر. إذا أرجع `/json/version` قيمة `webSocketDebuggerUrl` تشير إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو CDP HTTP سليمًا بينما يظل اتصال WebSocket
يفشل.

لا تترك `attachOnly` غير مضبوط لملف تعريف Browserless على local loopback. من دون
`attachOnly`، يعامل OpenClaw منفذ local loopback باعتباره ملف تعريف متصفح مُدارًا محليًا
وقد يبلّغ بأن المنفذ قيد الاستخدام لكنه ليس مملوكًا لـ OpenClaw.

## مزوّدو CDP عبر WebSocket المباشر

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المعتمد على HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين CDP URL ويختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** - `http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw `/json/version` لاكتشاف عنوان URL لمصحح WebSocket، ثم
  يتصل. لا يوجد تراجع إلى WebSocket.
- **نقاط نهاية WebSocket مباشرة** - `ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket العارية** - `ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). يجرّب OpenClaw اكتشاف
  `/json/version` عبر HTTP أولًا (مع تطبيع المخطط إلى `http`/`https`)؛
  إذا أعاد الاكتشاف قيمة `webSocketDebuggerUrl` فسيتم استخدامها، وإلا يتراجع OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر العاري. إذا رفضت نقطة نهاية WebSocket
  المعلنة مصافحة CDP لكن الجذر العاري المكوّن
  يقبلها، يتراجع OpenClaw إلى ذلك الجذر أيضًا. يتيح هذا لعنوان `ws://` عارٍ
  موجّه إلى Chrome محلي أن يتصل رغم ذلك، لأن Chrome لا يقبل ترقيات WebSocket
  إلا على المسار المحدد لكل هدف من `/json/version`، بينما تستطيع
  المزوّدات المستضافة الاستمرار في استخدام نقطة نهاية WebSocket الجذرية لديها عندما تعلن نقطة نهاية
  الاكتشاف الخاصة بها عنوان URL قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) هي منصة سحابية لتشغيل
متصفحات بلا واجهة مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء سكنيين.

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

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **API Key** الخاص بك
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase API الحقيقي لديك.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند اتصال WebSocket، لذلك لا
  يلزم تنفيذ خطوة إنشاء جلسة يدوية.
- تتيح الطبقة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للمرجع الكامل للـ API
  وأدلة SDK وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- يقتصر التحكم في المتصفح على loopback؛ تمر تدفقات الوصول عبر مصادقة Gateway أو إقران Node.
- تستخدم واجهة HTTP API لمتصفح loopback المستقل **مصادقة السر المشترك فقط**:
  مصادقة حامل رمز Gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic مع
  كلمة مرور Gateway المكوّنة.
- لا تقوم ترويسات هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"`
  **بمصادقة** واجهة API المستقلة هذه لمتصفح loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم تُكوَّن مصادقة السر المشترك، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في الإعدادات.
- لا ينشئ OpenClaw ذلك الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا مسبقًا على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفي Node على شبكة خاصة (Tailscale)؛ وتجنب تعريضها للعامة.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد كأسرار؛ وفضّل متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات الإعدادات.

## الملفات الشخصية (متصفحات متعددة)

يدعم OpenClaw عدة ملفات شخصية مسماة (إعدادات توجيه). يمكن أن تكون الملفات الشخصية:

- **مدارة بواسطة openclaw**: نسخة متصفح مخصصة مبنية على Chromium لها دليل بيانات مستخدم خاص بها + منفذ CDP
- **بعيدة**: عنوان URL صريح لـ CDP (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف Chrome الشخصي الموجود لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

القيم الافتراضية:

- يُنشأ الملف الشخصي `openclaw` تلقائيًا إذا كان مفقودًا.
- الملف الشخصي `user` مدمج لإرفاق جلسة Chrome MCP موجودة.
- ملفات الجلسات الموجودة اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصص منافذ CDP المحلية من **18800-18899** افتراضيًا.
- يؤدي حذف ملف شخصي إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل كل نقاط نهاية التحكم `?profile=<name>`؛ وتستخدم CLI الخيار `--browser-profile`.

## جلسة موجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الإرفاق بملف شخصي لمتصفح مبني على Chromium قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. يعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة مسبقًا في ملف المتصفح الشخصي ذلك.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة متصفحك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [ملف README لـ Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المدمج:

- `user`

اختياري: أنشئ ملفًا شخصيًا مخصصًا لجلسة موجودة إذا كنت تريد
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي المدمج `user` الاتصال التلقائي بـ Chrome MCP، والذي يستهدف
  ملف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` مع Brave أو Edge أو Chromium أو ملف Chrome شخصي غير افتراضي.
يُوسَّع `~` إلى دليل المنزل في نظام التشغيل لديك:

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

1. افتح صفحة الفحص لذلك المتصفح لتصحيح الأخطاء عن بعد.
2. فعّل تصحيح الأخطاء عن بعد.
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

شكل النجاح:

- يعرض `status` القيمة `driver: existing-session`
- يعرض `status` القيمة `transport: chrome-mcp`
- يعرض `status` القيمة `running: true`
- يسرد `tabs` علامات تبويب المتصفح المفتوحة مسبقًا لديك
- يعيد `snapshot` مراجع من علامة التبويب الحية المحددة

ما يجب فحصه إذا لم يعمل الإرفاق:

- المتصفح الهدف المبني على Chromium هو الإصدار `144+`
- تصحيح الأخطاء عن بعد مفعّل في صفحة الفحص لذلك المتصفح
- عرض المتصفح مطالبة موافقة الإرفاق وقد قبلتها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المستندة إلى Plugin ويتحقق من أن
  Chrome مثبت محليًا لملفات الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل تصحيح الأخطاء عن بعد من جهة المتصفح نيابة عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجل دخول المستخدم فيها.
- إذا استخدمت ملفًا شخصيًا مخصصًا لجلسة موجودة، فمرر اسم ذلك الملف الشخصي الصريح.
- اختر هذا الوضع فقط عندما يكون المستخدم عند الحاسوب للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف Node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من الملف الشخصي المعزول `openclaw` لأنه يستطيع
  العمل داخل جلسة متصفحك المسجل الدخول فيها.
- لا يطلق OpenClaw المتصفح لهذا المشغل؛ بل يرفق به فقط.
- يستخدم OpenClaw تدفق Chrome DevTools MCP الرسمي `--autoConnect` هنا. إذا
  ضُبط `userDataDir`، فيُمرر لاستهداف دليل بيانات المستخدم ذلك.
- يمكن للجلسة الموجودة الإرفاق على المضيف المحدد أو عبر
  Node متصفح متصل. إذا كان Chrome موجودًا في مكان آخر ولا توجد Node متصفح متصلة، فاستخدم
  CDP بعيدًا أو مضيف Node بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP الذي يتم تشغيله لكل ملف شخصي عندما لا يكون تدفق
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفون دون اتصال،
إصدارات مثبتة، ملفات ثنائية موردة):

| الحقل        | ما يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي الذي يُشغَّل بدلًا من `npx`. يُحل كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط التي تُمرر حرفيًا إلى `mcpCommand`. تستبدل وسائط `chrome-devtools-mcp@latest --autoConnect` الافتراضية. |

عند ضبط `cdpUrl` في ملف شخصي لجلسة موجودة، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → `--browserUrl <url>` (نقطة نهاية اكتشاف DevTools عبر HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` (CDP WebSocket مباشر).

لا يمكن الجمع بين أعلام نقاط النهاية و`userDataDir`: عند ضبط `cdpUrl`،
يتم تجاهل `userDataDir` لتشغيل Chrome MCP، لأن Chrome MCP يرفق
بالمتصفح قيد التشغيل خلف نقطة النهاية بدلًا من فتح دليل
ملف شخصي.

<Accordion title="قيود ميزة الجلسة الموجودة">

مقارنة بالملف الشخصي المدار `openclaw`، تكون مشغلات الجلسة الموجودة أكثر تقييدًا:

- **لقطات الشاشة** - تعمل لقطات الصفحة ولقطات العناصر عبر `--ref`؛ أما محددات CSS `--element` فلا تعمل. لا يمكن جمع `--full-page` مع `--ref` أو `--element`. لا يلزم Playwright للقطات شاشة الصفحة أو العناصر المستندة إلى المرجع.
- **الإجراءات** - تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (بدون محددات CSS). ينقر `click-coords` إحداثيات منفذ العرض المرئي ولا يتطلب مرجع snapshot. `click` بزر الفأرة الأيسر فقط. لا يدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`. لا يدعم `press` الخيار `delayMs`. لا تدعم `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` مهلًا زمنية لكل استدعاء. يقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** - يدعم `wait --url` أنماط المطابقة الدقيقة والجزئية وglob؛ ولا يدعم `wait --load networkidle`. تتطلب خطافات الرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، بدون CSS `element`. لا تدعم خطافات مربع الحوار تجاوزات المهلة الزمنية.
- **ميزات المدار فقط** - لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف متصفحك الشخصي.
- **منافذ مخصصة**: يتجنب `9222` لمنع التصادم مع سير عمل التطوير.
- **تحكم حتمي في علامات التبويب**: يعيد `tabs` أولًا `suggestedTargetId`، ثم
  مقابض `tabId` مستقرة مثل `t1`، وتسميات اختيارية، و`targetId` الخام.
  يجب على الوكلاء إعادة استخدام `suggestedTargetId`؛ وتبقى المعرفات الخام متاحة
  لتصحيح الأخطاء والتوافق.

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
- Linux: يفحص مواقع Chrome/Brave/Edge/Chromium الشائعة ضمن `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`.
- Windows: يفحص مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختياري)

لأغراض البرمجة النصية وتصحيح الأخطاء، يعرّض Gateway واجهة **HTTP
تحكم مقتصرة على loopback فقط** صغيرة، بالإضافة إلى CLI مطابق `openclaw browser` (لقطات، مراجع، انتظار
معززات، خرج JSON، سير عمل تصحيح الأخطاء). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للمرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات Gateway على WSL2 + Chrome على Windows عبر مضيفين منفصلين، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء تشغيل CDP مقابل حظر SSRF للتنقل

هذه فئات فشل مختلفة وتشير إلى مسارات كود مختلفة.

- **فشل بدء تشغيل CDP أو الجاهزية** يعني أن OpenClaw لا يستطيع تأكيد أن مستوى التحكم في المتصفح سليم.
- **حظر SSRF للتنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بالسياسة.

أمثلة شائعة:

- فشل بدء تشغيل CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية عبر loopback مكوّنة دون `attachOnly: true`
- حظر SSRF للتنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب بخطأ في سياسة المتصفح/الشبكة بينما لا يزال `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الاثنين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. تعامل مع هذا كمشكلة إمكانية وصول إلى CDP، وليس مشكلة تنقل صفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فمستوى التحكم في المتصفح قيد العمل والفشل في سياسة التنقل أو الصفحة الهدف.
- إذا نجحت `start` و`tabs` و`open` كلها، فمسار التحكم الأساسي في المتصفح المدار سليم.

تفاصيل سلوك مهمة:

- تكون إعدادات المتصفح افتراضيًا كائن سياسة SSRF مغلقًا عند الفشل حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف `openclaw` المدار عبر loopback المحلي، تتخطى فحوصات صحة CDP عمدًا إنفاذ إمكانية الوصول الخاصة بـ SSRF للمتصفح لمستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا تعني نتيجة `start` أو `tabs` الناجحة أن هدف `open` أو `navigate` لاحق مسموح به.

إرشادات الأمان:

- **لا** ترخِ سياسة SSRF للمتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` على الوصول الواسع إلى الشبكة الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون وصول المتصفح إلى الشبكة الخاصة مطلوبًا ومراجعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية المطابقة:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` الخاصة باللقطة للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة أو عنصرًا أو مراجع موسومة).
- يتحقق `browser doctor` من جاهزية Gateway وPlugin والملف الشخصي والمتصفح وعلامة التبويب.
- يقبل `browser` ما يلي:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذف `target`: تكون القيمة الافتراضية للجلسات المعزولة هي `sandbox`، وللجلسات غير المعزولة هي `host`.
  - إذا كان هناك Node قادر على تشغيل المتصفح متصلًا، فقد توجه الأداة إليه تلقائيًا ما لم تثبت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية الوكيل ويتجنب المحددات الهشة.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) - التحكم في المتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) - مخاطر التحكم في المتصفح وتقويته

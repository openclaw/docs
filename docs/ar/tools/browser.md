---
read_when:
    - إضافة أتمتة المتصفح التي يتحكم بها الوكيل
    - تصحيح أخطاء سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المتكاملة في المتصفح + أوامر الإجراءات
title: المتصفح (تديره OpenClaw)
x-i18n:
    generated_at: "2026-06-27T18:38:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d24586c4ac1e271c24511be98e30725f4f589e9f5e703294190058bc3e6a123
    source_path: tools/browser.md
    workflow: 16
---

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي ويُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway (local loopback فقط).

نظرة للمبتدئين:

- فكر فيه كأنه **متصفح منفصل مخصص للوكيل فقط**.
- ملف تعريف `openclaw` لا يمس ملف تعريف متصفحك الشخصي.
- يستطيع الوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** ضمن مسار آمن.
- ملف التعريف المدمج `user` يتصل بجلسة Chrome الحقيقية التي سجلت الدخول إليها عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيا).
- تحكم حتمي في علامات التبويب (سرد/فتح/تركيز/إغلاق).
- إجراءات الوكيل (النقر/الكتابة/السحب/التحديد)، ولقطات الحالة، ولقطات الشاشة، وملفات PDF.
- Skill مدمجة باسم `browser-automation` تعلّم الوكلاء حلقة الاسترداد الخاصة بلقطة الحالة،
  وعلامة التبويب المستقرة، والمرجع القديم، والعائق اليدوي عندما يكون Plugin المتصفح
  مفعلا.
- دعم اختياري لعدة ملفات تعريف (`openclaw`، `work`، `remote`، ...).

هذا المتصفح **ليس** متصفحك اليومي. إنه سطح آمن ومعزول لأتمتة الوكيل
والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة "Browser disabled"، ففعّله في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح مفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

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

تحتاج الإعدادات الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. تعطيل Plugin فقط يزيل `openclaw browser` CLI، وطريقة Gateway `browser.request`، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ وتبقى إعدادات `browser.*` لديك سليمة لاستبدالها.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## إرشادات الوكيل

ملاحظة ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` كلا من `web_search` و
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

بالنسبة إلى وكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
`tools.subagents.tools.allow: ["browser"]` وحدها لا تكفي لأن سياسة الوكيل الفرعي
تُطبق بعد تصفية ملف التعريف.

تشحن Plugin المتصفح مستويين من إرشادات الوكيل:

- وصف أداة `browser` يحمل العقد المختصر الدائم: اختر
  ملف التعريف الصحيح، وأبق المراجع على علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف
  علامات التبويب، وحمّل Skill المتصفح للعمل متعدد الخطوات.
- تحمل Skill المدمجة `browser-automation` حلقة التشغيل الأطول:
  تحقق من الحالة/علامات التبويب أولا، وسمّ علامات تبويب المهمة، وخذ لقطة حالة قبل التصرف، وأعد أخذ لقطة حالة
  بعد تغييرات واجهة المستخدم، واسترد المراجع القديمة مرة واحدة، وأبلغ عن تسجيل الدخول/المصادقة الثنائية/اختبار captcha أو
  عوائق الكاميرا/الميكروفون كإجراء يدوي بدلا من التخمين.

تظهر Skills المدمجة في Plugin ضمن Skills المتاحة للوكيل عندما تكون
Plugin مفعلة. تُحمّل تعليمات Skill الكاملة عند الطلب، لذلك لا تدفع
الدورات الروتينية تكلفة الرموز الكاملة.

## أمر أو أداة المتصفح مفقودة

إذا كان `openclaw browser` غير معروف بعد الترقية، أو كان `browser.request` مفقودا، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو قائمة `plugins.allow` تحذف `browser` ولا توجد كتلة إعداد جذرية باسم `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو `browser.profiles.<name>`، تفعّل Plugin المتصفح المدمجة حتى ضمن `plugins.allow` مقيّدة، بما يطابق سلوك إعدادات القنوات. لا يحل `plugins.entries.browser.enabled=true` ولا `tools.alsoAllow: ["browser"]` محل العضوية في قائمة السماح بمفردهما. كما أن إزالة `plugins.allow` بالكامل تعيد السلوك الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يلزم امتداد).
- `user`: ملف تعريف مدمج للاتصال بـ Chrome MCP لجلسة **Chrome الحقيقية التي سجلت الدخول إليها**.

بالنسبة إلى استدعاءات أداة متصفح الوكيل:

- الافتراضي: استخدم متصفح `openclaw` المعزول.
- فضّل `profile="user"` عندما تكون جلسات تسجيل الدخول الحالية مهمة ويكون المستخدم
  على الكمبيوتر للنقر/الموافقة على أي مطالبة اتصال.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددا.

عيّن `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيا.

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

### رؤية لقطات الشاشة (دعم النماذج النصية فقط)

عندما يكون النموذج الرئيسي نصيا فقط (من دون دعم الرؤية/تعدد الوسائط)، تعيد لقطات شاشة المتصفح
كتلا صورية لا يستطيع النموذج قراءتها. تعيد لقطات شاشة المتصفح استخدام إعدادات فهم الصور الحالية، لذلك يمكن لنموذج صور
معد لفهم الوسائط وصف لقطات الشاشة كنص من دون أي
إعدادات نماذج خاصة بالمتصفح.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // Add fallback candidates; first success wins
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // Shared media models also work when tagged for image support.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // Existing image-model defaults are also honored.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**كيف يعمل ذلك:**

1. يستدعي الوكيل `browser screenshot` ← تُلتقط الصورة إلى القرص كالمعتاد.
2. تسأل أداة المتصفح وقت تشغيل فهم الصور الحالي عما إذا كان
   يستطيع وصف لقطة الشاشة باستخدام نماذج صور الوسائط المعدة، أو نماذج الوسائط المشتركة
   أو الإعدادات الافتراضية لنموذج الصور، أو مزود صور مدعوم بالمصادقة.
3. يعيد نموذج الرؤية وصفا نصيا، ويُغلّف باستخدام
   `wrapExternalContent` (حارس حقن المطالبات) ويُعاد إلى الوكيل
   ككتلة نصية بدلا من كتلة صورة.
4. إذا كان فهم الصور غير متاح، أو تم تخطيه، أو فشل، يعود المتصفح
   إلى إعادة كتلة الصورة الأصلية.

استخدم حقول `tools.media.image` / `tools.media.models` الحالية لبدائل النماذج،
والمهل الزمنية، وحدود البايت، وملفات التعريف، وإعدادات طلبات المزود.

إذا كان النموذج الرئيسي النشط يدعم الرؤية بالفعل ولم يتم إعداد نموذج فهم صور
صريح، يبقي OpenClaw نتيجة الصورة الطبيعية حتى يستطيع
النموذج الرئيسي قراءة لقطة الشاشة مباشرة.

<AccordionGroup>

<Accordion title="Ports and reachability">

- ترتبط خدمة التحكم بـ local loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = Gateway + 2). يؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى نقل المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات تعريف `openclaw` المحلية `cdpPort`/`cdpUrl` تلقائيا؛ عيّن هذه فقط
  لملفات تعريف CDP البعيدة أو الاتصال بنقطة نهاية جلسة موجودة. يتخذ `cdpUrl` افتراضيا
  منفذ CDP المحلي المُدار عند عدم تعيينه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات إمكانية الوصول عبر HTTP لـ CDP عن بعد و`attachOnly`
  وطلبات HTTP لفتح علامات التبويب؛ وينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات WebSocket الخاصة بـ CDP لديهم.
- `localLaunchTimeoutMs` هو الميزانية الزمنية لعملية Chrome مُدارة ومُشغلة محليا
  كي تعرض نقطة نهاية CDP HTTP الخاصة بها. `localCdpReadyTimeoutMs` هو
  ميزانية المتابعة لجاهزية WebSocket الخاصة بـ CDP بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi أو خوادم VPS منخفضة الأداء أو الأجهزة الأقدم حيث يبدأ Chromium
  ببطء. يجب أن تكون القيم أعدادا صحيحة موجبة حتى `120000` مللي ثانية؛ وتُرفض
  قيم الإعداد غير الصالحة.
- تُقطع دائرة إخفاقات تشغيل/جاهزية Chrome المُدار المتكررة لكل
  ملف تعريف. بعد عدة إخفاقات متتالية، يوقف OpenClaw محاولات التشغيل الجديدة
  مؤقتا ولفترة قصيرة بدلا من تشغيل Chromium عند كل استدعاء لأداة المتصفح. أصلح
  مشكلة بدء التشغيل، أو عطّل المتصفح إذا لم يكن مطلوبا، أو أعد تشغيل
  Gateway بعد الإصلاح.
- `actionTimeoutMs` هو الميزانية الافتراضية لطلبات `act` في المتصفح عندما لا يمرر المستدعي `timeoutMs`. يضيف نقل العميل نافذة سماح صغيرة حتى تكتمل فترات الانتظار الطويلة بدلا من انتهاء المهلة عند حد HTTP.
- `tabCleanup` هو تنظيف بأفضل جهد لعلامات التبويب التي تفتحها جلسات متصفح الوكيل الأساسي. لا يزال تنظيف دورة حياة الوكلاء الفرعيين وCron وACP يغلق علامات التبويب الصريحة المتتبعة لديهم عند نهاية الجلسة؛ وتحافظ الجلسات الأساسية على علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتتبعة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="SSRF policy">

- تُحرس عمليات تنقّل المتصفح وفتح التبويبات من SSRF قبل التنقّل، ثم تُعاد محاولة فحصها بعد ذلك على عنوان URL النهائي من نوع `http(s)` بأفضل جهد.
- في وضع SSRF الصارم، تُفحص أيضًا عملية اكتشاف نقطة نهاية CDP البعيدة ومجسّات `/json/version` (`cdpUrl`).
- لا تؤدي متغيرات البيئة `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` الخاصة بـ Gateway/المزوّد إلى تمرير المتصفح المُدار بواسطة OpenClaw عبر الوكيل تلقائيًا. يُشغَّل Chrome المُدار باتصال مباشر افتراضيًا حتى لا تُضعف إعدادات وكيل المزوّد فحوصات SSRF للمتصفح.
- تتجاوز مجسّات جاهزية CDP المحلية المُدارة بواسطة OpenClaw واتصالات WebSocket الخاصة بـ DevTools وكيل الشبكة المُدار لنقطة نهاية loopback التي أُطلقت بالضبط، لذلك يظل `openclaw browser start` يعمل عندما يحظر وكيل المشغّل خروج loopback.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرّر أعلام Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. يحظر وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يُمكَّن الوصول إلى المتصفح عبر الشبكة الخاصة عمدًا.
- يكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطّلًا افتراضيًا؛ فعّله فقط عندما يكون الوصول إلى المتصفح عبر الشبكة الخاصة موثوقًا به عمدًا.
- يظل `browser.ssrfPolicy.allowPrivateNetwork` مدعومًا كاسم بديل قديم.

</Accordion>

<Accordion title="سلوك الملف الشخصي">

- يعني `attachOnly: true` عدم تشغيل متصفح محلي مطلقًا؛ يتم الإرفاق فقط إذا كان هناك متصفح قيد التشغيل بالفعل.
- يمكن ضبط `headless` عالميًا أو لكل ملف شخصي مُدار محليًا. تتجاوز القيم الخاصة بكل ملف شخصي `browser.headless`، بحيث يمكن أن يظل ملف شخصي مُشغّل محليًا بلا واجهة بينما يبقى آخر مرئيًا.
- يطلب `POST /start?headless=true` و`openclaw browser start --headless` تشغيلًا
  بلا واجهة لمرة واحدة للملفات الشخصية المُدارة محليًا من دون إعادة كتابة
  `browser.headless` أو إعدادات الملف الشخصي. ترفض ملفات الجلسات الحالية والإرفاق فقط
  وCDP البعيد هذا التجاوز لأن OpenClaw لا يشغّل عمليات
  المتصفح هذه.
- على مضيفي Linux الذين لا تحتوي بيئتهم على `DISPLAY` أو `WAYLAND_DISPLAY`، تتحول الملفات الشخصية المُدارة
  محليًا افتراضيًا إلى وضع بلا واجهة تلقائيًا عندما لا تختار البيئة ولا إعدادات الملف الشخصي/العالمية
  وضعًا بواجهة صراحة. يبلّغ `openclaw browser status --json`
  عن `headlessSource` كـ `env` أو `profile` أو `config`
  أو `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيل الإطلاقات المُدارة محليًا بلا واجهة للعملية
  الحالية. يفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع الواجهة للإطلاقات
  العادية ويعيد خطأً قابلًا للتنفيذ على مضيفي Linux من دون خادم عرض؛
  ويظل طلب `start --headless` الصريح هو الغالب لذلك الإطلاق الواحد.
- يمكن ضبط `executablePath` عالميًا أو لكل ملف شخصي مُدار محليًا. تتجاوز القيم الخاصة بكل ملف شخصي `browser.executablePath`، بحيث يمكن لملفات شخصية مُدارة مختلفة تشغيل متصفحات مختلفة مبنية على Chromium. يقبل كلا الشكلين `~` للدليل الرئيسي في نظام التشغيل لديك.
- يلوّن `color` (على المستوى الأعلى ولكل ملف شخصي) واجهة المتصفح حتى تتمكن من رؤية الملف الشخصي النشط.
- الملف الشخصي الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجّل الدخول.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا Chrome → Brave → Edge → Chromium → Chrome Canary.
- يستخدم `driver: "existing-session"` Chrome DevTools MCP بدلًا من CDP الخام. يمكنه الإرفاق عبر الاتصال التلقائي لـ Chrome MCP، أو عبر `cdpUrl` عندما تكون لديك بالفعل نقطة نهاية DevTools للمتصفح قيد التشغيل.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن يُرفق ملف شخصي لجلسة حالية بملف مستخدم Chromium غير افتراضي (Brave وEdge وما إلى ذلك). يقبل هذا المسار أيضًا `~` للدليل الرئيسي في نظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدام Brave أو متصفح آخر مبني على Chromium

إذا كان متصفح **النظام الافتراضي** لديك مبنيًا على Chromium (Chrome/Brave/Edge/إلخ)،
فسيستخدمه OpenClaw تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. تقبل قيم `executablePath` على المستوى الأعلى ولكل ملف شخصي `~`
للدليل الرئيسي في نظام التشغيل لديك:

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

لا يؤثر `executablePath` الخاص بكل ملف شخصي إلا في الملفات الشخصية المُدارة محليًا التي
يشغّلها OpenClaw. تُرفق ملفات `existing-session` الشخصية بمتصفح قيد التشغيل بالفعل
بدلًا من ذلك، وتستخدم ملفات CDP البعيدة المتصفح خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم عبر loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ يمرر Gateway إجراءات المتصفح إليه عبر وكيل.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الإرفاق بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغّل OpenClaw متصفحًا محليًا.
- بالنسبة إلى خدمات CDP المُدارة خارجيًا على loopback (مثل Browserless في
  Docker المنشور إلى `127.0.0.1`)، اضبط أيضًا `attachOnly: true`. يُعامل CDP على loopback
  من دون `attachOnly` كملف شخصي لمتصفح محلي مُدار بواسطة OpenClaw.
- لا يؤثر `headless` إلا في الملفات الشخصية المُدارة محليًا التي يشغّلها OpenClaw. ولا يعيد تشغيل متصفحات الجلسات الحالية أو CDP البعيدة أو يغيّرها.
- يتبع `executablePath` قاعدة الملف الشخصي المُدار محليًا نفسها. يؤدي تغييره على
  ملف شخصي مُدار محليًا قيد التشغيل إلى وضع علامة على ذلك الملف الشخصي لإعادة التشغيل/المصالحة حتى
  يستخدم الإطلاق التالي الملف التنفيذي الجديد.

يختلف سلوك الإيقاف حسب وضع الملف الشخصي:

- الملفات الشخصية المُدارة محليًا: يوقف `openclaw browser stop` عملية المتصفح التي
  شغّلها OpenClaw
- ملفات الإرفاق فقط وCDP البعيدة: يغلق `openclaw browser stop` جلسة
  التحكم النشطة ويحرر تجاوزات محاكاة Playwright/CDP (منفذ العرض،
  مخطط الألوان، اللغة المحلية، المنطقة الزمنية، وضع عدم الاتصال، وحالة مشابهة)، حتى
  مع عدم تشغيل أي عملية متصفح بواسطة OpenClaw

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد مصادقة:

- رموز الاستعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic (مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط نهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. فضّل متغيرات البيئة أو مديري الأسرار للرموز
بدلًا من تثبيتها في ملفات الإعدادات.

## وكيل متصفح Node (افتراضي بلا إعدادات)

إذا شغّلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
توجيه استدعاءات أدوات المتصفح تلقائيًا إلى ذلك الـ Node من دون أي إعدادات متصفح إضافية.
هذا هو المسار الافتراضي للبوابات البعيدة.

ملاحظات:

- يعرّض مضيف Node خادم التحكم المحلي في المتصفح الخاص به عبر **أمر وكيل**.
- تأتي الملفات الشخصية من إعدادات `browser.profiles` الخاصة بالـ Node نفسه (كما في المحلي).
- `nodeHost.browserProxy.allowProfiles` اختياري. اتركه فارغًا للسلوك القديم/الافتراضي: تظل كل الملفات الشخصية المضبوطة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء/حذف الملفات الشخصية.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، فسيعامله OpenClaw كحد أقل امتيازًا: لا يمكن استهداف إلا الملفات الشخصية المدرجة في قائمة السماح، وتُحظر مسارات إنشاء/حذف الملفات الشخصية الدائمة على سطح الوكيل.
- عطّله إذا كنت لا تريده:
  - على الـ Node: `nodeHost.browserProxy.enabled=false`
  - على Gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP بعيد مستضاف)

[Browserless](https://browserless.io) خدمة Chromium مستضافة تتيح
عناوين URL لاتصال CDP عبر HTTPS وWebSocket. يمكن لـ OpenClaw استخدام أي من الشكلين، لكن
لملف شخصي لمتصفح بعيد يكون الخيار الأبسط هو عنوان WebSocket المباشر
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
- إذا أعطاك Browserless عنوان URL أساسيًا عبر HTTPS، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو إبقاء عنوان HTTPS وترك OpenClaw
  يكتشف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما يكون Browserless مستضافًا ذاتيًا في Docker ويعمل OpenClaw على المضيف، تعامل
مع Browserless كخدمة CDP مُدارة خارجيًا:

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
OpenClaw. يجب على Browserless أيضًا الإعلان عن نقطة نهاية مطابقة قابلة للوصول؛
اضبط `EXTERNAL` في Browserless على قاعدة WebSocket نفسها العامة بالنسبة إلى OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان شبكة Docker خاصة
ثابت. إذا أعاد `/json/version` قيمة `webSocketDebuggerUrl` تشير إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو CDP HTTP سليمًا بينما يظل إرفاق WebSocket
يفشل.

لا تترك `attachOnly` غير مضبوط لملف Browserless شخصي على loopback. من دون
`attachOnly`، يعامل OpenClaw منفذ loopback كملف شخصي لمتصفح محلي مُدار
وقد يبلّغ أن المنفذ قيد الاستخدام لكنه ليس مملوكًا لـ OpenClaw.

## مزوّدو CDP عبر WebSocket مباشر

تعرض بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
الاكتشاف القياسي لـ CDP المستند إلى HTTP (`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** - `http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw `/json/version` لاكتشاف عنوان URL الخاص بمصحح WebSocket، ثم
  يتصل. لا يوجد احتياط WebSocket.
- **نقاط نهاية WebSocket مباشرة** - `ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket مجردة** - `ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` (مثل [Browserless](https://browserless.io)،
  [Browserbase](https://www.browserbase.com)). يحاول OpenClaw اكتشاف HTTP
  عبر `/json/version` أولًا (مع تطبيع المخطط إلى `http`/`https`)؛
  إذا أعاد الاكتشاف `webSocketDebuggerUrl` فسيُستخدم، وإلا يعود OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر المجرد. إذا رفضت نقطة نهاية
  WebSocket المُعلنة مصافحة CDP لكن الجذر المجرد المضبوط
  يقبلها، يعود OpenClaw إلى ذلك الجذر أيضًا. يتيح هذا لجذر `ws://` مجرد
  يشير إلى Chrome محلي أن يتصل رغم ذلك، لأن Chrome لا يقبل ترقيات WebSocket
  إلا على المسار المحدد لكل هدف من `/json/version`، بينما يمكن للمزوّدين
  المستضافين الاستمرار في استخدام نقطة نهاية WebSocket الجذرية لديهم عندما تعلن نقطة نهاية
  الاكتشاف الخاصة بهم عن عنوان URL قصير العمر غير مناسب لـ Playwright CDP.

يستخدم `openclaw browser doctor` منطق الاكتشاف أولًا ثم احتياط WebSocket
نفسه المستخدم عند الإرفاق في وقت التشغيل، لذلك لا يُبلّغ التشخيص عن عنوان URL بجذر مجرد يتصل بنجاح
على أنه غير قابل للوصول.

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

- [سجّل](https://www.browserbase.com/sign-up) وانسخ **مفتاح API**
  من [لوحة النظرة العامة](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح API الحقيقي الخاص بك في Browserbase.
- ينشئ Browserbase جلسة متصفح تلقائيًا عند اتصال WebSocket، لذلك لا حاجة إلى
  خطوة إنشاء جلسة يدويًا.
- تتيح الباقة المجانية جلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الباقات المدفوعة.
- راجع [توثيق Browserbase](https://docs.browserbase.com) للحصول على مرجع API
  الكامل، وأدلة SDK، وأمثلة التكامل.

### Notte

[Notte](https://www.notte.cc) منصة سحابية لتشغيل متصفحات headless
مع التخفي المدمج، ووكلاء سكنيين، وGateway WebSocket أصلي لـ CDP.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

ملاحظات:

- [سجّل](https://console.notte.cc) وانسخ **مفتاح API** من
  صفحة إعدادات وحدة التحكم.
- استبدل `<NOTTE_API_KEY>` بمفتاح API الحقيقي الخاص بك في Notte.
- ينشئ Notte جلسة متصفح تلقائيًا عند اتصال WebSocket، لذلك لا حاجة إلى
  خطوة إنشاء جلسة يدويًا. تُدمّر الجلسة عند قطع اتصال
  WebSocket.
- تتيح الباقة المجانية خمس جلسات متزامنة و100 ساعة متصفح
  مدى الحياة. راجع [الأسعار](https://www.notte.cc/#pricing) لمعرفة حدود الباقات المدفوعة.
- راجع [توثيق Notte](https://docs.notte.cc) للحصول على مرجع API الكامل، وأدلة SDK
  وأمثلة التكامل.

## الأمان

الأفكار الرئيسية:

- التحكم في المتصفح مقصور على loopback؛ يمر الوصول عبر مصادقة Gateway أو إقران Node.
- تستخدم واجهة HTTP API المستقلة للمتصفح عبر loopback **مصادقة السر المشترك فقط**:
  مصادقة حامل رمز Gateway، أو `x-openclaw-password`، أو مصادقة HTTP Basic باستخدام
  كلمة مرور Gateway المكوّنة.
- عناوين هوية Tailscale Serve و`gateway.auth.mode: "trusted-proxy"` لا
  **تصادق** واجهة API المستقلة هذه للمتصفح عبر loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم تُكوَّن مصادقة سر مشترك، فإن OpenClaw
  ينشئ رمز Gateway مخصصًا لوقت التشغيل فقط لذلك التشغيل. كوّن
  `gateway.auth.token`، أو `gateway.auth.password`، أو `OPENCLAW_GATEWAY_TOKEN`، أو
  `OPENCLAW_GATEWAY_PASSWORD` صراحةً إذا كان العملاء يحتاجون إلى سر ثابت عبر
  عمليات إعادة التشغيل.
- لا ينشئ OpenClaw ذلك الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا مسبقًا على `password`، أو `none`، أو `trusted-proxy`.
- أبقِ Gateway وأي مضيفي Node على شبكة خاصة (Tailscale)؛ وتجنب التعريض العام.
- تعامل مع عناوين URL/الرموز البعيدة لـ CDP كأسرار؛ وفضّل متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر حيثما أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات الإعداد.

## الملفات الشخصية (متعدد المتصفحات)

يدعم OpenClaw عدة ملفات شخصية مسماة (إعدادات توجيه). يمكن أن تكون الملفات الشخصية:

- **مُدارة بواسطة OpenClaw**: نسخة متصفح مخصصة مبنية على Chromium مع دليل بيانات مستخدم خاص بها + منفذ CDP
- **بعيدة**: عنوان URL صريح لـ CDP (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملفك الشخصي الحالي في Chrome عبر الاتصال التلقائي بـ Chrome DevTools MCP

الإعدادات الافتراضية:

- يُنشأ الملف الشخصي `openclaw` تلقائيًا إذا كان مفقودًا.
- الملف الشخصي `user` مدمج لإرفاق جلسة Chrome MCP موجودة.
- ملفات الجلسات الموجودة اختيارية بعد `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصص منافذ CDP المحلية من **18800-18899** افتراضيًا.
- يؤدي حذف ملف شخصي إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل جميع نقاط نهاية التحكم `?profile=<name>`؛ وتستخدم CLI الخيار `--browser-profile`.

## جلسة موجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الإرفاق بملف شخصي لمتصفح مبني على Chromium قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. يعيد ذلك استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة مسبقًا في ذلك الملف الشخصي للمتصفح.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المدمج:

- `user`

اختياري: أنشئ ملفك الشخصي المخصص لجلسة موجودة إذا كنت تريد
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي المدمج `user` الاتصال التلقائي لـ Chrome MCP، الذي يستهدف
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

1. افتح صفحة الفحص لذلك المتصفح من أجل التصحيح عن بُعد.
2. فعّل التصحيح عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرفق OpenClaw.

صفحات الفحص الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار smoke للإرفاق المباشر:

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
- يسرد `tabs` علامات تبويب المتصفح المفتوحة لديك مسبقًا
- يعيد `snapshot` مراجع من علامة التبويب المباشرة المحددة

ما يجب التحقق منه إذا لم يعمل الإرفاق:

- المتصفح الهدف المبني على Chromium بإصدار `144+`
- التصحيح عن بُعد مفعّل في صفحة الفحص لذلك المتصفح
- عرض المتصفح مطالبة موافقة الإرفاق وقبلتها
- إذا بدأ Chrome باستخدام `--remote-debugging-port` صريح، فاضبط
  `browser.profiles.<name>.cdpUrl` على نقطة نهاية DevTools تلك بدلًا من الاعتماد
  على الاتصال التلقائي لـ Chrome MCP
- يرحّل `openclaw doctor` إعداد المتصفح القديم المبني على الامتداد ويتحقق من أن
  Chrome مثبت محليًا لملفات الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل التصحيح عن بُعد من جانب المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة متصفح المستخدم الذي سجّل الدخول.
- إذا استخدمت ملفًا شخصيًا مخصصًا لجلسة موجودة، فمرر اسم ذلك الملف الشخصي الصريح.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على مطالبة
  الإرفاق.
- يمكن لـ Gateway أو مضيف Node تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى مخاطرة من الملف الشخصي المعزول `openclaw` لأنه يمكنه
  العمل داخل جلسة متصفحك المسجل الدخول.
- لا يشغّل OpenClaw المتصفح لهذا المشغل؛ بل يرفق به فقط.
- يستخدم OpenClaw هنا تدفق Chrome DevTools MCP الرسمي `--autoConnect`. إذا
  ضُبط `userDataDir`، فيُمرر لاستهداف دليل بيانات ذلك المستخدم.
- يمكن للجلسة الموجودة الإرفاق على المضيف المحدد أو عبر
  Node متصفح متصل. إذا كان Chrome موجودًا في مكان آخر ولا يوجد Node متصفح متصل، فاستخدم
  CDP بعيدًا أو مضيف Node بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP الذي يُشغّل لكل ملف شخصي عندما لا يكون تدفق
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفون غير متصلين،
إصدارات مثبتة، ثنائيات موردة):

| الحقل        | ما يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي المراد تشغيله بدلًا من `npx`. يُحل كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط التي تُمرر حرفيًا إلى `mcpCommand`. تستبدل الوسائط الافتراضية `chrome-devtools-mcp@latest --autoConnect`. |

عند ضبط `cdpUrl` على ملف شخصي لجلسة موجودة، يتخطى OpenClaw
`--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → `--browserUrl <url>` (نقطة نهاية اكتشاف HTTP لـ DevTools).
- `ws(s)://...` → `--wsEndpoint <url>` (WebSocket مباشر لـ CDP).

لا يمكن دمج أعلام نقاط النهاية و`userDataDir`: عند ضبط `cdpUrl`،
يُتجاهل `userDataDir` لتشغيل Chrome MCP، لأن Chrome MCP يرفق بالمتصفح
قيد التشغيل خلف نقطة النهاية بدلًا من فتح دليل ملف شخصي.

<Accordion title="قيود ميزة الجلسة الموجودة">

مقارنةً بالملف الشخصي المُدار `openclaw`، تكون مشغلات الجلسة الموجودة أكثر تقييدًا:

- **لقطات الشاشة** - تعمل لقطات الصفحة ولقطات العناصر باستخدام `--ref`؛ ولا تعمل محددات CSS `--element`. لا يمكن دمج `--full-page` مع `--ref` أو `--element`. لا يلزم Playwright للقطات شاشة الصفحة أو العناصر المبنية على المرجع.
- **الإجراءات** - تتطلب `click`، و`type`، و`hover`، و`scrollIntoView`، و`drag`، و`select` مراجع snapshot (لا توجد محددات CSS). ينقر `click-coords` على إحداثيات إطار العرض المرئية ولا يتطلب مرجع snapshot. `click` بزر الفأرة الأيسر فقط. لا يدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`. لا يدعم `press` الخيار `delayMs`. لا تدعم `type`، و`hover`، و`scrollIntoView`، و`drag`، و`select`، و`fill`، و`evaluate` مهلات لكل استدعاء. يقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** - يدعم `wait --url` المطابقة التامة، والسلسلة الفرعية، وأنماط glob؛ ولا يُدعم `wait --load networkidle` على ملفات الجلسة الموجودة (يعمل على ملفات CDP المُدارة والخام/البعيدة). تتطلب خطافات الرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، ولا يوجد `element` من CSS. لا تدعم خطافات مربع الحوار تجاوزات المهلة أو `dialogId`.
- **ظهور مربع الحوار** - تتضمن استجابات إجراء المتصفح المُدار `blockedByDialog` و`browserState.dialogs.pending` عندما يفتح إجراء مربع حوار نمطيًا؛ وتتضمن اللقطات أيضًا حالة مربع الحوار المعلقة. استجب باستخدام `browser dialog --accept/--dismiss --dialog-id <id>` أثناء وجود مربع حوار معلق. تظهر مربعات الحوار التي عولجت خارج OpenClaw ضمن `browserState.dialogs.recent`.
- **ميزات خاصة بالمُدار فقط** - لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيل، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملفك الشخصي للمتصفح.
- **منافذ مخصصة**: يتجنب `9222` لمنع التعارضات مع تدفقات عمل التطوير.
- **تحكم حتمي في علامات التبويب**: يعيد `tabs` القيمة `suggestedTargetId` أولًا، ثم
  معرّفات `tabId` ثابتة مثل `t1`، وتسميات اختيارية، و`targetId` الخام.
  يجب على الوكلاء إعادة استخدام `suggestedTargetId`؛ وتبقى المعرّفات الخام متاحة
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
  `/usr/lib/chromium-browser`، بالإضافة إلى Chromium المُدار بواسطة Playwright ضمن
  `PLAYWRIGHT_BROWSERS_PATH` أو `~/.cache/ms-playwright`.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## واجهة API للتحكم (اختيارية)

للسكربتات والتصحيح، يكشف Gateway واجهة HTTP
تحكم صغيرة **مقصورة على loopback** بالإضافة إلى CLI مطابقة `openclaw browser` (لقطات، مراجع، تعزيزات انتظار،
مخرجات JSON، وتدفقات عمل تصحيح). راجع
[واجهة API للتحكم في المتصفح](/ar/tools/browser-control) للحصول على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف مشكلات المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

لإعدادات WSL2 Gateway + Windows Chrome ذات المضيفين المنفصلين، راجع
[استكشاف مشكلات WSL2 + Windows + Chrome CDP البعيد وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF للتنقل

هذه فئات فشل مختلفة وتشير إلى مسارات كود مختلفة.

- **فشل بدء CDP أو الجاهزية** يعني أن OpenClaw لا يمكنه التأكد من أن مستوى التحكم في المتصفح سليم.
- **حظر SSRF للتنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض وفق السياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية عبر loopback مهيأة من دون `attachOnly: true`
- حظر SSRF للتنقل:
  - تفشل مسارات `open` أو `navigate` أو اللقطة أو فتح التبويبات بخطأ في سياسة المتصفح/الشبكة بينما يظل `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا.
- إذا نجح `start` لكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. تعامل مع هذا كمشكلة وصول إلى CDP، وليس كمشكلة تنقل في الصفحة.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح يعمل والمشكلة في سياسة التنقل أو الصفحة الهدف.
- إذا نجح كل من `start` و`tabs` و`open`، فإن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل سلوك مهمة:

- يضبط تكوين المتصفح افتراضيًا كائن سياسة SSRF يعمل بأسلوب الإخفاق المغلق حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار `openclaw` عبر local loopback، تتخطى فحوصات صحة CDP عمدًا فرض قابلية وصول SSRF للمتصفح على مستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. لا تعني نتيجة `start` أو `tabs` الناجحة أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- لا تُخفف سياسة SSRF للمتصفح افتراضيًا.
- فضّل استثناءات مضيف ضيقة مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكات الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوقة عمدًا حيث يكون وصول المتصفح إلى الشبكات الخاصة مطلوبًا ومراجعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية المطابقة:

- يعيد `browser snapshot` شجرة واجهة مستخدم مستقرة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من اللقطة للنقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو مراجع موسومة).
- يتحقق `browser doctor` من جاهزية Gateway وPlugin وملف التعريف والمتصفح والتبويب.
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مُسمّى (openclaw أو chrome أو CDP بعيد).
  - `target` (`sandbox` | `host` | `node`) لتحديد مكان وجود المتصفح.
  - في الجلسات المعزولة، يتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا حُذف `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، وتستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت عقدة قادرة على تشغيل المتصفح متصلة، فقد توجّه الأداة إليها تلقائيًا ما لم تثبّت `target="host"` أو `target="node"`.

يبقي هذا الوكيل حتميًا ويتجنب المحددات الهشة.

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) - التحكم في المتصفح في البيئات المعزولة
- [الأمان](/ar/gateway/security) - مخاطر التحكم في المتصفح والتحصين

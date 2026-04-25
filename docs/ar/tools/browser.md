---
read_when:
    - إضافة أتمتة متصفح يتحكم بها الوكيل
    - تصحيح سبب تداخل openclaw مع Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة مدمجة للتحكم بالمتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
    generated_at: "2026-04-25T18:23:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6379873662b21972493f62951c0fb87c4a9ec6350cec750acaf6a50235bd69c3
    source_path: tools/browser.md
    workflow: 15
---

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي ويُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway (على loopback فقط).

منظور المبتدئين:

- فكّر فيه على أنه **متصفح منفصل مخصص للوكيل فقط**.
- لا يلمس ملف التعريف `openclaw` ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات تبويب، وقراءة الصفحات، والنقر، والكتابة** في مسار آمن.
- يرتبط ملف التعريف `user` المضمن بجلسة Chrome الحقيقية المسجّل الدخول إليها عبر Chrome MCP.

## ما الذي ستحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** (بتمييز برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (إدراج/فتح/تركيز/إغلاق).
- إجراءات الوكيل (نقر/كتابة/سحب/تحديد)، ولقطات، ولقطات شاشة، وملفات PDF.
- Skill مضمّن باسم `browser-automation` يعلّم الوكلاء دورة الاسترداد الخاصة بـ
  snapshot وstable-tab وstale-ref وmanual-blocker عندما يكون
  Plugin المتصفح مفعّلًا.
- دعم اختياري لملفات تعريف متعددة (`openclaw` و`work` و`remote` و...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول من أجل
أتمتة الوكيل والتحقق.

## البدء السريع

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

إذا ظهرت لك رسالة "Browser disabled"، ففعّل المتصفح في الإعدادات (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو إذا قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر المتصفح أو أداته مفقود](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

الأداة الافتراضية `browser` هي Plugin مضمّن. عطّله لاستبداله بـ Plugin آخر يسجّل اسم أداة `browser` نفسه:

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

تحتاج القيم الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. تعطيل Plugin فقط يزيل CLI ‏`openclaw browser`، والطريقة `browser.request` في gateway، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ بينما تبقى إعدادات `browser.*` لديك كما هي من أجل بديل.

تتطلب تغييرات إعدادات المتصفح إعادة تشغيل Gateway حتى يتمكن Plugin من إعادة تسجيل خدمته.

## إرشادات الوكيل

ملاحظة حول ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` أداتي `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. إذا كان يجب على الوكيل أو
الوكيل الفرعي المُنشأ استخدام أتمتة المتصفح، فأضف المتصفح في مرحلة
ملف التعريف:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

بالنسبة إلى وكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
ولا يكفي استخدام `tools.subagents.tools.allow: ["browser"]` وحده لأن سياسة الوكيل الفرعي
تُطبَّق بعد التصفية حسب ملف التعريف.

يشحن Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد الموجز الدائم التشغيل: اختر
  ملف التعريف المناسب، واحتفظ بالمراجع في علامة التبويب نفسها، واستخدم `tabId`/التسميات لاستهداف
  علامات التبويب، وحمّل Skill المتصفح للأعمال متعددة الخطوات.
- يحمل Skill المضمّن `browser-automation` دورة التشغيل الأطول:
  تحقّق من الحالة/علامات التبويب أولًا، وسمِّ علامات تبويب المهام، وخذ snapshot قبل التنفيذ،
  وأعد أخذ snapshot بعد تغييرات واجهة المستخدم، واستعد المراجع القديمة مرة واحدة،
  وأبلغ عن عوائق تسجيل الدخول/المصادقة الثنائية/الاختبارات أو
  عوائق الكاميرا/الميكروفون كإجراء يدوي بدلًا من التخمين.

تُدرَج Skills المضمنة في Plugin ضمن Skills المتاحة للوكيل عندما يكون
Plugin مفعّلًا. وتُحمَّل تعليمات Skill الكاملة عند الطلب، لذلك لا تتحمل
الدورات الروتينية كلفة الرموز الكاملة.

## أمر المتصفح أو أداته مفقود

إذا كان `openclaw browser` غير معروف بعد الترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل أن أداة المتصفح غير متاحة، فالسبب المعتاد هو وجود قائمة `plugins.allow` لا تتضمن `browser`. أضِفه:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تُعد `browser.enabled=true` و`plugins.entries.browser.enabled=true` و`tools.alsoAllow: ["browser"]` بدائل عن عضوية allowlist — إذ تتحكم allowlist في تحميل Plugin، ولا تُشغَّل سياسة الأداة إلا بعد التحميل. كما أن إزالة `plugins.allow` بالكامل تعيد أيضًا السلوك الافتراضي.

## ملفات التعريف: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (لا يتطلب Extension).
- `user`: ملف تعريف إرفاق Chrome MCP مضمّن لجلسة **Chrome الحقيقية المسجّل الدخول إليها**
  الخاصة بك.

بالنسبة إلى استدعاءات أداة المتصفح من الوكيل:

- افتراضيًا: استخدم المتصفح المعزول `openclaw`.
- افضّل `profile="user"` عندما تكون الجلسات الحالية المسجّل الدخول إليها مهمة ويكون المستخدم
  موجودًا على الجهاز للنقر/الموافقة على أي مطالبة إرفاق.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## الإعدادات

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشترك فقط عندما يكون الوصول إلى الشبكة الخاصة موثوقًا عن قصد
      // allowPrivateNetwork: true, // اسم مستعار قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم لملف تعريف واحد
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيد (مللي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيد (مللي ثانية)
    localLaunchTimeoutMs: 15000, // مهلة اكتشاف Chrome المحلي المُدار (مللي ثانية)
    localCdpReadyTimeoutMs: 8000, // مهلة الجاهزية المحلية لـ CDP بعد التشغيل (مللي ثانية)
    actionTimeoutMs: 60000, // مهلة إجراء المتصفح الافتراضية (مللي ثانية)
    tabCleanup: {
      enabled: true, // الافتراضي: true
      idleMinutes: 120, // اضبطها على 0 لتعطيل تنظيف الخمول
      maxTabsPerSession: 8, // اضبطها على 0 لتعطيل الحد الأقصى لكل جلسة
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

- ترتبط خدمة التحكم بعنوان loopback على منفذ مشتق من `gateway.port` (الافتراضي `18791` = ‏gateway + 2). ويؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى تحريك المنافذ المشتقة ضمن العائلة نفسها.
- تعيّن ملفات التعريف المحلية `openclaw` القيم `cdpPort`/`cdpUrl` تلقائيًا؛ اضبط هذه القيم فقط لـ CDP البعيد. وتكون `cdpUrl` افتراضيًا هي منفذ CDP المحلي المُدار عند عدم ضبطها.
- تنطبق `remoteCdpTimeoutMs` على فحوصات الوصول عبر HTTP الخاصة بـ CDP البعيد و`attachOnly`
  وطلبات HTTP الخاصة بفتح علامات التبويب؛ بينما تنطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات WebSocket الخاصة بـ CDP.
- تمثل `localLaunchTimeoutMs` الميزانية الزمنية لعملية Chrome مُدارة محليًا تم تشغيلها
  كي تكشف نقطة النهاية HTTP الخاصة بـ CDP. وتمثل `localCdpReadyTimeoutMs`
  الميزانية اللاحقة لجاهزية WebSocket الخاصة بـ CDP بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi أو VPS منخفض الإمكانات أو الأجهزة الأقدم حيث يبدأ Chromium
  ببطء. وتُحد القيم عند 120000 مللي ثانية.
- تمثل `actionTimeoutMs` الميزانية الافتراضية لطلبات `act` الخاصة بالمتصفح عندما لا يمرر المستدعي `timeoutMs`. ويضيف نقل العميل هامشًا زمنيًا صغيرًا حتى تتمكن الانتظارات الطويلة من الاكتمال بدلًا من انتهاء المهلة عند حد HTTP.
- يمثل `tabCleanup` تنظيفًا بأفضل جهد لعلامات التبويب التي تفتحها جلسات المتصفح الخاصة بالوكيل الأساسي. وما يزال تنظيف دورة الحياة الخاصة بالوكلاء الفرعيين وCron وACP يغلق علامات التبويب المتتبعة صراحةً عند نهاية الجلسة؛ بينما تبقي الجلسات الأساسية علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتتبعة الخاملة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تُحمى عمليات التنقل في المتصفح وفتح علامات التبويب من SSRF قبل التنقل، وتُعاد مراجعتها بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد ذلك.
- في وضع SSRF الصارم، تُفحَص أيضًا عملية اكتشاف نقطة نهاية CDP البعيدة وتحقيقات `/json/version` ‏(`cdpUrl`).
- لا تمرر متغيرات البيئة `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` الخاصة بـ Gateway/المزوّد الوكيل تلقائيًا إلى المتصفح الذي يديره OpenClaw. يبدأ Chrome المُدار باتصال مباشر افتراضيًا حتى لا تُضعف إعدادات وكيل المزوّد فحوصات SSRF الخاصة بالمتصفح.
- لتمرير المتصفح المُدار نفسه عبر وكيل، مرّر رايات وكيل Chrome صريحة عبر `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. ويمنع وضع SSRF الصارم توجيه وكيل المتصفح الصريح ما لم يتم تمكين الوصول إلى شبكة المتصفح الخاصة عن قصد.
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا؛ فعّلها فقط عندما يكون الوصول إلى الشبكة الخاصة من المتصفح موثوقًا عن قصد.
- ما تزال `browser.ssrfPolicy.allowPrivateNetwork` مدعومة كاسم مستعار قديم.

</Accordion>

<Accordion title="سلوك ملفات التعريف">

- تعني `attachOnly: true` عدم تشغيل متصفح محلي أبدًا؛ وإنما الإرفاق فقط إذا كان يعمل بالفعل.
- يمكن ضبط `headless` بشكل عام أو لكل ملف تعريف محلي مُدار. وتتجاوز القيم الخاصة بكل ملف تعريف القيمة `browser.headless`، بحيث يمكن أن يبقى أحد ملفات التعريف المحلية التي تم تشغيلها بلا واجهة بينما يبقى آخر مرئيًا.
- يطلب كل من `POST /start?headless=true` و`openclaw browser start --headless`
  تشغيلًا بلا واجهة لمرة واحدة لملفات التعريف المحلية المُدارة من دون إعادة كتابة
  `browser.headless` أو إعدادات ملف التعريف. وترفض ملفات التعريف existing-session
  وattach-only وCDP البعيدة هذا التجاوز لأن OpenClaw لا يشغّل
  عمليات المتصفح الخاصة بها.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تتحول ملفات التعريف المحلية المُدارة
  افتراضيًا إلى الوضع بلا واجهة تلقائيًا عندما لا تختار البيئة ولا
  إعدادات ملف التعريف/الإعدادات العامة صراحةً الوضع ذي الواجهة. ويعرض
  `openclaw browser status --json` القيمة `headlessSource` على أنها `env` أو `profile` أو `config` أو
  `request` أو `linux-display-fallback` أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` تشغيلات محلية مُدارة بلا واجهة ضمن
  العملية الحالية. بينما يفرض `OPENCLAW_BROWSER_HEADLESS=0` الوضع ذي الواجهة للتشغيلات
  العادية ويعيد خطأً عمليًا على مضيفات Linux التي لا تحتوي على خادم عرض؛
  ومع ذلك يفوز طلب `start --headless` الصريح لذلك التشغيل الواحد.
- يمكن ضبط `executablePath` بشكل عام أو لكل ملف تعريف محلي مُدار. وتتجاوز القيم الخاصة بكل ملف تعريف القيمة `browser.executablePath`، بحيث يمكن لملفات تعريف مُدارة مختلفة تشغيل متصفحات مختلفة مبنية على Chromium.
- يلوّن `color` (على المستوى الأعلى ولكل ملف تعريف) واجهة المتصفح حتى تتمكن من معرفة أي ملف تعريف نشط.
- ملف التعريف الافتراضي هو `openclaw` (مُدار مستقل). استخدم `defaultProfile: "user"` لاختيار متصفح المستخدم المسجّل الدخول إليه.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا Chrome ← Brave ← Edge ← Chromium ← Chrome Canary.
- يستخدم `driver: "existing-session"` القيمة Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` لهذا driver.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب على ملف تعريف existing-session الإرفاق بملف تعريف مستخدم Chromium غير افتراضي (Brave أو Edge أو غيرهما).

</Accordion>

</AccordionGroup>

## استخدام Brave (أو متصفح آخر مبني على Chromium)

إذا كان متصفحك **الافتراضي في النظام** مبنيًا على Chromium ‏(Chrome/Brave/Edge/...),
فإن OpenClaw يستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. وتتوسع `~` إلى مجلد المنزل في نظام التشغيل لديك:

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

لا تؤثر القيمة `executablePath` لكل ملف تعريف إلا في ملفات التعريف المحلية المُدارة التي
يشغّلها OpenClaw. أما ملفات التعريف `existing-session` فترتبط بمتصفح
قيد التشغيل بالفعل بدلًا من ذلك، بينما تستخدم ملفات تعريف CDP البعيدة المتصفح الموجود خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم على loopback ويمكنه تشغيل متصفح محلي.
- **التحكم البعيد (مضيف Node):** شغّل مضيف Node على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه عبر وكيل.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` (أو `browser.cdpUrl`) من أجل
  الارتباط بمتصفح بعيد مبني على Chromium. في هذه الحالة، لن يشغّل OpenClaw متصفحًا محليًا.
- بالنسبة إلى خدمات CDP المُدارة خارجيًا على loopback (مثل Browserless داخل
  Docker والمنشور على `127.0.0.1`)، اضبط أيضًا `attachOnly: true`. إذ يُعامَل
  CDP على loopback من دون `attachOnly` على أنه ملف تعريف متصفح محلي مُدار من OpenClaw.
- تؤثر `headless` فقط في ملفات التعريف المحلية المُدارة التي يشغّلها OpenClaw. ولا تعيد تشغيل متصفحات existing-session أو CDP البعيدة ولا تغيّرها.
- يتبع `executablePath` قاعدة ملف التعريف المحلي المُدار نفسها. ويؤدي تغييره في
  ملف تعريف محلي مُدار قيد التشغيل إلى وسم ذلك الملف لإعادة التشغيل/التسوية حتى
  يستخدم التشغيل التالي الملف التنفيذي الجديد.

يختلف سلوك الإيقاف حسب وضع ملف التعريف:

- ملفات التعريف المحلية المُدارة: يؤدي `openclaw browser stop` إلى إيقاف عملية المتصفح التي
  شغّلها OpenClaw
- ملفات التعريف attach-only وCDP البعيدة: يؤدي `openclaw browser stop` إلى إغلاق جلسة
  التحكم النشطة وتحرير تجاوزات المحاكاة الخاصة بـ Playwright/CDP (منفذ العرض،
  ونظام الألوان، والإعدادات المحلية، والمنطقة الزمنية، ووضع عدم الاتصال، وحالات مشابهة)، حتى
  وإن لم يكن OpenClaw قد شغّل أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد المصادقة:

- رموز الاستعلام (مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic ‏(مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. ويفضَّل استخدام متغيرات البيئة أو مديري الأسرار لحفظ
الرموز بدلًا من تسجيلها في ملفات الإعدادات.

## وكيل متصفح Node ‏(افتراضي من دون إعدادات)

إذا شغّلت **مضيف Node** على الجهاز الذي يحتوي على متصفحك، يمكن لـ OpenClaw
توجيه استدعاءات أداة المتصفح تلقائيًا إلى ذلك المضيف من دون أي إعدادات متصفح إضافية.
وهذا هو المسار الافتراضي لـ Gatewayات البعيدة.

ملاحظات:

- يكشف مضيف Node خادم التحكم المحلي في المتصفح الخاص به عبر **أمر وكيل**.
- تأتي ملفات التعريف من إعدادات `browser.profiles` الخاصة بالعقدة نفسها (كما هو الحال محليًا).
- تكون `nodeHost.browserProxy.allowProfiles` اختيارية. اتركها فارغة للحصول على السلوك القديم/الافتراضي: تظل جميع ملفات التعريف المُعدّة قابلة للوصول عبر الوكيل، بما في ذلك مسارات إنشاء ملفات التعريف وحذفها.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، فإن OpenClaw يعاملها كحد ذي أقل امتياز: لا يمكن استهداف إلا ملفات التعريف المدرجة في allowlist، وتُحظر مسارات إنشاء/حذف ملفات التعريف الدائمة على سطح الوكيل.
- عطّلها إذا كنت لا تريدها:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على gateway: ‏`gateway.nodes.browser.mode="off"`

## Browserless ‏(CDP بعيد مستضاف)

تُعد [Browserless](https://browserless.io) خدمة Chromium مستضافة تكشف
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
- اختر نقطة نهاية المنطقة التي تطابق حساب Browserless لديك (راجع وثائقهم).
- إذا منحك Browserless عنوان HTTPS أساسيًا، فيمكنك إما تحويله إلى
  `wss://` لاتصال CDP مباشر أو الاحتفاظ بعنوان HTTPS وترك OpenClaw
  يكتشف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما تكون Browserless مستضافة ذاتيًا داخل Docker ويعمل OpenClaw على المضيف، فتعامل مع
Browserless على أنها خدمة CDP مُدارة خارجيًا:

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

يجب أن يكون العنوان الموجود في `browser.profiles.browserless.cdpUrl` قابلاً للوصول من
عملية OpenClaw. كما يجب أن تعلن Browserless عن نقطة نهاية مطابقة يمكن الوصول إليها؛
اضبط القيمة `EXTERNAL` في Browserless على قاعدة WebSocket العامة نفسها
القابلة للوصول من OpenClaw، مثل
`ws://127.0.0.1:3000` أو `ws://browserless:3000` أو عنوان Docker خاص
مستقر. وإذا أعاد `/json/version` القيمة `webSocketDebuggerUrl` مشيرةً إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو CDP HTTP سليمًا بينما يفشل
الارتباط بـ WebSocket مع ذلك.

لا تترك `attachOnly` غير مضبوطة لملف تعريف Browserless على loopback. فمن دون
`attachOnly`، يعامل OpenClaw منفذ loopback على أنه ملف تعريف متصفح محلي مُدار
وقد يبلغ أن المنفذ مستخدم لكنه ليس مملوكًا لـ OpenClaw.

## مزوّدو CDP المباشر عبر WebSocket

تكشف بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
الاكتشاف القياسي المستند إلى HTTP لـ CDP ‏(`/json/version`). يقبل OpenClaw ثلاثة
أشكال لعناوين URL الخاصة بـ CDP ويختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger، ثم
  يتصل. ولا يوجد رجوع إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتجاوز
  `/json/version` بالكامل.
- **جذور WebSocket العارية** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` ‏(مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw
  أولًا اكتشاف `/json/version` عبر HTTP
  (مع تطبيع البروتوكول إلى `http`/`https`)؛
  وإذا أعاد الاكتشاف `webSocketDebuggerUrl` فسيتم استخدامه، وإلا يعود OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر العاري. وإذا رفضت نقطة نهاية
  WebSocket المُعلن عنها مصافحة CDP لكن الجذر العاري المُعد يقبلها،
  فسيعود OpenClaw إلى ذلك الجذر أيضًا. ويتيح هذا لجذر عارٍ من نوع `ws://`
  موجّه إلى Chrome محلي أن يظل قادرًا على الاتصال، لأن Chrome لا يقبل
  ترقيات WebSocket إلا على المسار المحدد لكل هدف من `/json/version`، بينما
  يمكن للمزوّدات المستضافة أن تستخدم نقطة نهاية WebSocket الجذرية الخاصة بها عندما
  تعلن نقطة الاكتشاف لديها عن عنوان قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

تُعد [Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات بلا واجهة مع حل CAPTCHA مدمج، ووضع التخفي، ووكلاء سكنية.

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
- تنشئ Browserbase جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذلك لا
  حاجة إلى خطوة إنشاء جلسة يدويًا.
- تسمح الخطة المجانية بجلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [الأسعار](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للحصول على المرجع الكامل لـ API،
  وأدلة SDK، وأمثلة التكامل.

## الأمان

الأفكار الأساسية:

- التحكم في المتصفح يقتصر على loopback؛ ويمر الوصول عبر مصادقة Gateway أو اقتران العقدة.
- يستخدم HTTP API المستقل للمتصفح على loopback **مصادقة السر المشترك فقط**:
  مصادقة bearer عبر رمز gateway، أو `x-openclaw-password`، أو HTTP Basic auth مع
  كلمة مرور gateway المُعدّة.
- لا توثّق رؤوس هوية Tailscale Serve ولا `gateway.auth.mode: "trusted-proxy"`
  واجهة برمجة التطبيقات المستقلة هذه للمتصفح على loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم تُضبط أي مصادقة سر مشترك، فإن OpenClaw
  ينشئ `gateway.auth.token` تلقائيًا عند بدء التشغيل ويثبته في الإعدادات.
- لا ينشئ OpenClaw ذلك الرمز تلقائيًا عندما تكون القيمة `gateway.auth.mode`
  هي أصلًا `password` أو `none` أو `trusted-proxy`.
- احتفظ بـ Gateway وأي مضيفات عقدة على شبكة خاصة (Tailscale)؛ وتجنب التعرض العام.
- تعامل مع عناوين URL/الرموز الخاصة بـ CDP البعيد على أنها أسرار؛ ويفضَّل استخدام متغيرات البيئة أو مدير أسرار.

نصائح CDP البعيد:

- افضّل نقاط النهاية المشفّرة (HTTPS أو WSS) والرموز قصيرة العمر متى أمكن.
- تجنب تضمين رموز طويلة العمر مباشرة في ملفات الإعدادات.

## ملفات التعريف (متعدد المتصفحات)

يدعم OpenClaw ملفات تعريف متعددة مسماة (إعدادات توجيه). ويمكن أن تكون ملفات التعريف:

- **مدارة من OpenClaw**: نسخة مخصصة من متصفح مبني على Chromium مع دليل بيانات مستخدم ومنفذ CDP خاصين بها
- **بعيدة**: عنوان CDP URL صريح (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

القيم الافتراضية:

- يُنشأ ملف التعريف `openclaw` تلقائيًا إذا كان مفقودًا.
- يُعد ملف التعريف `user` مضمّنًا للإرفاق بجلسة موجودة عبر Chrome MCP.
- ملفات التعريف existing-session اختيارية فيما عدا `user`؛ أنشئها باستخدام `--driver existing-session`.
- تُخصّص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى سلة المهملات.

تقبل جميع نقاط نهاية التحكم القيمة `?profile=<name>`؛ ويستخدم CLI الخيار `--browser-profile`.

## جلسة موجودة عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الارتباط بملف تعريف متصفح مبني على Chromium قيد التشغيل عبر
خادم Chrome DevTools MCP الرسمي. ويؤدي هذا إلى إعادة استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة أصلًا في ملف تعريف المتصفح ذاك.

مراجع خلفية وإعداد رسمية:

- [Chrome for Developers: استخدام Chrome DevTools MCP مع جلسة متصفحك](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

ملف التعريف المضمن:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا إذا كنت تريد
اسمًا أو لونًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم ملف التعريف المضمن `user` الاتصال التلقائي عبر Chrome MCP، والذي يستهدف
  ملف تعريف Google Chrome المحلي الافتراضي.

استخدم `userDataDir` من أجل Brave أو Edge أو Chromium أو ملف تعريف Chrome غير افتراضي:

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

1. افتح صفحة الفحص الخاصة بذلك المتصفح من أجل التصحيح عن بُعد.
2. فعّل التصحيح عن بُعد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يرتبط OpenClaw.

صفحات الفحص الشائعة:

- Chrome: ‏`chrome://inspect/#remote-debugging`
- Brave: ‏`brave://inspect/#remote-debugging`
- Edge: ‏`edge://inspect/#remote-debugging`

اختبار الدخان للإرفاق الحي:

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
- تعرض `tabs` علامات التبويب المفتوحة بالفعل في متصفحك
- تعيد `snapshot` مراجع من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم يعمل الارتباط:

- أن يكون إصدار المتصفح المستهدف المبني على Chromium هو `144+`
- أن يكون التصحيح عن بُعد مفعّلًا في صفحة الفحص الخاصة بذلك المتصفح
- أن المتصفح عرض مطالبة الموافقة على الارتباط وأنك وافقت عليها
- يقوم `openclaw doctor` بترحيل إعدادات المتصفح القديمة المعتمدة على Extension ويتحقق من
  أن Chrome مثبت محليًا لملفات تعريف الاتصال التلقائي الافتراضية، لكنه لا يستطيع
  تفعيل التصحيح عن بُعد من جهة المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة متصفح المستخدم المسجّل الدخول إليه.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرّر اسم ملف التعريف الصريح هذا.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الجهاز للموافقة على مطالبة
  الارتباط.
- يمكن لـ Gateway أو مضيف العقدة إنشاء
  `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- هذا المسار أعلى خطورة من ملف التعريف المعزول `openclaw` لأنه يمكنه
  العمل داخل جلسة المتصفح المسجّل الدخول إليها.
- لا يشغّل OpenClaw المتصفح لهذا driver؛ بل يقتصر دوره على الارتباط.
- يستخدم OpenClaw هنا التدفق الرسمي `--autoConnect` الخاص بـ Chrome DevTools MCP. وإذا
  تم ضبط `userDataDir`، فسيتم تمريره لاستهداف دليل بيانات المستخدم ذاك.
- يمكن لـ existing-session الارتباط على المضيف المحدد أو عبر
  عقدة متصفح متصلة. وإذا كان Chrome موجودًا في مكان آخر ولم تكن هناك عقدة متصفح متصلة، فاستخدم
  CDP البعيد أو مضيف عقدة بدلًا من ذلك.

### تشغيل Chrome MCP مخصص

يمكنك تجاوز خادم Chrome DevTools MCP الذي يتم إنشاؤه لكل ملف تعريف عندما لا يكون تدفق
`npx chrome-devtools-mcp@latest` الافتراضي هو ما تريده (مضيفات غير متصلة،
إصدارات مثبتة، ملفات تنفيذية موردة):

| الحقل        | ما الذي يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي الذي سيتم تشغيله بدلًا من `npx`. يتم حلّه كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط الممررة حرفيًا إلى `mcpCommand`. تستبدل الوسائط الافتراضية `chrome-devtools-mcp@latest --autoConnect`. |

عند ضبط `cdpUrl` على ملف تعريف existing-session، يتجاوز OpenClaw
القيمة `--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → `--browserUrl <url>` ‏(نقطة نهاية اكتشاف DevTools HTTP).
- `ws(s)://...` → `--wsEndpoint <url>` ‏(CDP WebSocket مباشر).

لا يمكن الجمع بين رايات نقطة النهاية و`userDataDir`: فعند ضبط `cdpUrl`،
يُتجاهل `userDataDir` عند تشغيل Chrome MCP، لأن Chrome MCP يرتبط
بالمتصفح الجاري خلف نقطة النهاية بدلًا من فتح دليل ملف تعريف.

<Accordion title="قيود ميزات existing-session">

مقارنةً بملف التعريف المُدار `openclaw`، تكون برامج تشغيل existing-session أكثر تقييدًا:

- **لقطات الشاشة** — تعمل لقطات الصفحة ولقطات العناصر عبر `--ref`؛ أما محددات CSS الخاصة بـ `--element` فلا تعمل. ولا يمكن الجمع بين `--full-page` و`--ref` أو `--element`. ولا تكون Playwright مطلوبة لالتقاط الصفحة أو العناصر المعتمدة على المرجع.
- **الإجراءات** — تتطلب `click` و`type` و`hover` و`scrollIntoView` و`drag` و`select` مراجع snapshot (ولا تدعم محددات CSS). تنقر `click-coords` على إحداثيات منفذ العرض المرئية ولا تتطلب مرجع snapshot. وتدعم `click` الزر الأيسر فقط. ولا تدعم `type` القيمة `slowly=true`؛ استخدم `fill` أو `press`. ولا تدعم `press` القيمة `delayMs`. كما أن `type` و`hover` و`scrollIntoView` و`drag` و`select` و`fill` و`evaluate` لا تدعم مهلات لكل استدعاء. ويقبل `select` قيمة واحدة فقط.
- **الانتظار / الرفع / مربعات الحوار** — يدعم `wait --url` الأنماط المطابقة الدقيقة، والاحتواء، وglob؛ أما `wait --load networkidle` فغير مدعوم. وتتطلب خطافات الرفع `ref` أو `inputRef`، وملفًا واحدًا في كل مرة، ولا تدعم CSS `element`. كما لا تدعم خطافات مربعات الحوار تجاوزات المهلات.
- **ميزات مخصصة للوضع المُدار فقط** — ما تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيلات، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس أبدًا ملف تعريف متصفحك الشخصي.
- **منافذ مخصصة**: يتجنب `9222` لمنع التصادمات مع مهام التطوير.
- **تحكم حتمي في علامات التبويب**: تعيد `tabs` أولًا `suggestedTargetId`، ثم
  مقابض `tabId` الثابتة مثل `t1`، ثم التسميات الاختيارية، ثم `targetId` الخام.
  يجب على الوكلاء إعادة استخدام `suggestedTargetId`؛ وتبقى المعرّفات الخام متاحة من أجل
  التصحيح والتوافق.

## اختيار المتصفح

عند التشغيل محليًا، يختار OpenClaw أول متصفح متاح من التالي:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

يمكنك التجاوز عبر `browser.executablePath`.

المنصات:

- macOS: يفحص `/Applications` و`~/Applications`.
- Linux: يفحص مواقع Chrome/Brave/Edge/Chromium الشائعة ضمن `/usr/bin`،
  و`/snap/bin`، و`/opt/google`، و`/opt/brave.com`، و`/usr/lib/chromium`، و
  `/usr/lib/chromium-browser`.
- Windows: يفحص مواقع التثبيت الشائعة.

## Control API ‏(اختياري)

لأغراض البرمجة النصية والتصحيح، يكشف Gateway واجهة **HTTP API للتحكم
على loopback فقط** إضافة إلى CLI مطابق باسم `openclaw browser` ‏(لقطات، ومراجع، وتعزيزات
الانتظار، ومخرجات JSON، وتدفقات التصحيح). راجع
[Browser control API](/ar/tools/browser-control) للاطلاع على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

بالنسبة إلى المشكلات الخاصة بـ Linux (خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

وبالنسبة إلى إعدادات المضيف المنفصل WSL2 Gateway + Windows Chrome، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء CDP مقابل حظر SSRF أثناء التنقل

هذان نوعان مختلفان من حالات الفشل ويشيران إلى مسارات كود مختلفة.

- **فشل بدء CDP أو جاهزيته** يعني أن OpenClaw لا يستطيع تأكيد سلامة مستوى التحكم في المتصفح.
- **حظر SSRF أثناء التنقل** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف التنقل إلى الصفحة مرفوض بسبب السياسة.

أمثلة شائعة:

- فشل بدء CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية على loopback مُعدّة من دون `attachOnly: true`
- حظر SSRF أثناء التنقل:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب بخطأ متعلق بسياسة المتصفح/الشبكة بينما يظل كل من `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للتمييز بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فابدأ أولًا باستكشاف جاهزية CDP وإصلاحها.
- إذا نجح `start` لكن فشل `tabs`، فإن مستوى التحكم ما يزال غير سليم. تعامل مع هذا بوصفه مشكلة في الوصول إلى CDP، وليس مشكلة في التنقل إلى الصفحة.
- إذا نجح كل من `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح قائم بالفعل، ويكمن الفشل في سياسة التنقل أو في الصفحة المستهدفة.
- إذا نجحت `start` و`tabs` و`open` جميعًا، فإن مسار التحكم الأساسي في المتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- تضبط إعدادات المتصفح افتراضيًا كائن سياسة SSRF مغلقًا افتراضيًا حتى عندما لا تضبط `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المُدار المحلي `openclaw` على loopback، تتجاوز فحوصات صحة CDP عمدًا فرض إمكانية الوصول وفق SSRF الخاصة بمستوى التحكم المحلي الذي يملكه OpenClaw نفسه.
- تكون حماية التنقل منفصلة. فنجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تخفف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- افضّل استثناءات مضيقة للمضيفين مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكات الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في البيئات الموثوق بها عمدًا والتي يكون فيها الوصول إلى الشبكة الخاصة عبر المتصفح مطلوبًا ومراجَعًا.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — ‏doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- يعيد `browser snapshot` شجرة واجهة مستخدم ثابتة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من snapshot من أجل النقر/الكتابة/السحب/التحديد.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو مراجع معنونة).
- يفحص `browser doctor` جاهزية Gateway وPlugin وملف التعريف والمتصفح وعلامة التبويب.
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمى (openclaw أو chrome أو CDP بعيد).
  - `target` ‏(`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات المعزولة sandbox، تتطلب `target: "host"` ضبط `agents.defaults.sandbox.browser.allowHostControl=true`.
  - إذا لم يتم تمرير `target`: تستخدم الجلسات المعزولة `sandbox` افتراضيًا، بينما تستخدم الجلسات غير المعزولة `host` افتراضيًا.
  - إذا كانت هناك عقدة قادرة على تشغيل المتصفح ومتصلة، فقد توجه الأداة تلقائيًا إليها ما لم تثبّت `target="host"` أو `target="node"`.

يحافظ هذا على حتمية الوكيل ويتجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [العزل](/ar/gateway/sandboxing) — التحكم في المتصفح ضمن البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وتقويته

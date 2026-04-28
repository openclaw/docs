---
read_when:
    - إضافة أتمتة متصفح يتحكم فيها الوكيل
    - تصحيح سبب تداخل openclaw مع متصفح Chrome الخاص بك
    - تنفيذ إعدادات المتصفح + دورة الحياة في تطبيق macOS
summary: خدمة التحكم المتكاملة بالمتصفح + أوامر الإجراءات
title: المتصفح (بإدارة OpenClaw)
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:41:12Z"
  model: gpt-5.4
  provider: openai
  source_hash: aba4c06f351296145b7a282bb692c2d10dba0668f90aabf1d981fb18199c3d74
  source_path: tools/browser.md
  workflow: 15
---

يمكن لـ OpenClaw تشغيل **ملف تعريف مخصص لـ Chrome/Brave/Edge/Chromium** يتحكم فيه الوكيل.
وهو معزول عن متصفحك الشخصي ويُدار عبر خدمة تحكم محلية صغيرة
داخل Gateway ‏(على local loopback فقط).

الرؤية المبسطة للمبتدئين:

- فكّر فيه على أنه **متصفح منفصل مخصص للوكيل فقط**.
- لا يلمس الملف الشخصي `openclaw` ملف تعريف متصفحك الشخصي.
- يمكن للوكيل **فتح علامات التبويب وقراءة الصفحات والنقر والكتابة** في مسار آمن.
- يتصل الملف الشخصي المضمن `user` بجلسة Chrome الحقيقية المسجل دخولها لديك عبر Chrome MCP.

## ما الذي تحصل عليه

- ملف تعريف متصفح منفصل باسم **openclaw** ‏(بلون برتقالي افتراضيًا).
- تحكم حتمي في علامات التبويب (list/open/focus/close).
- إجراءات الوكيل (click/type/drag/select)، وsnapshot، ولقطات الشاشة، وPDFs.
- Skill مضمّنة باسم `browser-automation` تعلّم الوكلاء
  حلقة التعافي الخاصة بـ snapshot، وstable-tab، وstale-ref، وmanual-blocker عند تمكين
  Plugin المتصفح.
- دعم اختياري لعدة ملفات تعريف (`openclaw`، و`work`، و`remote`، ...).

هذا المتصفح **ليس** متصفحك اليومي. بل هو سطح آمن ومعزول من أجل
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

إذا ظهرت لك رسالة “Browser disabled”، فقم بتمكينه في التكوين (انظر أدناه) ثم أعد تشغيل
Gateway.

إذا كان `openclaw browser` مفقودًا بالكامل، أو قال الوكيل إن أداة المتصفح
غير متاحة، فانتقل إلى [أمر أو أداة المتصفح المفقودة](/ar/tools/browser#missing-browser-command-or-tool).

## التحكم في Plugin

أداة `browser` الافتراضية هي Plugin مضمّنة. عطّلها لاستبدالها بـ Plugin أخرى تسجل اسم الأداة `browser` نفسه:

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

تحتاج القيم الافتراضية إلى كل من `plugins.entries.browser.enabled` **و** `browser.enabled=true`. إن تعطيل Plugin فقط يزيل CLI الخاص بـ `openclaw browser`، والأسلوب `browser.request` في gateway، وأداة الوكيل، وخدمة التحكم كوحدة واحدة؛ بينما يبقى تكوين `browser.*` كما هو من أجل بديل.

تتطلب تغييرات تكوين المتصفح إعادة تشغيل Gateway حتى تتمكن Plugin من إعادة تسجيل خدمتها.

## إرشادات الوكيل

ملاحظة حول ملف تعريف الأدوات: يتضمن `tools.profile: "coding"` كلًا من `web_search` و
`web_fetch`، لكنه لا يتضمن أداة `browser` الكاملة. وإذا كان ينبغي للوكيل أو
لوكيل فرعي تم إنشاؤه أن يستخدم أتمتة المتصفح، فأضف browser في مرحلة
ملف التعريف:

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

لوكيل واحد، استخدم `agents.list[].tools.alsoAllow: ["browser"]`.
ولا يكفي `tools.subagents.tools.allow: ["browser"]` وحده لأن سياسة الوكيل الفرعي
تُطبق بعد التصفية بحسب ملف التعريف.

توفّر Plugin المتصفح مستويين من إرشادات الوكيل:

- يحمل وصف أداة `browser` العقد المضغوط الدائم: اختر
  ملف التعريف الصحيح، وأبقِ المراجع على علامة التبويب نفسها، واستخدم `tabId`/labels لاستهداف علامات التبويب، وحمّل Skill المتصفح للأعمال متعددة الخطوات.
- تحمل Skill المضمنة `browser-automation` حلقة التشغيل الأطول:
  تحقق من status/tabs أولًا، وسمِّ علامات تبويب المهام، وخذ snapshot قبل التنفيذ، وأعد أخذ snapshot
  بعد تغييرات UI، واستعد stale refs مرة واحدة، وأبلغ عن عوائق تسجيل الدخول/2FA/captcha أو
  عوائق الكاميرا/الميكروفون باعتبارها إجراءً يدويًا بدلًا من التخمين.

تُدرج Skills المضمنة في Plugin ضمن Skills المتاحة للوكيل عندما تكون
Plugin مفعّلة. ويتم تحميل تعليمات Skill الكاملة عند الطلب، لذا لا تتحمل
الأدوار الروتينية كامل تكلفة الرموز.

## أمر أو أداة المتصفح المفقودة

إذا كان `openclaw browser` غير معروف بعد الترقية، أو كانت `browser.request` مفقودة، أو أبلغ الوكيل عن عدم توفر أداة المتصفح، فغالبًا يكون السبب هو قائمة `plugins.allow` التي تحذف `browser`. أضفها:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تُعد `browser.enabled=true`، و`plugins.entries.browser.enabled=true`، و`tools.alsoAllow: ["browser"]` بديلًا عن العضوية في قائمة السماح — إذ تتحكم قائمة السماح في تحميل Plugin، ولا تبدأ سياسة الأدوات إلا بعد التحميل. كما أن إزالة `plugins.allow` بالكامل تعيد الوضع الافتراضي أيضًا.

## الملفات الشخصية: `openclaw` مقابل `user`

- `openclaw`: متصفح مُدار ومعزول (ولا يتطلب extension).
- `user`: ملف تعريف اتصال مضمّن عبر Chrome MCP إلى جلسة Chrome **الحقيقية والمسجل دخولها**
  لديك.

بالنسبة إلى استدعاءات أداة المتصفح من الوكيل:

- الافتراضي: استخدم المتصفح المعزول `openclaw`.
- فضّل `profile="user"` عندما تكون الجلسات المسجل دخولها بالفعل مهمة ويكون المستخدم
  أمام الكمبيوتر للنقر/الموافقة على أي مطالبة attach.
- `profile` هو التجاوز الصريح عندما تريد وضع متصفح محددًا.

اضبط `browser.defaultProfile: "openclaw"` إذا كنت تريد الوضع المُدار افتراضيًا.

## التكوين

توجد إعدادات المتصفح في `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // الافتراضي: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // اشترك اختياريًا فقط للوصول الموثوق إلى الشبكات الخاصة
      // allowPrivateNetwork: true, // اسم بديل قديم
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // تجاوز قديم لملف تعريف واحد
    remoteCdpTimeoutMs: 1500, // مهلة HTTP لـ CDP البعيد (بالمللي ثانية)
    remoteCdpHandshakeTimeoutMs: 3000, // مهلة مصافحة WebSocket لـ CDP البعيد (بالمللي ثانية)
    localLaunchTimeoutMs: 15000, // مهلة اكتشاف Chrome المُدار محليًا بعد الإطلاق (بالمللي ثانية)
    localCdpReadyTimeoutMs: 8000, // مهلة جاهزية CDP المحلي المُدار بعد الإطلاق (بالمللي ثانية)
    actionTimeoutMs: 60000, // مهلة act الافتراضية في المتصفح (بالمللي ثانية)
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

- ترتبط خدمة التحكم بـ loopback على منفذ مشتق من `gateway.port` ‏(الافتراضي `18791` = gateway + 2). ويؤدي تجاوز `gateway.port` أو `OPENCLAW_GATEWAY_PORT` إلى تغيير المنافذ المشتقة ضمن العائلة نفسها.
- تقوم ملفات تعريف `openclaw` المحلية بتعيين `cdpPort`/`cdpUrl` تلقائيًا؛ لا تضبطهما إلا لـ CDP البعيد. ويكون `cdpUrl` افتراضيًا هو منفذ CDP المحلي المُدار عند حذفه.
- ينطبق `remoteCdpTimeoutMs` على فحوصات إمكانية الوصول عبر HTTP الخاصة بـ CDP البعيد وملفات التعريف `attachOnly`
  وكذلك على طلبات HTTP الخاصة بفتح علامات التبويب؛ بينما ينطبق `remoteCdpHandshakeTimeoutMs` على
  مصافحات WebSocket الخاصة بـ CDP.
- تمثل `localLaunchTimeoutMs` الميزانية الزمنية لعملية Chrome المُدارة محليًا
  كي تعرض نقطة نهاية CDP HTTP الخاصة بها. وتمثل `localCdpReadyTimeoutMs`
  الميزانية اللاحقة لجاهزية websocket الخاصة بـ CDP بعد اكتشاف العملية.
  ارفع هذه القيم على Raspberry Pi، أو VPS منخفض الإمكانات، أو العتاد الأقدم الذي يبدأ فيه Chromium ببطء. ويجب أن تكون القيم أعدادًا صحيحة موجبة حتى `120000` ms؛ وتُرفض قيم التكوين غير الصالحة.
- تمثل `actionTimeoutMs` الميزانية الافتراضية لطلبات `act` في المتصفح عندما لا يمرر المستدعي قيمة `timeoutMs`. ويضيف نقل العميل نافذة سماح صغيرة حتى تتمكن الانتظارات الطويلة من الاكتمال بدلًا من انتهاء المهلة عند حد HTTP.
- تمثل `tabCleanup` تنظيفًا بأفضل جهد لعلامات التبويب التي تفتحها جلسات المتصفح الخاصة بالوكيل الأساسي. بينما لا يزال تنظيف دورة الحياة الخاص بالـ Subagent وCron وACP يغلق علامات التبويب التي يتتبعها صراحةً عند نهاية الجلسة؛ أما الجلسات الأساسية فتُبقي علامات التبويب النشطة قابلة لإعادة الاستخدام، ثم تغلق علامات التبويب المتعطلة أو الزائدة في الخلفية.

</Accordion>

<Accordion title="سياسة SSRF">

- تكون عمليات التنقل في المتصفح وفتح علامات التبويب محمية ضد SSRF قبل التنقل، ويُعاد التحقق منها بأفضل جهد على عنوان URL النهائي من نوع `http(s)` بعد ذلك.
- في وضع SSRF الصارم، يتم أيضًا التحقق من اكتشاف نقاط نهاية CDP البعيدة واستقصاءات `/json/version` ‏(`cdpUrl`).
- لا تقوم متغيرات البيئة `HTTP_PROXY` و`HTTPS_PROXY` و`ALL_PROXY` و`NO_PROXY` الخاصة بـ Gateway/المزوّدين تلقائيًا بتمرير حركة المتصفح المُدار من OpenClaw عبر proxy. إذ يتم إطلاق Chrome المُدار مباشرةً افتراضيًا حتى لا تؤدي إعدادات proxy الخاصة بالمزوّد إلى إضعاف فحوصات SSRF الخاصة بالمتصفح.
- لتمرير المتصفح المُدار نفسه عبر proxy، مرّر أعلام proxy الصريحة لـ Chrome من خلال `browser.extraArgs`، مثل `--proxy-server=...` أو `--proxy-pac-url=...`. ويمنع وضع SSRF الصارم توجيه proxy الصريح للمتصفح ما لم يتم تفعيل الوصول إلى الشبكة الخاصة للمتصفح عمدًا.
- تكون `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` معطلة افتراضيًا؛ فعّلها فقط عندما يكون الوصول إلى الشبكات الخاصة عبر المتصفح موثوقًا عمدًا.
- تظل `browser.ssrfPolicy.allowPrivateNetwork` مدعومة كاسم بديل قديم.

</Accordion>

<Accordion title="سلوك الملف الشخصي">

- تعني `attachOnly: true` عدم إطلاق متصفح محلي مطلقًا؛ بل الاتصال فقط إذا كان أحدها يعمل بالفعل.
- يمكن ضبط `headless` عالميًا أو لكل ملف تعريف مُدار محليًا. وتتجاوز القيم الخاصة بكل ملف تعريف قيمة `browser.headless`، بحيث يمكن لملف تعريف محلي مُطلق أن يبقى في وضع headless بينما يظل آخر مرئيًا.
- يطلب كل من `POST /start?headless=true` و`openclaw browser start --headless`
  إطلاقًا لمرة واحدة في وضع headless لملفات التعريف المُدارة محليًا من دون إعادة كتابة
  `browser.headless` أو تكوين الملف الشخصي. وترفض ملفات تعريف existing-session وattach-only وCDP البعيد هذا التجاوز لأن OpenClaw لا يطلق
  عمليات هذه المتصفحات.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تفترض ملفات التعريف المُدارة محليًا
  وضع headless تلقائيًا عندما لا تختار البيئة ولا
  التكوين العام/الخاص بالملف الشخصي وضع headed صراحةً. ويبلغ `openclaw browser status --json`
  عن `headlessSource` بقيم مثل `env`، أو `profile`، أو `config`،
  أو `request`، أو `linux-display-fallback`، أو `default`.
- يفرض `OPENCLAW_BROWSER_HEADLESS=1` عمليات الإطلاق المُدارة محليًا في وضع headless
  للعملية الحالية. ويفرض `OPENCLAW_BROWSER_HEADLESS=0` وضع headed لعمليات
  البدء العادية ويعيد خطأً قابلاً للتنفيذ على مضيفات Linux التي لا تحتوي على خادم عرض؛
  ومع ذلك يظل الطلب الصريح `start --headless` هو الفائز لتلك العملية الواحدة.
- يمكن ضبط `executablePath` عالميًا أو لكل ملف تعريف مُدار محليًا. وتتجاوز القيم الخاصة بكل ملف تعريف قيمة `browser.executablePath`، بحيث يمكن لملفات تعريف مُدارة مختلفة إطلاق متصفحات مختلفة مبنية على Chromium. ويقبل كلا الشكلين الرمز `~` ليشير إلى الدليل الرئيسي في نظام التشغيل لديك.
- يلوّن `color` ‏(في المستوى الأعلى ولكل ملف تعريف) واجهة المتصفح حتى تتمكن من رؤية أي ملف تعريف نشط.
- يكون الملف الشخصي الافتراضي هو `openclaw` ‏(مُدار ومستقل). استخدم `defaultProfile: "user"` للاشتراك في متصفح المستخدم المسجل دخوله.
- ترتيب الاكتشاف التلقائي: متصفح النظام الافتراضي إذا كان مبنيًا على Chromium؛ وإلا Chrome → Brave → Edge → Chromium → Chrome Canary.
- يستخدم `driver: "existing-session"` ‏Chrome DevTools MCP بدلًا من CDP الخام. لا تضبط `cdpUrl` لهذا driver.
- اضبط `browser.profiles.<name>.userDataDir` عندما يجب أن يتصل ملف تعريف existing-session بملف تعريف مستخدم Chromium غير افتراضي (Brave أو Edge أو غيرهما). ويقبل هذا المسار أيضًا `~` ليشير إلى الدليل الرئيسي في نظام التشغيل لديك.

</Accordion>

</AccordionGroup>

## استخدام Brave (أو متصفح آخر مبني على Chromium)

إذا كان **متصفحك الافتراضي في النظام** مبنيًا على Chromium ‏(Chrome/Brave/Edge/إلخ)،
فإن OpenClaw يستخدمه تلقائيًا. اضبط `browser.executablePath` لتجاوز
الاكتشاف التلقائي. وتقبل قيم `executablePath` في المستوى الأعلى ولكل ملف تعريف الرمز `~`
ليشير إلى الدليل الرئيسي في نظام التشغيل لديك:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

أو اضبطه في التكوين حسب المنصة:

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

يؤثر `executablePath` الخاص بكل ملف تعريف فقط على ملفات التعريف المُدارة محليًا التي يطلقها OpenClaw.
أما ملفات تعريف `existing-session` فتتصل بمتصفح يعمل بالفعل،
وتستخدم ملفات تعريف CDP البعيدة المتصفح الموجود خلف `cdpUrl`.

## التحكم المحلي مقابل التحكم البعيد

- **التحكم المحلي (الافتراضي):** يبدأ Gateway خدمة التحكم على loopback ويمكنه إطلاق متصفح محلي.
- **التحكم البعيد (node host):** شغّل node host على الجهاز الذي يحتوي على المتصفح؛ وسيقوم Gateway بتمرير إجراءات المتصفح إليه.
- **CDP البعيد:** اضبط `browser.profiles.<name>.cdpUrl` ‏(أو `browser.cdpUrl`) من أجل
  الاتصال بمتصفح بعيد مبني على Chromium. وفي هذه الحالة، لن يقوم OpenClaw بإطلاق متصفح محلي.
- بالنسبة إلى خدمات CDP المُدارة خارجيًا على loopback ‏(مثل Browserless داخل
  Docker والمنشور على `127.0.0.1`)، اضبط أيضًا `attachOnly: true`. إذ يُعامل CDP على loopback
  من دون `attachOnly` على أنه ملف تعريف متصفح محلي مُدار بواسطة OpenClaw.
- يؤثر `headless` فقط على ملفات التعريف المُدارة محليًا التي يطلقها OpenClaw. ولا يعيد تشغيل
  متصفحات existing-session أو CDP البعيدة ولا يغيّرها.
- يتبع `executablePath` القاعدة نفسها الخاصة بملف التعريف المُدار محليًا. فتغييره
  على ملف تعريف مُدار محليًا قيد التشغيل يعلّم ذلك الملف لإعادة التشغيل/التسوية حتى
  يستخدم الإطلاق التالي الملف التنفيذي الجديد.

ويختلف سلوك الإيقاف بحسب وضع الملف الشخصي:

- ملفات التعريف المُدارة محليًا: يؤدي `openclaw browser stop` إلى إيقاف عملية المتصفح التي
  أطلقها OpenClaw
- ملفات attach-only وCDP البعيدة: يؤدي `openclaw browser stop` إلى إغلاق
  جلسة التحكم النشطة وتحرير تجاوزات المحاكاة الخاصة بـ Playwright/CDP ‏(إطار العرض،
  ومخطط الألوان، وlocale، والمنطقة الزمنية، ووضع عدم الاتصال، والحالات المشابهة)، حتى
  وإن لم يكن OpenClaw قد أطلق أي عملية متصفح

يمكن أن تتضمن عناوين URL الخاصة بـ CDP البعيد مصادقة:

- رموز مميزة في query ‏(مثل `https://provider.example?token=<token>`)
- مصادقة HTTP Basic ‏(مثل `https://user:pass@provider.example`)

يحافظ OpenClaw على المصادقة عند استدعاء نقاط النهاية `/json/*` وعند الاتصال
بـ CDP WebSocket. ويفضَّل استخدام متغيرات البيئة أو مديري الأسرار بالنسبة إلى
الرموز المميزة بدلًا من إجراء commit لها داخل ملفات التكوين.

## proxy متصفح node ‏(افتراضي بلا إعدادات)

إذا شغّلت **node host** على الجهاز الذي يحتوي على متصفحك، فيمكن لـ OpenClaw
أن يوجّه استدعاءات أداة المتصفح تلقائيًا إلى تلك العقدة من دون أي تكوين إضافي للمتصفح.
وهذا هو المسار الافتراضي لـ Gateways البعيدة.

ملاحظات:

- يكشف node host خادم التحكم المحلي بالمتصفح عبر **أمر proxy**.
- تأتي ملفات التعريف من تكوين `browser.profiles` الخاص بالعقدة نفسها (كما في الوضع المحلي).
- يمثّل `nodeHost.browserProxy.allowProfiles` خيارًا اختياريًا. اتركه فارغًا للسلوك القديم/الافتراضي: تظل جميع ملفات التعريف المهيأة قابلة للوصول عبر proxy، بما في ذلك مسارات إنشاء/حذف ملفات التعريف.
- إذا ضبطت `nodeHost.browserProxy.allowProfiles`، فإن OpenClaw يتعامل معه كحد أقل امتيازًا: لا يمكن استهداف إلا ملفات التعريف المدرجة في قائمة السماح، كما تُحظر مسارات إنشاء/حذف الملفات التعريفية الدائمة على سطح proxy.
- عطّله إذا كنت لا تريده:
  - على العقدة: `nodeHost.browserProxy.enabled=false`
  - على gateway: ‏`gateway.nodes.browser.mode="off"`

## Browserless ‏(CDP بعيد مستضاف)

[Browserless](https://browserless.io) خدمة Chromium مستضافة تكشف
عناوين CDP عبر HTTPS وWebSocket. ويمكن لـ OpenClaw استخدام أي من الشكلين، لكن
بالنسبة إلى ملف تعريف متصفح بعيد يكون الخيار الأبسط هو عنوان WebSocket المباشر
الوارد في وثائق الاتصال الخاصة بـ Browserless.

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
  `wss://` لاتصال CDP مباشر أو الإبقاء على عنوان HTTPS والسماح لـ OpenClaw
  باكتشاف `/json/version`.

### Browserless Docker على المضيف نفسه

عندما يكون Browserless مستضافًا ذاتيًا داخل Docker ويعمل OpenClaw على المضيف، فعامل
Browserless على أنه خدمة CDP مُدارة خارجيًا:

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

يجب أن يكون العنوان الموجود في `browser.profiles.browserless.cdpUrl` قابلًا للوصول من
عملية OpenClaw. ويجب أيضًا أن يعلن Browserless عن نقطة نهاية مطابقة وقابلة للوصول؛ اضبط
القيمة `EXTERNAL` في Browserless على قاعدة WebSocket نفسها القابلة للوصول من قبل OpenClaw، مثل
`ws://127.0.0.1:3000`، أو `ws://browserless:3000`، أو عنوانًا خاصًا ثابتًا
ضمن شبكة Docker. وإذا أعاد `/json/version` القيمة `webSocketDebuggerUrl` مشيرةً إلى
عنوان لا يستطيع OpenClaw الوصول إليه، فقد يبدو HTTP الخاص بـ CDP سليمًا بينما يفشل
الاتصال عبر WebSocket مع ذلك.

لا تترك `attachOnly` غير مضبوطة لملف تعريف Browserless على loopback. فمن دون
`attachOnly`، يعامل OpenClaw منفذ loopback على أنه ملف تعريف متصفح محلي مُدار
وقد يبلّغ بأن المنفذ قيد الاستخدام لكنه غير مملوك لـ OpenClaw.

## مزوّدو CDP المباشرون عبر WebSocket

تكشف بعض خدمات المتصفح المستضافة نقطة نهاية **WebSocket مباشرة** بدلًا من
اكتشاف CDP القياسي المعتمد على HTTP ‏(`/json/version`). ويقبل OpenClaw ثلاثة
أشكال لعناوين CDP ويختار استراتيجية الاتصال الصحيحة تلقائيًا:

- **اكتشاف HTTP(S)** — ‏`http://host[:port]` أو `https://host[:port]`.
  يستدعي OpenClaw ‏`/json/version` لاكتشاف عنوان WebSocket debugger، ثم
  يتصل به. ولا يوجد رجوع احتياطي إلى WebSocket.
- **نقاط نهاية WebSocket المباشرة** — ‏`ws://host[:port]/devtools/<kind>/<id>` أو
  `wss://...` مع مسار `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  يتصل OpenClaw مباشرة عبر مصافحة WebSocket ويتخطى
  `/json/version` بالكامل.
- **جذور WebSocket المجرّدة** — ‏`ws://host[:port]` أو `wss://host[:port]` من دون
  مسار `/devtools/...` ‏(مثل [Browserless](https://browserless.io)،
  و[Browserbase](https://www.browserbase.com)). يحاول OpenClaw أولًا اكتشاف HTTP عبر
  `/json/version` ‏(مع تطبيع المخطط إلى `http`/`https`)؛
  فإذا أعاد الاكتشاف قيمة `webSocketDebuggerUrl` يتم استخدامها، وإلا يعود OpenClaw
  إلى مصافحة WebSocket مباشرة عند الجذر المجرد. وإذا رفضت نقطة نهاية WebSocket المُعلن عنها مصافحة CDP لكن الجذر المجرد المهيأ
  قبِلها، فإن OpenClaw يعود إلى ذلك الجذر أيضًا. وهذا يسمح لجذر `ws://` مجرّد
  موجَّه إلى Chrome محلي بالاتصال، لأن Chrome لا يقبل ترقيات WebSocket
  إلا على المسار المحدد لكل هدف من `/json/version`، بينما يمكن للمزوّدين المستضافين
  الاستمرار في استخدام نقطة نهاية WebSocket الجذرية الخاصة بهم عندما تعلن نقطة نهاية الاكتشاف لديهم عن عنوان قصير العمر غير مناسب لـ Playwright CDP.

### Browserbase

[Browserbase](https://www.browserbase.com) منصة سحابية لتشغيل
متصفحات headless مع حل CAPTCHA مدمج، ووضع stealth، وproxies سكنية.

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
  من [لوحة Overview](https://www.browserbase.com/overview).
- استبدل `<BROWSERBASE_API_KEY>` بمفتاح Browserbase الحقيقي.
- يقوم Browserbase بإنشاء جلسة متصفح تلقائيًا عند الاتصال عبر WebSocket، لذلك لا
  حاجة إلى خطوة إنشاء جلسة يدويًا.
- تسمح الخطة المجانية بجلسة متزامنة واحدة وساعة متصفح واحدة شهريًا.
  راجع [التسعير](https://www.browserbase.com/pricing) لمعرفة حدود الخطط المدفوعة.
- راجع [وثائق Browserbase](https://docs.browserbase.com) للاطلاع على المرجع الكامل لـ API،
  وأدلة SDK، وأمثلة الدمج.

## الأمان

أفكار أساسية:

- يكون التحكم في المتصفح على loopback فقط؛ ويمر الوصول عبر مصادقة Gateway أو اقتران العقدة.
- تستخدم واجهة HTTP المستقلة الخاصة بالمتصفح على loopback **مصادقة shared-secret فقط**:
  إما مصادقة bearer لرمز gateway المميز، أو `x-openclaw-password`، أو HTTP Basic auth باستخدام
  كلمة مرور gateway المهيأة.
- لا تقوم ترويسات هوية Tailscale Serve ولا `gateway.auth.mode: "trusted-proxy"` بـ
  مصادقة واجهة المتصفح المستقلة هذه على loopback.
- إذا كان التحكم في المتصفح مفعّلًا ولم يتم تهيئة أي مصادقة shared-secret، فإن OpenClaw
  يولّد `gateway.auth.token` تلقائيًا عند بدء التشغيل ويحفظه في التكوين.
- لا يقوم OpenClaw **بتوليد** هذا الرمز تلقائيًا عندما يكون `gateway.auth.mode`
  مضبوطًا بالفعل على `password` أو `none` أو `trusted-proxy`.
- أبقِ Gateway وأي node hosts على شبكة خاصة (Tailscale)؛ وتجنب تعريضها علنًا.
- تعامل مع عناوين/رموز CDP البعيدة على أنها أسرار؛ وفضّل env أو مدير أسرار.

نصائح حول CDP البعيد:

- فضّل نقاط النهاية المشفرة (HTTPS أو WSS) والرموز قصيرة العمر متى أمكن.
- تجنب تضمين الرموز طويلة العمر مباشرة في ملفات التكوين.

## الملفات الشخصية (متصفحات متعددة)

يدعم OpenClaw عدة ملفات تعريف مسماة (إعدادات توجيه). ويمكن أن تكون الملفات الشخصية:

- **مُدارة بواسطة openclaw**: نسخة متصفح مبنية على Chromium ومخصصة لها دليل بيانات مستخدم خاص + منفذ CDP
- **بعيدة**: عنوان CDP صريح (متصفح مبني على Chromium يعمل في مكان آخر)
- **جلسة موجودة**: ملف تعريف Chrome الحالي لديك عبر الاتصال التلقائي بـ Chrome DevTools MCP

الافتراضيات:

- يُنشأ الملف الشخصي `openclaw` تلقائيًا إذا كان مفقودًا.
- يكون الملف الشخصي `user` مضمّنًا للاتصال بجلسة existing-session عبر Chrome MCP.
- تكون ملفات existing-session اختيارية إلى جانب `user`؛ أنشئها باستخدام `--driver existing-session`.
- يتم تخصيص منافذ CDP المحلية من **18800–18899** افتراضيًا.
- يؤدي حذف ملف تعريف إلى نقل دليل بياناته المحلي إلى Trash.

تقبل جميع نقاط نهاية التحكم القيمة `?profile=<name>`؛ بينما يستخدم CLI الخيار `--browser-profile`.

## الجلسة الحالية عبر Chrome DevTools MCP

يمكن لـ OpenClaw أيضًا الاتصال بملف تعريف متصفح مبني على Chromium يعمل بالفعل من خلال
الخادم الرسمي Chrome DevTools MCP. ويعيد هذا استخدام علامات التبويب وحالة تسجيل الدخول
المفتوحة بالفعل في ملف التعريف ذاك.

مراجع الخلفية والإعداد الرسمية:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

الملف الشخصي المضمن:

- `user`

اختياري: أنشئ ملف تعريف existing-session مخصصًا إذا كنت تريد
اسمًا مختلفًا أو لونًا مختلفًا أو دليل بيانات متصفح مختلفًا.

السلوك الافتراضي:

- يستخدم الملف الشخصي `user` الاتصال التلقائي عبر Chrome MCP، وهو يستهدف
  ملف التعريف المحلي الافتراضي لـ Google Chrome.

استخدم `userDataDir` بالنسبة إلى Brave أو Edge أو Chromium أو ملف تعريف Chrome غير الافتراضي.
ويتم توسيع `~` إلى الدليل الرئيسي في نظام التشغيل لديك:

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

ثم داخل المتصفح المطابق:

1. افتح صفحة inspect لذلك المتصفح من أجل التصحيح البعيد.
2. فعّل التصحيح البعيد.
3. أبقِ المتصفح قيد التشغيل ووافق على مطالبة الاتصال عندما يتصل OpenClaw.

صفحات inspect الشائعة:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

اختبار smoke مباشر للاتصال:

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
- يعرض `tabs` علامات التبويب المفتوحة بالفعل في متصفحك
- يعيد `snapshot` مراجع refs من علامة التبويب الحية المحددة

ما الذي يجب التحقق منه إذا لم ينجح الاتصال:

- أن يكون المتصفح المستهدف المبني على Chromium بالإصدار `144+`
- أن يكون التصحيح البعيد مفعّلًا في صفحة inspect الخاصة بذلك المتصفح
- أن المتصفح عرض مطالبة الاتصال وقمت بقبولها
- يقوم `openclaw doctor` بترحيل تكوينات المتصفح القديمة المعتمدة على extension ويتحقق من
  أن Chrome مثبّت محليًا لملفات التعريف الافتراضية ذات الاتصال التلقائي، لكنه لا يستطيع
  تمكين التصحيح البعيد على جانب المتصفح نيابةً عنك

استخدام الوكيل:

- استخدم `profile="user"` عندما تحتاج إلى حالة المتصفح المسجل دخوله للمستخدم.
- إذا كنت تستخدم ملف تعريف existing-session مخصصًا، فمرّر اسم ذلك الملف صراحةً.
- اختر هذا الوضع فقط عندما يكون المستخدم أمام الكمبيوتر للموافقة على
  مطالبة الاتصال.
- يمكن لـ Gateway أو node host تشغيل `npx chrome-devtools-mcp@latest --autoConnect`

ملاحظات:

- يكون هذا المسار أعلى خطورة من الملف الشخصي المعزول `openclaw` لأنه يمكن
  أن يعمل داخل جلسة المتصفح المسجل دخولها لديك.
- لا يقوم OpenClaw بإطلاق المتصفح لهذا driver؛ بل يكتفي بالاتصال به.
- يستخدم OpenClaw التدفق الرسمي `--autoConnect` الخاص بـ Chrome DevTools MCP هنا. وإذا
  تم ضبط `userDataDir`، فسيتم تمريره لاستهداف دليل بيانات المستخدم ذاك.
- يمكن لـ existing-session الاتصال على المضيف المحدد أو عبر
  عقدة متصفح متصلة. وإذا كان Chrome موجودًا في مكان آخر ولم تكن هناك عقدة متصفح متصلة، فاستخدم
  بدلًا من ذلك CDP البعيد أو node host.

### إطلاق Chrome MCP مخصص

تجاوز خادم Chrome DevTools MCP الذي يتم تشغيله لكل ملف تعريف عندما لا يكون التدفق الافتراضي
`npx chrome-devtools-mcp@latest` هو ما تريده (مضيفات غير متصلة، أو إصدارات مثبتة،
أو ملفات تنفيذية مضمّنة):

| الحقل        | ما الذي يفعله                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | الملف التنفيذي المطلوب تشغيله بدلًا من `npx`. ويتم حله كما هو؛ وتُحترم المسارات المطلقة.                                          |
| `mcpArgs`    | مصفوفة الوسائط التي تُمرَّر حرفيًا إلى `mcpCommand`. وتستبدل وسائط `chrome-devtools-mcp@latest --autoConnect` الافتراضية. |

عندما تكون `cdpUrl` مضبوطة على ملف تعريف existing-session، يتخطى OpenClaw
القيمة `--autoConnect` ويمرر نقطة النهاية إلى Chrome MCP تلقائيًا:

- `http(s)://...` → ‏`--browserUrl <url>` ‏(نقطة نهاية اكتشاف DevTools HTTP).
- `ws(s)://...` → ‏`--wsEndpoint <url>` ‏(اتصال CDP WebSocket مباشر).

لا يمكن دمج أعلام نقطة النهاية مع `userDataDir`: فعندما تكون `cdpUrl` مضبوطة،
يتم تجاهل `userDataDir` عند إطلاق Chrome MCP، لأن Chrome MCP يتصل
بالمتصفح الجاري خلف نقطة النهاية بدلًا من فتح دليل ملف تعريف.

<Accordion title="قيود ميزات existing-session">

مقارنةً بملف التعريف المُدار `openclaw`، تكون drivers الخاصة بـ existing-session أكثر تقييدًا:

- **لقطات الشاشة** — تعمل لقطات الصفحة ولقطات العناصر باستخدام `--ref`؛ أما محددات CSS ‏`--element` فلا تعمل. ولا يمكن دمج `--full-page` مع `--ref` أو `--element`. ولا يتطلب Playwright لقطات الصفحة أو لقطات العناصر المعتمدة على ref.
- **الإجراءات** — تتطلب `click`، و`type`، و`hover`، و`scrollIntoView`، و`drag`، و`select` مراجع snapshot ‏(ولا تدعم محددات CSS). ينقر `click-coords` على إحداثيات مرئية في viewport ولا يتطلب ref من snapshot. وتدعم `click` زر الفأرة الأيسر فقط. ولا تدعم `type` الخيار `slowly=true`؛ استخدم `fill` أو `press`. ولا تدعم `press` الخيار `delayMs`. كما لا تدعم `type`، و`hover`، و`scrollIntoView`، و`drag`، و`select`، و`fill`، و`evaluate` مهلات لكل استدعاء. وتقبل `select` قيمة واحدة.
- **الانتظار / الرفع / مربع الحوار** — يدعم `wait --url` الأنماط exact وsubstring وglob؛ ولا يدعم `wait --load networkidle`. وتتطلب hooks الرفع `ref` أو `inputRef`، وبملف واحد في كل مرة، ومن دون CSS `element`. ولا تدعم hooks مربعات الحوار تجاوزات المهلة.
- **الميزات الخاصة بالوضع المُدار فقط** — لا تزال الإجراءات الدفعية، وتصدير PDF، واعتراض التنزيلات، و`responsebody` تتطلب مسار المتصفح المُدار.

</Accordion>

## ضمانات العزل

- **دليل بيانات مستخدم مخصص**: لا يلمس ملف تعريف متصفحك الشخصي مطلقًا.
- **منافذ مخصصة**: يتجنب المنفذ `9222` لتفادي التعارض مع تدفقات عمل التطوير.
- **تحكم حتمي في علامات التبويب**: يعيد `tabs` أولًا `suggestedTargetId`، ثم
  معرّفات `tabId` الثابتة مثل `t1`، ثم labels الاختيارية، ثم `targetId` الخام.
  ينبغي للوكلاء إعادة استخدام `suggestedTargetId`؛ بينما تظل المعرّفات الخام متاحة
  لأغراض التصحيح والتوافق.

## اختيار المتصفح

عند الإطلاق محليًا، يختار OpenClaw أول متصفح متاح من القائمة التالية:

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
  `/usr/lib/chromium-browser`.
- Windows: يتحقق من مواقع التثبيت الشائعة.

## API التحكم (اختياري)

لأغراض البرمجة النصية والتصحيح، يكشف Gateway واجهة **HTTP للتحكم على loopback فقط**
بالإضافة إلى CLI مطابق باسم `openclaw browser` ‏(لقطات snapshot، وrefs، وتعزيزات الانتظار، ومخرجات JSON، وتدفقات التصحيح). راجع
[Browser control API](/ar/tools/browser-control) للاطلاع على المرجع الكامل.

## استكشاف الأخطاء وإصلاحها

للمشكلات الخاصة بـ Linux ‏(خصوصًا snap Chromium)، راجع
[استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser-linux-troubleshooting).

بالنسبة إلى إعدادات WSL2 Gateway + Windows Chrome ذات المضيف المقسّم، راجع
[استكشاف أخطاء WSL2 + Windows + CDP البعيد لـ Chrome وإصلاحها](/ar/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### فشل بدء تشغيل CDP مقابل حظر التنقل بسبب SSRF

هذان صنفان مختلفان من الإخفاقات ويشيران إلى مسارات شيفرة مختلفة.

- **فشل بدء تشغيل CDP أو جاهزيته** يعني أن OpenClaw لا يستطيع تأكيد سلامة مستوى التحكم في المتصفح.
- **حظر التنقل بسبب SSRF** يعني أن مستوى التحكم في المتصفح سليم، لكن هدف تنقل الصفحة مرفوض بسبب السياسة.

أمثلة شائعة:

- فشل بدء تشغيل CDP أو الجاهزية:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - `Port <port> is in use for profile "<name>" but not by openclaw` عندما تكون
    خدمة CDP خارجية على loopback مهيأة من دون `attachOnly: true`
- حظر التنقل بسبب SSRF:
  - تفشل تدفقات `open` أو `navigate` أو snapshot أو فتح علامات التبويب مع خطأ سياسة متصفح/شبكة بينما لا يزال `start` و`tabs` يعملان

استخدم هذا التسلسل الأدنى للفصل بين الحالتين:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

كيفية قراءة النتائج:

- إذا فشل `start` مع `not reachable after start`، فابدأ أولًا باستكشاف جاهزية CDP وإصلاحها.
- إذا نجح `start` لكن فشل `tabs`، فلا يزال مستوى التحكم غير سليم. وتعامل مع ذلك باعتباره مشكلة في إمكانية الوصول إلى CDP، وليس مشكلة تنقل صفحات.
- إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح قائم وأن الفشل في سياسة التنقل أو في الصفحة الهدف.
- إذا نجح `start` و`tabs` و`open` جميعًا، فهذا يعني أن مسار التحكم الأساسي بالمتصفح المُدار سليم.

تفاصيل سلوكية مهمة:

- يفترض تكوين المتصفح افتراضيًا كائن سياسة SSRF يعمل بطريقة fail-closed حتى عندما لا تهيئ `browser.ssrfPolicy`.
- بالنسبة إلى ملف التعريف المحلي المُدار `openclaw` على loopback، تتخطى فحوصات صحة CDP عمدًا فرض إمكانية الوصول الخاصة بـ SSRF للمتصفح فيما يتعلق بمستوى التحكم المحلي الخاص بـ OpenClaw.
- حماية التنقل منفصلة. فنجاح `start` أو `tabs` لا يعني أن هدف `open` أو `navigate` اللاحق مسموح به.

إرشادات الأمان:

- **لا** تخفف سياسة SSRF الخاصة بالمتصفح افتراضيًا.
- فضّل الاستثناءات الضيقة للمضيف مثل `hostnameAllowlist` أو `allowedHostnames` بدلًا من الوصول الواسع إلى الشبكات الخاصة.
- استخدم `dangerouslyAllowPrivateNetwork: true` فقط في بيئات موثوقة عمدًا حيث يكون الوصول إلى الشبكات الخاصة عبر المتصفح مطلوبًا وتمت مراجعته.

## أدوات الوكيل + كيفية عمل التحكم

يحصل الوكيل على **أداة واحدة** لأتمتة المتصفح:

- `browser` — doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

كيفية الربط:

- يعيد `browser snapshot` شجرة UI ثابتة (AI أو ARIA).
- يستخدم `browser act` معرّفات `ref` من snapshot من أجل click/type/drag/select.
- يلتقط `browser screenshot` البكسلات (صفحة كاملة، أو عنصر، أو refs مع labels).
- يتحقق `browser doctor` من جاهزية Gateway، وPlugin، وملف التعريف، والمتصفح، وعلامة التبويب.
- يقبل `browser`:
  - `profile` لاختيار ملف تعريف متصفح مسمّى (openclaw، أو chrome، أو CDP بعيد).
  - `target` ‏(`sandbox` | `host` | `node`) لاختيار مكان وجود المتصفح.
  - في الجلسات داخل sandbox، يتطلب `target: "host"` القيمة `agents.defaults.sandbox.browser.allowHostControl=true`.
  - عند حذف `target`: تفترض الجلسات داخل sandbox القيمة `sandbox`، وتفترض الجلسات خارج sandbox القيمة `host`.
  - إذا كانت هناك عقدة متصلة قادرة على تشغيل المتصفح، فقد تقوم الأداة بالتوجيه التلقائي إليها ما لم تثبّت `target="host"` أو `target="node"`.

وهذا يحافظ على حتمية الوكيل ويجنب المحددات الهشة.

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) — جميع أدوات الوكيل المتاحة
- [Sandboxing](/ar/gateway/sandboxing) — التحكم في المتصفح داخل البيئات المعزولة
- [الأمان](/ar/gateway/security) — مخاطر التحكم في المتصفح وطرق التقوية

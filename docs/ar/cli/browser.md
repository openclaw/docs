---
read_when:
    - تستخدم `openclaw browser` وتريد أمثلة للمهام الشائعة
    - تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف Node
    - تريد الاتصال بمتصفح Chrome المحلي الذي سجّلت الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، الملفات الشخصية، علامات التبويب، الإجراءات، الحالة، وتصحيح الأخطاء)
title: المتصفح
x-i18n:
    generated_at: "2026-04-30T07:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

إدارة سطح تحكم المتصفح في OpenClaw وتشغيل إجراءات المتصفح (دورة الحياة، الملفات الشخصية، علامات التبويب، اللقطات، لقطات الشاشة، التنقل، الإدخال، محاكاة الحالة، وتصحيح الأخطاء).

ذات صلة:

- أداة المتصفح + واجهة API: [أداة المتصفح](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL الخاص بـ WebSocket في Gateway (يستخدم الإعدادات افتراضيًا).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--timeout <ms>`: مهلة الطلب (ms).
- `--expect-final`: انتظار استجابة Gateway نهائية.
- `--browser-profile <name>`: اختيار ملف شخصي للمتصفح (الافتراضي من الإعدادات).
- `--json`: إخراج قابل للقراءة آليًا (حيثما كان مدعومًا).

## البدء السريع (محليًا)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

يمكن للوكلاء تشغيل فحص الجاهزية نفسه باستخدام `browser({ action: "doctor" })`.

## استكشاف الأخطاء السريع

إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا. إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم بالمتصفح سليم، ويكون الفشل عادةً ناتجًا عن سياسة SSRF للتنقل.

تسلسل بسيط:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

إرشادات مفصلة: [استكشاف أخطاء المتصفح](/ar/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## دورة الحياة

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

ملاحظات:

- يضيف `doctor --deep` فحص لقطة مباشرًا. يكون ذلك مفيدًا عندما تكون جاهزية CDP
  الأساسية سليمة، لكنك تريد إثباتًا أن علامة التبويب الحالية قابلة للفحص.
- بالنسبة إلى ملفات `attachOnly` وCDP البعيدة، يغلق `openclaw browser stop`
  جلسة التحكم النشطة ويمسح تجاوزات المحاكاة المؤقتة حتى عندما
  لا يكون OpenClaw قد شغّل عملية المتصفح بنفسه.
- بالنسبة إلى الملفات الشخصية المحلية المُدارة، يوقف `openclaw browser stop` عملية المتصفح
  التي تم إنشاؤها.
- لا ينطبق `openclaw browser start --headless` إلا على طلب البدء هذا فقط
  وفقط عندما يشغّل OpenClaw متصفحًا محليًا مُدارًا. ولا يعيد كتابة
  `browser.headless` أو إعدادات الملف الشخصي، ولا يفعل شيئًا لمتصفح قيد التشغيل بالفعل.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تعمل الملفات الشخصية
  المحلية المُدارة بلا واجهة تلقائيًا ما لم يطلب `OPENCLAW_BROWSER_HEADLESS=0` أو
  `browser.headless=false` أو `browser.profiles.<name>.headless=false`
  متصفحًا مرئيًا صراحةً.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عند وجود `plugins.allow`، أدرج Plugin المتصفح المضمّن صراحةً
ما لم تكن الإعدادات تحتوي بالفعل على كتلة `browser` جذرية:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

تؤدي كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو
`browser.profiles.<name>`، أيضًا إلى تفعيل Plugin المتصفح المضمّن ضمن
قائمة سماح Plugin تقييدية.

ذات صلة: [أداة المتصفح](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات الشخصية

الملفات الشخصية هي إعدادات توجيه متصفح مسماة. عمليًا:

- `openclaw`: يشغّل مثيل Chrome مخصصًا تديره OpenClaw أو يتصل به (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجّل دخولك إليها عبر Chrome DevTools MCP.
- ملفات CDP الشخصية المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدم ملفًا شخصيًا محددًا:

```bash
openclaw browser --browser-profile work tabs
```

## علامات التبويب

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

يعيد `tabs` قيمة `suggestedTargetId` أولًا، ثم `tabId` المستقر مثل `t1`،
والتسمية الاختيارية، و`targetId` الخام. يجب على الوكلاء تمرير
`suggestedTargetId` مجددًا إلى `focus` و`close` واللقطات والإجراءات. يمكنك
تعيين تسمية باستخدام `open --label` أو `tab new --label` أو `tab label`؛ وتُقبل
التسميات ومعرّفات علامات التبويب ومعرّفات الهدف الخام والبادئات الفريدة لمعرّف الهدف كلها.
عندما يستبدل Chromium الهدف الخام الأساسي أثناء التنقل أو إرسال نموذج،
يبقي OpenClaw قيمة `tabId`/التسمية المستقرة مرتبطة بعلامة التبويب البديلة
عندما يستطيع إثبات التطابق. تبقى معرّفات الهدف الخام متقلبة؛ فضّل
`suggestedTargetId`.

## اللقطة / لقطة الشاشة / الإجراءات

اللقطة:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

لقطة الشاشة:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

ملاحظات:

- `--full-page` مخصص لالتقاط الصفحات فقط؛ ولا يمكن دمجه مع `--ref`
  أو `--element`.
- تدعم ملفات `existing-session` / `user` لقطات شاشة الصفحة ولقطات شاشة `--ref`
  من إخراج اللقطة، لكنها لا تدعم لقطات شاشة CSS عبر `--element`.
- يضع `--labels` مراجع اللقطة الحالية فوق لقطة الشاشة.
- يضيف `snapshot --urls` وجهات الروابط المكتشفة إلى لقطات الذكاء الاصطناعي حتى
  يتمكن الوكلاء من اختيار أهداف تنقل مباشرة بدلًا من التخمين من نص
  الرابط وحده.

التنقل/النقر/الكتابة (أتمتة واجهة المستخدم المعتمدة على المرجع):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

تعيد استجابات الإجراء قيمة `targetId` الخام الحالية بعد استبدال الصفحة
المشغّل بإجراء عندما يستطيع OpenClaw إثبات علامة التبويب البديلة. ومع ذلك ينبغي
للبرامج النصية تخزين وتمرير `suggestedTargetId`/التسميات لسير العمل طويل الأمد.

مساعدات الملفات ومربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

تحفظ ملفات Chrome الشخصية المُدارة التنزيلات العادية الناتجة عن النقر في دليل
تنزيلات OpenClaw (`/tmp/openclaw/downloads` افتراضيًا، أو جذر الملفات المؤقتة
المضبوط). استخدم `waitfordownload` أو `download` عندما يحتاج الوكيل إلى انتظار
ملف محدد وإعادة مساره؛ تمتلك أدوات الانتظار الصريحة هذه التنزيل التالي.

## الحالة والتخزين

إطار العرض + المحاكاة:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

ملفات تعريف الارتباط + التخزين:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## تصحيح الأخطاء

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome موجود عبر MCP

استخدم الملف الشخصي المضمّن `user`، أو أنشئ ملف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

هذا المسار خاص بالمضيف فقط. بالنسبة إلى Docker أو الخوادم بلا واجهة أو Browserless أو الإعدادات البعيدة الأخرى، استخدم ملف CDP شخصيًا بدلًا من ذلك.

قيود `existing-session` الحالية:

- تستخدم الإجراءات المعتمدة على اللقطات المراجع، وليس محددات CSS
- يضبط `browser.actionTimeoutMs` قيمة الطلبات المدعومة `act` افتراضيًا إلى 60000 ms عندما
  يحذف المستدعون `timeoutMs`؛ وتظل قيمة `timeoutMs` لكل استدعاء هي الأعلى أولوية.
- `click` نقر أيسر فقط
- لا يدعم `type` قيمة `slowly=true`
- لا يدعم `press` قيمة `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate`
  تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- `wait --load networkidle` غير مدعوم
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم CSS
  عبر `--element`، وتدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم خطافات مربع الحوار `--timeout`
- تدعم لقطات الشاشة التقاط الصفحات و`--ref`، لكن ليس CSS عبر `--element`
- ما زالت `responsebody` واعتراض التنزيلات وتصدير PDF والإجراءات الدفعية
  تتطلب متصفحًا مُدارًا أو ملف CDP خامًا

## التحكم بالمتصفح عن بُعد (وكيل مضيف العقدة)

إذا كان Gateway يعمل على جهاز مختلف عن المتصفح، فشغّل **مضيف عقدة** على الجهاز الذي يحتوي على Chrome/Brave/Edge/Chromium. سيقوم Gateway بتمرير إجراءات المتصفح إلى تلك العقدة (لا يلزم خادم تحكم منفصل بالمتصفح).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي و`gateway.nodes.browser.node` لتثبيت عقدة محددة إذا كانت هناك عدة عقد متصلة.

الأمان + الإعداد البعيد: [أداة المتصفح](/ar/tools/browser)، [الوصول البعيد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [المتصفح](/ar/tools/browser)

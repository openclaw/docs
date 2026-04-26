---
read_when:
    - أنت تستخدم `openclaw browser` وتريد أمثلة للمهام الشائعة
    - أنت تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف Node
    - أنت تريد الاتصال بمتصفح Chrome المحلي الذي سبق تسجيل الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، والملفات الشخصية، وعلامات التبويب، والإجراءات، والحالة، وتصحيح الأخطاء)
title: المتصفح
x-i18n:
    generated_at: "2026-04-26T11:24:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b42511e841e768bfa4031463f213d78c67d5c63efb655a90f65c7e8c71da9881
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

إدارة سطح التحكم بالمتصفح في OpenClaw وتشغيل إجراءات المتصفح (دورة الحياة، والملفات الشخصية، وعلامات التبويب، واللقطات، ولقطات الشاشة، والتنقل، والإدخال، ومحاكاة الحالة، وتصحيح الأخطاء).

ذو صلة:

- أداة المتصفح وAPI: [أداة المتصفح](/ar/tools/browser)

## الأعلام الشائعة

- `--url <gatewayWsUrl>`: عنوان URL لـ WebSocket الخاص بـ Gateway (القيمة الافتراضية من التكوين).
- `--token <token>`: رمز Gateway المميز (إذا لزم الأمر).
- `--timeout <ms>`: مهلة الطلب (بالملي ثانية).
- `--expect-final`: انتظار استجابة نهائية من Gateway.
- `--browser-profile <name>`: اختيار ملف تعريف متصفح (الافتراضي من التكوين).
- `--json`: مخرجات قابلة للقراءة آليًا (حيثما كان ذلك مدعومًا).

## البدء السريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

يمكن للوكلاء تنفيذ فحص الجاهزية نفسه باستخدام `browser({ action: "doctor" })`.

## استكشاف الأخطاء السريع وإصلاحها

إذا فشل `start` مع `not reachable after start`، فابدأ أولًا باستكشاف جاهزية CDP وإصلاحها. إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح سليم، وأن الفشل يكون عادةً بسبب سياسة SSRF الخاصة بالتنقل.

تسلسل أدنى:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

إرشادات مفصلة: [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- يضيف `doctor --deep` فحصًا مباشرًا للقطات. ويكون مفيدًا عندما تكون جاهزية CDP الأساسية سليمة ولكنك تريد دليلًا على أن علامة التبويب الحالية يمكن فحصها.
- بالنسبة إلى ملفات التعريف `attachOnly` وCDP البعيدة، فإن `openclaw browser stop` يغلق جلسة التحكم النشطة ويمسح تجاوزات المحاكاة المؤقتة حتى عندما لا يكون OpenClaw هو من شغّل عملية المتصفح بنفسه.
- بالنسبة إلى ملفات التعريف المحلية المُدارة، فإن `openclaw browser stop` يوقف عملية المتصفح التي تم تشغيلها.
- ينطبق `openclaw browser start --headless` فقط على طلب البدء هذا، وفقط عندما يشغّل OpenClaw متصفحًا محليًا مُدارًا. ولا يعيد كتابة `browser.headless` أو تكوين الملف الشخصي، ولا يكون له أي أثر إذا كان المتصفح قيد التشغيل بالفعل.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تعمل ملفات التعريف المحلية المُدارة في وضع headless تلقائيًا ما لم يطلب `OPENCLAW_BROWSER_HEADLESS=0` أو `browser.headless=false` أو `browser.profiles.<name>.headless=false` صراحةً متصفحًا مرئيًا.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عند وجود `plugins.allow`، يجب إدراج Plugin المتصفح المضمن صراحةً:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لن يؤدي `browser.enabled=true` إلى استعادة الأمر الفرعي CLI إذا كانت قائمة السماح الخاصة بـ Plugin تستبعد `browser`.

ذو صلة: [أداة المتصفح](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات الشخصية

الملفات الشخصية هي إعدادات توجيه متصفح مسماة. عمليًا:

- `openclaw`: يشغّل أو يتصل بنسخة Chrome مخصصة يديرها OpenClaw (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجل الدخول فيها عبر Chrome DevTools MCP.
- ملفات تعريف CDP مخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدم ملف تعريف محددًا:

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

تعيد `tabs` أولًا `suggestedTargetId`، ثم `tabId` الثابت مثل `t1`، ثم التسمية الاختيارية، ثم `targetId` الخام. ينبغي للوكلاء تمرير `suggestedTargetId` مرة أخرى إلى `focus` و`close` واللقطات والإجراءات. يمكنك تعيين تسمية باستخدام `open --label` أو `tab new --label` أو `tab label`؛ كما تُقبل التسميات ومعرّفات علامات التبويب ومعرّفات الهدف الخام وبادئات معرّفات الهدف الفريدة جميعًا.
عندما يستبدل Chromium الهدف الخام الأساسي أثناء عملية تنقل أو إرسال نموذج، يحتفظ OpenClaw بالـ `tabId`/التسمية الثابتة مرتبطة بعلامة التبويب البديلة عندما يستطيع إثبات التطابق. تظل معرّفات الهدف الخام متقلبة؛ لذا يُفضَّل `suggestedTargetId`.

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

- `--full-page` مخصص لالتقاط الصفحة فقط؛ ولا يمكن دمجه مع `--ref` أو `--element`.
- تدعم ملفات التعريف `existing-session` / `user` لقطات شاشة الصفحة ولقطات الشاشة باستخدام `--ref` من مخرجات اللقطة، لكنها لا تدعم لقطات الشاشة باستخدام CSS `--element`.
- يضيف `--labels` تراكبًا لمراجع اللقطة الحالية على لقطة الشاشة.
- يضيف `snapshot --urls` وجهات الروابط المكتشفة إلى لقطات AI حتى يتمكن الوكلاء من اختيار أهداف تنقل مباشرة بدلًا من التخمين اعتمادًا على نص الرابط فقط.

التنقل/النقر/الكتابة (أتمتة واجهة مستخدم قائمة على المرجع):

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

تعيد استجابات الإجراءات `targetId` الخام الحالي بعد استبدال الصفحة الناتج عن الإجراء عندما يستطيع OpenClaw إثبات علامة التبويب البديلة. ومع ذلك، ينبغي للبرامج النصية تخزين وتمرير `suggestedTargetId`/التسميات لسير العمل طويل الأمد.

مساعدات الملفات ومربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

تحفظ ملفات تعريف Chrome المُدارة التنزيلات العادية الناتجة عن النقر داخل دليل تنزيلات OpenClaw (`/tmp/openclaw/downloads` افتراضيًا، أو جذر temp المهيأ). استخدم `waitfordownload` أو `download` عندما يحتاج الوكيل إلى انتظار ملف محدد وإرجاع مساره؛ إذ تمتلك أدوات الانتظار الصريحة هذه التنزيل التالي.

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

## Chrome الحالي عبر MCP

استخدم ملف التعريف المضمن `user`، أو أنشئ ملف تعريف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

هذا المسار خاص بالمضيف فقط. بالنسبة إلى Docker أو الخوادم headless أو Browserless أو الإعدادات البعيدة الأخرى، استخدم بدلًا من ذلك ملف تعريف CDP.

القيود الحالية لـ existing-session:

- تستخدم الإجراءات المعتمدة على اللقطة مراجع refs، وليس محددات CSS
- يدعم `browser.actionTimeoutMs` الطلبات `act` الافتراضية إلى 60000 ms عندما يحذف المستدعون `timeoutMs`؛ ولا تزال قيمة `timeoutMs` لكل استدعاء هي التي تُرجَّح.
- `click` يدعم النقر الأيسر فقط
- `type` لا يدعم `slowly=true`
- `press` لا يدعم `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate` تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- `wait --load networkidle` غير مدعوم
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم CSS
  `--element`، وتدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم hooks مربعات الحوار `--timeout`
- تدعم لقطات الشاشة التقاط الصفحة و`--ref`، لكن ليس CSS `--element`
- لا تزال `responsebody` واعتراض التنزيلات وتصدير PDF والإجراءات الدفعية
  تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا

## التحكم البعيد في المتصفح (وكيل node host)

إذا كان Gateway يعمل على جهاز مختلف عن المتصفح، فشغّل **node host** على الجهاز الذي يحتوي على Chrome أو Brave أو Edge أو Chromium. سيقوم Gateway بتمرير إجراءات المتصفح عبر ذلك Node (ولا حاجة إلى خادم منفصل للتحكم في المتصفح).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي واستخدم `gateway.nodes.browser.node` لتثبيت Node محدد إذا كان هناك عدة عقد متصلة.

الأمان والإعداد البعيد: [أداة المتصفح](/ar/tools/browser)، [الوصول البعيد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [المتصفح](/ar/tools/browser)

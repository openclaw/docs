---
read_when:
    - تستخدم `openclaw browser` وتريد أمثلة لمهام شائعة
    - تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف Node
    - تريد الاتصال بمتصفح Chrome المحلي الذي سجلت الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، الملفات الشخصية، علامات التبويب، الإجراءات، الحالة، وتصحيح الأخطاء)
title: المتصفح
x-i18n:
    generated_at: "2026-06-27T17:20:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

إدارة سطح التحكم في المتصفح في OpenClaw وتشغيل إجراءات المتصفح (دورة الحياة، الملفات التعريفية، علامات التبويب، اللقطات، لقطات الشاشة، التنقل، الإدخال، محاكاة الحالة، وتصحيح الأخطاء).

ذات صلة:

- أداة المتصفح + API: [أداة المتصفح](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL لـ WebSocket في Gateway (يستخدم الإعدادات افتراضياً).
- `--token <token>`: رمز Gateway (إذا كان مطلوباً).
- `--timeout <ms>`: مهلة الطلب (ms).
- `--expect-final`: الانتظار لاستجابة Gateway نهائية.
- `--browser-profile <name>`: اختيار ملف تعريفي للمتصفح (الافتراضي من الإعدادات).
- `--json`: إخراج قابل للقراءة آلياً (حيثما يكون مدعوماً).

## البدء السريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

يمكن للوكلاء تشغيل فحص الجاهزية نفسه باستخدام `browser({ action: "doctor" })`.

## استكشاف الأخطاء سريعاً

إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولاً. إذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فإن مستوى التحكم في المتصفح سليم ويكون الفشل عادةً بسبب سياسة SSRF للتنقل.

الحد الأدنى من التسلسل:

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

- يضيف `doctor --deep` فحص لقطة حي. يكون مفيداً عندما تكون جاهزية CDP
  الأساسية خضراء لكنك تريد دليلاً على أن علامة التبويب الحالية قابلة للفحص.
- بالنسبة إلى ملفات `attachOnly` وملفات CDP البعيدة، يغلق `openclaw browser stop`
  جلسة التحكم النشطة ويمسح تجاوزات المحاكاة المؤقتة حتى عندما
  لا يكون OpenClaw قد شغّل عملية المتصفح بنفسه.
- بالنسبة إلى الملفات التعريفية المحلية المُدارة، يوقف `openclaw browser stop` عملية المتصفح
  التي تم إنشاؤها.
- يطبّق `openclaw browser start --headless` على طلب البدء هذا فقط و
  فقط عندما يشغّل OpenClaw متصفحاً محلياً مُداراً. لا يعيد كتابة
  `browser.headless` أو إعدادات الملف التعريفي، ولا يفعل شيئاً لمتصفح يعمل بالفعل.
- على مضيفي Linux من دون `DISPLAY` أو `WAYLAND_DISPLAY`، تعمل الملفات التعريفية المحلية المُدارة
  بوضع headless تلقائياً ما لم يطلب `OPENCLAW_BROWSER_HEADLESS=0` أو
  `browser.headless=false` أو `browser.profiles.<name>.headless=false`
  متصفحاً مرئياً صراحةً.

## إذا كان الأمر مفقوداً

إذا كان `openclaw browser` أمراً غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عندما يكون `plugins.allow` موجوداً، أدرج Plugin المتصفح المضمّن صراحةً
ما لم تكن الإعدادات تحتوي بالفعل على كتلة `browser` جذرية:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

كتلة `browser` جذرية صريحة، مثل `browser.enabled=true` أو
`browser.profiles.<name>`، تنشّط أيضاً Plugin المتصفح المضمّن ضمن
قائمة سماح Plugins مقيّدة.

ذات صلة: [أداة المتصفح](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات التعريفية

الملفات التعريفية هي إعدادات توجيه متصفح مسماة. عملياً:

- `openclaw`: يشغّل مثيل Chrome مخصصاً تديره OpenClaw أو يتصل به (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجَّل دخولك إليها عبر Chrome DevTools MCP.
- ملفات CDP التعريفية المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدام ملف تعريفي محدد:

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

يعيد `tabs` أولاً `suggestedTargetId`، ثم `tabId` المستقر مثل `t1`،
والتسمية الاختيارية، و`targetId` الخام. يجب على الوكلاء تمرير
`suggestedTargetId` مرة أخرى إلى `focus` و`close` واللقطات والإجراءات. يمكنك
تعيين تسمية باستخدام `open --label` أو `tab new --label` أو `tab label`؛ وتُقبل التسميات
ومعرّفات علامات التبويب ومعرّفات الأهداف الخام وبادئات target-id الفريدة كلها.
لا يزال حقل الطلب مسمى `targetId` للتوافق، لكنه يقبل
مراجع علامات التبويب هذه. تعامل مع معرّفات الأهداف الخام كمقابض تشخيصية، لا كذاكرة
وكيل دائمة.
عندما يستبدل Chromium الهدف الخام الأساسي أثناء تنقل أو إرسال نموذج،
تبقي OpenClaw `tabId`/التسمية المستقرة مرتبطة بعلامة التبويب البديلة
عندما تستطيع إثبات التطابق. تبقى معرّفات الأهداف الخام متقلبة؛ فضّل
`suggestedTargetId`.

## اللقطة / لقطة الشاشة / الإجراءات

لقطة:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

لقطة شاشة:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

ملاحظات:

- `--full-page` مخصص لالتقاط الصفحات فقط؛ لا يمكن دمجه مع `--ref`
  أو `--element`.
- تدعم ملفات `existing-session` / `user` التعريفية لقطات شاشة للصفحة ولقطات شاشة `--ref`
  من إخراج اللقطة، لكنها لا تدعم لقطات شاشة CSS `--element`.
- يضيف `--labels` طبقة تراكب لمراجع اللقطة الحالية على لقطة الشاشة. في
  الملفات التعريفية المدعومة بـ Playwright، يعمل مع `--full-page` (طبقة تسمية
  لكامل الصفحة)، و`--ref` (طبقة تسمية لقص عنصر حسب مرجع ARIA)، و`--element`
  (طبقة تسمية لقص عنصر حسب محدد CSS)؛ في أوضاع قص العناصر، تُسقط التسميات
  نسبياً إلى العنصر. تتضمن الاستجابة أيضاً مصفوفة
  `annotations` تحتوي على مربع الإحاطة لكل مرجع. يحتوي كل عنصر على `ref`،
  و`number`، و`role`، و`name` اختياري، و`box: {x, y, width, height}`؛
  تكون الإحداثيات في مساحة الصورة الملتقطة (منفذ العرض / الصفحة الكاملة /
  نسبية إلى العنصر). يُحذف الحقل عندما يكون فارغاً.
  تعرض ملفات `existing-session` التعريفية طبقة تراكب chrome-mcp على لقطات شاشة الصفحة
  لكنها لا تستخدم مساعد إسقاط Playwright ولا تتضمن
  `annotations`؛ لقطات شاشة CSS `--element` غير مدعومة هناك. من دون
  Playwright أو chrome-mcp، لا تتوفر لقطات الشاشة ذات التسميات. كانت الإصدارات
  السابقة تتجاهل `--full-page` و`--ref` و`--element` في لقطات شاشة Playwright
  ذات التسميات وتعيد دائماً التقاطاً لمنفذ العرض؛ أصبحت لقطات الشاشة ذات التسميات
  الآن تحترم تلك النطاقات.
- يضيف `snapshot --urls` وجهات الروابط المكتشفة إلى لقطات AI بحيث
  يستطيع الوكلاء اختيار أهداف تنقل مباشرة بدلاً من التخمين من نص الرابط
  وحده.

التنقل/النقر/الكتابة (أتمتة واجهة المستخدم المستندة إلى المرجع):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

يقبل `evaluate --fn` مصدر دالة، أو تعبيراً، أو جسم عبارة.
تُغلّف أجسام العبارات كدوال async، لذا استخدم `return` للقيمة
التي تريد إرجاعها. استخدم `evaluate --timeout-ms <ms>` عندما قد تحتاج الدالة
على جانب الصفحة إلى وقت أطول من مهلة evaluate الافتراضية.

تعيد استجابات الإجراءات `targetId` الخام الحالي بعد استبدال الصفحة
المشغّل بالإجراء عندما تستطيع OpenClaw إثبات علامة التبويب البديلة. ينبغي للسكربتات مع ذلك
تخزين وتمرير `suggestedTargetId`/التسميات لسير العمل طويل الأمد.

مساعدات الملفات + مربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

تحفظ ملفات Chrome التعريفية المُدارة التنزيلات العادية الناتجة عن النقر في دليل
تنزيلات OpenClaw (`/tmp/openclaw/downloads` افتراضياً، أو جذر temp
المُعد). استخدم `waitfordownload` أو `download` عندما يحتاج الوكيل إلى انتظار
ملف محدد وإرجاع مساره؛ تمتلك أدوات الانتظار الصريحة هذه التنزيل التالي.
تقبل عمليات الرفع الملفات من جذر الرفع المؤقت في OpenClaw والوسائط الواردة
المُدارة من OpenClaw، بما في ذلك مراجع `media://inbound/<id>` و
`media/inbound/<id>` النسبية إلى sandbox. تظل مراجع الوسائط المتداخلة، واجتياز المسارات، والمسارات المحلية
العشوائية مرفوضة.
عندما يفتح إجراء مربع حوار modal، تعيد استجابة الإجراء
`blockedByDialog` مع `browserState.dialogs.pending`؛ مرر `--dialog-id` للإجابة
عنه مباشرة. تظهر مربعات الحوار التي تمت معالجتها خارج OpenClaw ضمن
`browserState.dialogs.recent`.

## الحالة والتخزين

منفذ العرض + المحاكاة:

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

استخدم الملف التعريفي المدمج `user`، أو أنشئ ملف `existing-session` تعريفي خاصاً بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

مسار existing-session الافتراضي هو اتصال Chrome MCP تلقائي خاص بالمضيف فقط. إذا كان المتصفح
يعمل بالفعل مع نقطة نهاية DevTools، فمرر `--cdp-url` لكي يتصل Chrome MCP بتلك النقطة بدلاً من ذلك.
بالنسبة إلى Docker أو Browserless أو إعدادات بعيدة أخرى حيث لا تكون دلالات Chrome MCP مطلوبة، استخدم
ملف CDP تعريفي.

حدود existing-session الحالية:

- تستخدم الإجراءات المعتمدة على اللقطات المراجع، وليس محددات CSS
- يضبط `browser.actionTimeoutMs` طلبات `act` المدعومة افتراضيًا على 60000 مللي ثانية عندما
  يحذف المستدعون `timeoutMs`؛ وتظل قيمة `timeoutMs` لكل استدعاء هي الغالبة.
- `click` للنقر بالزر الأيسر فقط
- لا يدعم `type` الخيار `slowly=true`
- لا يدعم `press` الخيار `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate`
  تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- لا يُدعم `wait --load networkidle` في ملفات تعريف الجلسات الحالية (يعمل على CDP المُدار والخام/البعيد)
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم CSS
  `--element`، وتدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم خطاطيف مربعات الحوار `--timeout`
- تدعم لقطات الشاشة التقاط الصفحة و`--ref`، ولكن لا تدعم CSS `--element`
- لا تزال `responsebody`، واعتراض التنزيلات، وتصدير PDF، والإجراءات الدفعية
  تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا

## التحكم في المتصفح عن بُعد (وكيل مضيف node)

إذا كان Gateway يعمل على جهاز مختلف عن المتصفح، فشغّل **مضيف node** على الجهاز الذي يحتوي على Chrome/Brave/Edge/Chromium. سيقوم Gateway بتمرير إجراءات المتصفح عبر وكيل إلى تلك العقدة (لا يلزم خادم منفصل للتحكم في المتصفح).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي، و`gateway.nodes.browser.node` لتثبيت عقدة محددة إذا كانت هناك عدة عقد متصلة.

الأمان + الإعداد عن بُعد: [أداة المتصفح](/ar/tools/browser)، [الوصول عن بُعد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [المتصفح](/ar/tools/browser)

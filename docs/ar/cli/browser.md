---
read_when:
    - تستخدم `openclaw browser` وتريد أمثلة على المهام الشائعة
    - تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف Node
    - تريد الاتصال بمتصفح Chrome المحلي الذي سجّلت الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، والملفات الشخصية، وعلامات التبويب، والإجراءات، والحالة، وتصحيح الأخطاء)
title: المتصفح
x-i18n:
    generated_at: "2026-07-16T13:35:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

أدِر سطح التحكم في متصفح OpenClaw ونفّذ إجراءات المتصفح: دورة الحياة، والملفات الشخصية، وعلامات التبويب، واللقطات، ولقطات الشاشة، والتنقل، والإدخال، ومحاكاة الحالة، وتصحيح الأخطاء.

ذو صلة: [أداة المتصفح](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL لـ WebSocket الخاص بـ Gateway (الإعداد الافتراضي من التهيئة).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--timeout <ms>`: مهلة الطلب بالمللي ثانية (الإعداد الافتراضي: `30000`).
- `--expect-final`: الانتظار لاستجابة نهائية من Gateway.
- `--browser-profile <name>`: اختيار ملف شخصي للمتصفح (الإعداد الافتراضي: `openclaw`، أو `browser.defaultProfile`).
- `--json`: إخراج قابل للقراءة آليًا (حيثما يكون مدعومًا). هذا خيار على مستوى المتصفح، لذا
  ضعه قبل الأمر الفرعي للحصول على صيغة واضحة لا لبس فيها، مثل
  `openclaw browser --json status`. ويعمل أيضًا وضعه في النهاية، مثل
  `openclaw browser status --json`، عندما لا يعرّف الأمر الفرعي المحدد
  `--json` خاصًا به.

## بدء سريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

يمكن للوكلاء إجراء فحص الجاهزية نفسه باستخدام `browser({ action: "doctor" })`.

## استكشاف سريع للأخطاء وإصلاحها

إذا فشل `start` مع `not reachable after start`، فابدأ باستكشاف جاهزية CDP وإصلاحها. إذا نجح `start` و`tabs` ولكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح سليم وأن الفشل غالبًا ما يكون حظرًا من سياسة SSRF الخاصة بالتنقل.

الحد الأدنى من الخطوات:

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

- `doctor --deep` يضيف مسبار لقطة مباشرًا: وهو مفيد عندما تكون جاهزية CDP الأساسية سليمة، لكنك تريد إثباتًا على إمكانية فحص علامة التبويب الحالية.
- بالنسبة إلى ملف شخصي محلي مُدار وقيد التشغيل، يعرض `status` و`doctor` تشخيصات
  الرسومات المخزنة مؤقتًا من Chrome: تصنيف العتاد/البرمجيات، والمصيّر،
  والواجهة الخلفية، والجهاز/برنامج التشغيل، وتفاصيل الميزات وحالات تعطيلها، وإمكانات
  الفيديو المسرّع. يعيد `openclaw browser --json status` الحمولة المنظمة الكاملة.
  لا تُشغّل الحالة السلبية Chrome لمجرد جمع هذه المعلومات.
- `stop` يغلق جلسة التحكم النشطة ويمسح تجاوزات المحاكاة المؤقتة حتى لملفات `attachOnly` وملفات CDP الشخصية البعيدة التي لم يشغّل فيها OpenClaw عملية المتصفح بنفسه. بالنسبة إلى الملفات الشخصية المحلية المُدارة، يوقف `stop` أيضًا عملية المتصفح التي جرى تشغيلها.
- `start --headless` ينطبق فقط على طلب البدء ذاك، وفقط عندما يشغّل OpenClaw متصفحًا محليًا مُدارًا. ولا يعيد كتابة `browser.headless` أو تهيئة الملف الشخصي، ولا يكون له أي تأثير على متصفح قيد التشغيل بالفعل.
- على مضيفات Linux التي لا تحتوي على `DISPLAY` أو `WAYLAND_DISPLAY`، تعمل الملفات الشخصية المحلية المُدارة تلقائيًا دون واجهة رسومية ما لم يطلب `OPENCLAW_BROWSER_HEADLESS=0` أو `browser.headless=false` أو `browser.profiles.<name>.headless=false` صراحةً متصفحًا مرئيًا.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في `~/.openclaw/openclaw.json`. عند وجود `plugins.allow`، أدرج Plugin المتصفح المضمّن صراحةً ما لم تتضمن التهيئة بالفعل كتلة `browser` جذرية:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

تؤدي كتلة `browser` الجذرية الصريحة (مثل `browser.enabled=true` أو `browser.profiles.<name>`) أيضًا إلى تنشيط Plugin المتصفح المضمّن ضمن قائمة سماح مقيّدة للـ Plugin.

ذو صلة: [أداة المتصفح](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات الشخصية

الملفات الشخصية هي تهيئات مسماة لتوجيه المتصفح:

- `openclaw` (الإعداد الافتراضي): يشغّل نسخة Chrome مخصصة يديرها OpenClaw أو يتصل بها (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية التي سجّلت الدخول إليها عبر Chrome DevTools MCP.
- ملفات CDP الشخصية المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استخدم ملفًا شخصيًا محددًا عبر `--browser-profile <name>` مع أي أمر فرعي، مثل `openclaw browser --browser-profile work tabs`.

على macOS، يسرد `system-profiles` ملفات Chrome أو Brave أو Edge أو Chromium الفعلية المتاحة على المضيف. يفك `import-profile` تشفير ملفات تعريف الارتباط الخاصة بها بعد مطالبة واحدة بالموافقة عبر macOS Keychain/Touch ID، ثم يحقنها في ملف شخصي جديد يديره OpenClaw. وهو يستورد ملفات تعريف الارتباط فقط؛ ولا تتغير مساحة التخزين المحلية وIndexedDB. تستخدم بعض جلسات Google بيانات اعتماد جلسة مرتبطة بالجهاز (DBSC)، وقد تظل تتطلب إعادة المصادقة بعد الاستيراد.

عندما يستخدم تطبيق macOS بوابة Gateway محلية، يمكنه عرض هذا الاستيراد مرة واحدة وجعل الملف الشخصي المعزول المستورد هو الإعداد الافتراضي لتصفح الوكيل. يتطلب الاستيراد دائمًا نقرة صريحة؛ ويؤدي نجاح الاستيراد أو رفضه إلى منع المطالبات التلقائية اللاحقة، ويظل **Settings → General → Browser login** متاحًا لإعادة الاستيراد.

يكون استيراد الملف الشخصي للنظام مفعّلًا افتراضيًا. اضبط `browser.allowSystemProfileImport=false` لتعطيل عمليات الاستيراد التي تبدأ عبر CLI أو الوكيل. يكون الاستيراد محليًا على المضيف ولا يمكن تشغيله عبر وكيل Node الخاص بالمتصفح.

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

يعيد `tabs` أولًا `suggestedTargetId`، ثم `tabId` المستقر (مثل `t1`)، والتسمية الاختيارية، و`targetId` الخام. مرّر `suggestedTargetId` مرة أخرى إلى `focus` و`close` واللقطات والإجراءات. عيّن تسمية باستخدام `open --label` أو `tab new --label` أو `tab label`؛ إذ تُقبل جميع التسمية ومعرّفات علامات التبويب ومعرّفات الأهداف الخام والبادئات الفريدة لمعرّفات الأهداف. لا يزال حقل الطلب يحمل الاسم `targetId` للتوافق، لكنه يقبل أيًا من مراجع علامات التبويب هذه.

معرّفات الأهداف الخام مقابض تشخيصية متقلبة وليست ذاكرة دائمة للوكيل: عندما يستبدل Chromium الهدف الخام الأساسي أثناء التنقل أو إرسال نموذج، يُبقي OpenClaw ‏`tabId`/التسمية المستقرة مرتبطة بعلامة التبويب البديلة عندما يمكنه إثبات التطابق. يُفضّل استخدام `suggestedTargetId`.

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

- `--full-page` مخصص لالتقاط الصفحات فقط؛ ولا يمكن دمجه مع `--ref` أو `--element`.
- تدعم ملفات `existing-session` / `user` الشخصية لقطات شاشة الصفحات ولقطات شاشة `--ref` من إخراج اللقطة، لكنها لا تدعم لقطات شاشة `--element` في CSS.
- `--labels` يضع مراجع اللقطة الحالية فوق لقطة الشاشة. في الملفات الشخصية المدعومة بواسطة Playwright، يعمل مع `--full-page` (تراكب كامل الصفحة)، و`--ref` (تراكب مقتطع للعنصر حسب مرجع ARIA)، و`--element` (تراكب مقتطع للعنصر حسب محدد CSS)؛ وفي أوضاع اقتطاع العنصر، تُسقط التسميات نسبةً إلى العنصر. تتضمن الاستجابة أيضًا مصفوفة `annotations` (تُحذف عندما تكون فارغة) تحتوي على المربع المحيط بكل مرجع: `ref` و`number` و`role` و`name` الاختياري و`box: {x, y, width, height}` في فضاء إحداثيات الصورة الملتقطة (إطار العرض / الصفحة الكاملة / نسبةً إلى العنصر).
  تعرض ملفات `existing-session` الشخصية تراكب chrome-mcp على لقطات شاشة الصفحة، لكنها لا تستخدم مساعد الإسقاط في Playwright ولا تتضمن `annotations`؛ ولا تدعم هناك لقطات شاشة `--element` في CSS. لا تتوفر لقطات الشاشة ذات التسميات من دون Playwright أو chrome-mcp.
- `snapshot --urls` يلحق وجهات الروابط المكتشفة بلقطات الذكاء الاصطناعي حتى يتمكن الوكلاء من اختيار أهداف تنقل مباشرة بدلًا من التخمين اعتمادًا على نص الرابط وحده.

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

يقبل `evaluate --fn` مصدر دالة أو تعبيرًا أو نص مجموعة عبارات. تُغلّف مجموعات العبارات كدوال غير متزامنة، لذا استخدم `return` للقيمة التي تريد إعادتها. استخدم `--timeout-ms` عندما تحتاج الدالة من جانب الصفحة إلى وقت أطول من مهلة التقييم الافتراضية. يعطّل `browser.evaluateEnabled=false` (الإعداد الافتراضي: `true`) كلًا من `evaluate` و`wait --fn`.

تعيد استجابات الإجراءات `targetId` الخام الحالي بعد استبدال الصفحة الناتج عن الإجراء عندما يستطيع OpenClaw إثبات علامة التبويب البديلة. مع ذلك، ينبغي للنصوص البرمجية تخزين وتمرير `suggestedTargetId`/التسميات لسير العمل طويل الأمد.

مساعدات الملفات ومربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

تحفظ ملفات Chrome الشخصية المُدارة التنزيلات العادية الناتجة عن النقر في دليل تنزيلات OpenClaw (‏`/tmp/openclaw/downloads` افتراضيًا، أو جذر الملفات المؤقتة المهيأ). استخدم `waitfordownload` أو `download` عندما يحتاج الوكيل إلى انتظار ملف محدد وإعادة مساره؛ إذ تمتلك أدوات الانتظار الصريحة هذه التنزيل التالي. تقبل عمليات الرفع الملفات من جذر عمليات الرفع المؤقتة في OpenClaw والوسائط الواردة التي يديرها OpenClaw، بما في ذلك مراجع `media://inbound/<id>` و`media/inbound/<id>` النسبية إلى بيئة الحماية. تُرفض مراجع الوسائط المتداخلة واجتياز المسارات والمسارات المحلية الاعتباطية.

عندما يفتح إجراء مربع حوار نمطيًا، تعيد استجابة الإجراء `blockedByDialog` مع `browserState.dialogs.pending`؛ مرّر `--dialog-id` للرد عليه مباشرةً. تظهر مربعات الحوار التي عولجت خارج OpenClaw ضمن `browserState.dialogs.recent`.

## الحالة والتخزين

إطار العرض والمحاكاة:

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

استخدم ملف التعريف المضمّن `user`، أو أنشئ ملف تعريف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

مسار الجلسة الحالية الافتراضي مخصص للاتصال التلقائي بـ Chrome MCP على المضيف فقط. إذا كان المتصفح قيد التشغيل بالفعل مع نقطة نهاية DevTools، فمرّر `--cdp-url` كي يتصل Chrome MCP بنقطة النهاية تلك بدلًا من ذلك. بالنسبة إلى Docker أو Browserless أو إعدادات بعيدة أخرى لا تحتاج إلى دلالات Chrome MCP، استخدم ملف تعريف CDP بدلًا من ذلك.

القيود الحالية للجلسة الحالية:

- تستخدم الإجراءات المعتمدة على اللقطات المراجع، لا محددات CSS.
- `browser.actionTimeoutMs` يعيّن الطلبات المدعومة `act` افتراضيًا إلى 60000 ms عندما يحذف المستدعون `timeoutMs`؛ وتظل قيمة `timeoutMs` لكل استدعاء هي ذات الأولوية.
- `click` يدعم النقر بزر الفأرة الأيسر فقط.
- `type` لا يدعم `slowly=true`.
- `press` لا يدعم `delayMs`.
- `hover` و`scrollintoview` و`drag` و`select` و`fill` ترفض تجاوزات المهلة لكل استدعاء؛ ويقبل `evaluate` القيمة `--timeout-ms`.
- `select` يدعم قيمة واحدة فقط.
- `wait --load networkidle` غير مدعوم (يعمل مع ملفات تعريف CDP المُدارة والخام/البعيدة).
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم `--element` في CSS، وتدعم ملفًا واحدًا في كل مرة.
- لا تدعم خطافات مربعات الحوار `--timeout`.
- تدعم لقطات الشاشة التقاط الصفحة و`--ref`، لكن ليس `--element` في CSS.
- لا تزال `responsebody` واعتراض التنزيل وتصدير PDF والإجراءات المجمّعة تتطلب متصفحًا مُدارًا أو ملف تعريف CDP خامًا.

## التحكم في المتصفح عن بُعد (وكيل مضيف Node)

إذا كان Gateway يعمل على جهاز مختلف عن المتصفح، فشغّل **مضيف Node** على الجهاز الذي يحتوي على Chrome/Brave/Edge/Chromium. يمرّر Gateway إجراءات المتصفح بالوكالة إلى مضيف Node هذا؛ ولا يلزم خادم منفصل للتحكم في المتصفح.

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي و`gateway.nodes.browser.node` لتثبيت مضيف Node محدد إذا كانت عدة مضيفات متصلة.

الأمان + الإعداد عن بُعد: [أداة المتصفح](/ar/tools/browser)، [الوصول عن بُعد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [المتصفح](/ar/tools/browser)

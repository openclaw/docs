---
read_when:
    - أنت تستخدم `openclaw browser` وتريد أمثلة على المهام الشائعة
    - تريد التحكم في متصفح يعمل على جهاز آخر عبر مضيف Node
    - تريد الاتصال بمتصفح Chrome المحلي المسجّل الدخول إليه عبر Chrome MCP
summary: مرجع CLI لـ `openclaw browser` (دورة الحياة، والملفات الشخصية، وعلامات التبويب، والإجراءات، والحالة، وتصحيح الأخطاء)
title: المتصفح
x-i18n:
    generated_at: "2026-04-24T07:33:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

أدِر سطح التحكم في المتصفح الخاص بـ OpenClaw وشغّل إجراءات المتصفح (دورة الحياة، والملفات الشخصية، وعلامات التبويب، واللقطات، ولقطات الشاشة، والتنقل، والإدخال، ومحاكاة الحالة، وتصحيح الأخطاء).

ذو صلة:

- أداة المتصفح + API: [أداة المتصفح](/ar/tools/browser)

## العلامات الشائعة

- `--url <gatewayWsUrl>`: عنوان URL لـ WebSocket الخاص بـ Gateway (الافتراضي من الإعدادات).
- `--token <token>`: رمز Gateway (إذا كان مطلوبًا).
- `--timeout <ms>`: مهلة الطلب (بالملي ثانية).
- `--expect-final`: انتظر استجابة Gateway نهائية.
- `--browser-profile <name>`: اختر ملفًا شخصيًا للمتصفح (الافتراضي من الإعدادات).
- `--json`: مخرجات قابلة للقراءة آليًا (حيثما كان ذلك مدعومًا).

## بدء سريع (محلي)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## استكشاف سريع للأخطاء وإصلاحها

إذا فشل `start` مع `not reachable after start`، فاستكشف جاهزية CDP أولًا. وإذا نجح `start` و`tabs` لكن فشل `open` أو `navigate`، فهذا يعني أن مستوى التحكم في المتصفح سليم، وعادةً ما يكون الفشل بسبب سياسة SSRF الخاصة بالتنقل.

تسلسل حدّي أدنى:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

إرشادات تفصيلية: [استكشاف أخطاء المتصفح وإصلاحها](/ar/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## دورة الحياة

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

ملاحظات:

- بالنسبة إلى ملفات `attachOnly` وملفات CDP البعيدة، فإن `openclaw browser stop` يغلق
  جلسة التحكم النشطة ويمسح تجاوزات المحاكاة المؤقتة حتى عندما
  لا يكون OpenClaw قد شغّل عملية المتصفح بنفسه.
- بالنسبة إلى الملفات المحلية المُدارة، فإن `openclaw browser stop` يوقف عملية
  المتصفح التي تم تشغيلها.

## إذا كان الأمر مفقودًا

إذا كان `openclaw browser` أمرًا غير معروف، فتحقق من `plugins.allow` في
`~/.openclaw/openclaw.json`.

عندما تكون `plugins.allow` موجودة، يجب إدراج Plugin المتصفح المضمّن
صراحةً:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

لا تؤدي `browser.enabled=true` إلى استعادة الأمر الفرعي في CLI عندما
تستبعد قائمة السماح الخاصة بالـ Plugin القيمة `browser`.

ذو صلة: [أداة المتصفح](/ar/tools/browser#missing-browser-command-or-tool)

## الملفات الشخصية

الملفات الشخصية هي إعدادات توجيه مسماة للمتصفح. عمليًا:

- `openclaw`: يشغّل أو يتصل بمثيل Chrome مخصّص ومدار من OpenClaw (دليل بيانات مستخدم معزول).
- `user`: يتحكم في جلسة Chrome الحالية المسجّل الدخول إليها عبر Chrome DevTools MCP.
- ملفات CDP المخصصة: تشير إلى نقطة نهاية CDP محلية أو بعيدة.

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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## اللقطة / لقطة الشاشة / الإجراءات

لقطة:

```bash
openclaw browser snapshot
```

لقطة شاشة:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

ملاحظات:

- `--full-page` مخصّص فقط لالتقاط الصفحة؛ ولا يمكن دمجه مع `--ref`
  أو `--element`.
- تدعم ملفات `existing-session` / `user` لقطات شاشة الصفحة ولقطات
  `--ref` من مخرجات اللقطة، لكنها لا تدعم لقطات `--element` باستخدام CSS.

التنقل/النقر/الكتابة (أتمتة واجهة المستخدم المعتمدة على ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
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

مساعدات الملفات + مربعات الحوار:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

استخدم ملف `user` المضمّن، أو أنشئ ملف `existing-session` خاصًا بك:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

هذا المسار خاص بالمضيف فقط. أما بالنسبة إلى Docker أو الخوادم عديمة الواجهة أو Browserless أو غيرها من الإعدادات البعيدة، فاستخدم ملف CDP بدلًا من ذلك.

القيود الحالية لـ existing-session:

- تستخدم الإجراءات المعتمدة على اللقطات refs، وليس محددات CSS
- يدعم `click` النقر الأيسر فقط
- لا يدعم `type` الخيار `slowly=true`
- لا يدعم `press` الخيار `delayMs`
- ترفض `hover` و`scrollintoview` و`drag` و`select` و`fill` و`evaluate`
  تجاوزات المهلة لكل استدعاء
- يدعم `select` قيمة واحدة فقط
- لا يتم دعم `wait --load networkidle`
- تتطلب عمليات رفع الملفات `--ref` / `--input-ref`، ولا تدعم
  `--element` الخاص بـ CSS، كما تدعم حاليًا ملفًا واحدًا في كل مرة
- لا تدعم خطافات مربعات الحوار `--timeout`
- تدعم لقطات الشاشة التقاط الصفحة و`--ref`، ولكن ليس `--element` الخاص بـ CSS
- لا تزال `responsebody` واعتراض التنزيل وتصدير PDF والإجراءات الدفعية
  تتطلب متصفحًا مُدارًا أو ملف CDP خامًا

## التحكم في المتصفح عن بُعد (وكيل مضيف Node)

إذا كان Gateway يعمل على جهاز مختلف عن المتصفح، فشغّل **مضيف Node** على الجهاز الذي يحتوي على Chrome/Brave/Edge/Chromium. سيقوم Gateway بتمرير إجراءات المتصفح عبر ذلك node (من دون الحاجة إلى خادم تحكم منفصل للمتصفح).

استخدم `gateway.nodes.browser.mode` للتحكم في التوجيه التلقائي و`gateway.nodes.browser.node` لتثبيت node محدد إذا كان هناك عدة عقد متصلة.

الأمان + الإعداد عن بُعد: [أداة المتصفح](/ar/tools/browser)، [الوصول عن بُعد](/ar/gateway/remote)، [Tailscale](/ar/gateway/tailscale)، [الأمان](/ar/gateway/security)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [المتصفح](/ar/tools/browser)

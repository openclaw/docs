---
read_when:
    - أنت تريد أن يعرض الوكلاء تعديلات الشيفرة أو Markdown على شكل فروق diff
    - أنت تريد عنوان URL جاهزًا لـ canvas أو ملف diff معروضًا بشكل مرئي
    - أنت تحتاج إلى عناصر diff مؤقتة ومضبوطة ذات افتراضيات آمنة
summary: عارض فروق للقراءة فقط وعارض ملفات للوكلاء (أداة Plugin اختيارية)
title: Diffs
x-i18n:
    generated_at: "2026-04-24T08:08:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe32441699b06dd27580b7e80afcfa3d1e466d7e2b74e52e60b327e73325eeca
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` هي أداة Plugin اختيارية تحتوي على إرشاد نظامي قصير مضمّن وSkill مصاحبة تحول محتوى التغييرات إلى عنصر diff للقراءة فقط يمكن للوكلاء استخدامه.

تقبل الأداة أحد الشكلين التاليين:

- النصين `before` و`after`
- أو `patch` موحّدة

ويمكنها أن تعيد:

- عنوان URL لعارض gateway من أجل العرض في canvas
- أو مسار ملف معروض (PNG أو PDF) من أجل تسليم الرسائل
- أو كلا المخرجين في استدعاء واحد

عند التفعيل، تقوم الـ plugin بإضافة إرشاد استخدام مختصر إلى مساحة مطالبة النظام وتكشف أيضًا عن Skill تفصيلية للحالات التي يحتاج فيها الوكيل إلى تعليمات أكثر اكتمالًا.

## البدء السريع

1. فعّل الـ plugin.
2. استدعِ `diffs` باستخدام `mode: "view"` من أجل التدفقات التي تعتمد على canvas أولًا.
3. استدعِ `diffs` باستخدام `mode: "file"` من أجل تدفقات تسليم الملفات في الدردشة.
4. استدعِ `diffs` باستخدام `mode: "both"` عندما تحتاج إلى كلا العنصرين.

## تفعيل الـ plugin

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
      },
    },
  },
}
```

## تعطيل الإرشاد المضمّن في مطالبة النظام

إذا كنت تريد إبقاء أداة `diffs` مفعّلة لكن تعطيل الإرشاد المضمّن الخاص بها في مطالبة النظام، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

يؤدي هذا إلى حظر hook الخاصة بـ `before_prompt_build` في Plugin `diffs` مع الإبقاء على الـ plugin والأداة والـ Skill المصاحبة متاحة.

إذا كنت تريد تعطيل كل من الإرشاد والأداة، فعطّل الـ plugin بدلًا من ذلك.

## تدفق العمل المعتاد للوكيل

1. يستدعي الوكيل `diffs`.
2. يقرأ الوكيل الحقول `details`.
3. ثم يقوم الوكيل بأحد الأمرين:
   - يفتح `details.viewerUrl` باستخدام `canvas present`
   - يرسل `details.filePath` باستخدام `message` عبر `path` أو `filePath`
   - أو يفعل الأمرين معًا

## أمثلة الإدخال

قبل وبعد:

```json
{
  "before": "# Hello\n\nOne",
  "after": "# Hello\n\nTwo",
  "path": "docs/example.md",
  "mode": "view"
}
```

Patch:

```json
{
  "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
  "mode": "both"
}
```

## مرجع إدخال الأداة

جميع الحقول اختيارية ما لم يُذكر غير ذلك:

- `before` (`string`): النص الأصلي. مطلوب مع `after` عند حذف `patch`.
- `after` (`string`): النص المحدَّث. مطلوب مع `before` عند حذف `patch`.
- `patch` (`string`): نص diff موحّد. متنافي مع `before` و`after`.
- `path` (`string`): اسم ملف العرض في وضع before/after.
- `lang` (`string`): تلميح لتجاوز اللغة في وضع before/after. تعود القيم غير المعروفة إلى النص العادي.
- `title` (`string`): تجاوز لعنوان العارض.
- `mode` (`"view" | "file" | "both"`): وضع الخرج. الافتراضي هو القيمة الافتراضية لـ plugin `defaults.mode`.
  الاسم البديل المهمل: `"image"` يتصرف مثل `"file"` وما يزال مقبولًا للتوافق مع الإصدارات السابقة.
- `theme` (`"light" | "dark"`): سمة العارض. الافتراضي هو القيمة الافتراضية لـ plugin `defaults.theme`.
- `layout` (`"unified" | "split"`): تخطيط diff. الافتراضي هو القيمة الافتراضية لـ plugin `defaults.layout`.
- `expandUnchanged` (`boolean`): توسيع المقاطع غير المتغيرة عندما يكون السياق الكامل متاحًا. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا للـ plugin).
- `fileFormat` (`"png" | "pdf"`): تنسيق الملف المعروض. الافتراضي هو القيمة الافتراضية لـ plugin `defaults.fileFormat`.
- `fileQuality` (`"standard" | "hq" | "print"`): إعداد جودة مسبق لعرض PNG أو PDF.
- `fileScale` (`number`): تجاوز لمقياس الجهاز (`1`-`4`).
- `fileMaxWidth` (`number`): أقصى عرض للعرض بوحدة CSS pixels (`640`-`2400`).
- `ttlSeconds` (`number`): مدة TTL للعنصر لكل من العارض ومخرجات الملفات المستقلة بالثواني. الافتراضي 1800، والحد الأقصى 21600.
- `baseUrl` (`string`): تجاوز لأصل عنوان URL الخاص بالعارض. ويتجاوز القيمة `viewerBaseUrl` الخاصة بالـ plugin. يجب أن يكون من نوع `http` أو `https`، ومن دون query/hash.

ما تزال الأسماء البديلة القديمة للإدخال مقبولة للتوافق مع الإصدارات السابقة:

- `format` -> `fileFormat`
- `imageFormat` -> `fileFormat`
- `imageQuality` -> `fileQuality`
- `imageScale` -> `fileScale`
- `imageMaxWidth` -> `fileMaxWidth`

التحقق والحدود:

- الحد الأقصى لكل من `before` و`after` هو 512 KiB.
- الحد الأقصى لـ `patch` هو 2 MiB.
- الحد الأقصى لـ `path` هو 2048 بايت.
- الحد الأقصى لـ `lang` هو 128 بايت.
- الحد الأقصى لـ `title` هو 1024 بايت.
- حد تعقيد patch: حد أقصى 128 ملفًا و120000 سطر إجمالًا.
- يتم رفض `patch` مع `before` أو `after` معًا.
- حدود أمان الملف المعروض (تنطبق على PNG وPDF):
  - `fileQuality: "standard"`: حد أقصى 8 MP (8,000,000 بكسل معروض).
  - `fileQuality: "hq"`: حد أقصى 14 MP (14,000,000 بكسل معروض).
  - `fileQuality: "print"`: حد أقصى 24 MP (24,000,000 بكسل معروض).
  - لدى PDF أيضًا حد أقصى 50 صفحة.

## عقد خرج details

تعيد الأداة بيانات وصفية منظّمة تحت `details`.

الحقول المشتركة للأوضاع التي تنشئ عارضًا:

- `artifactId`
- `viewerUrl`
- `viewerPath`
- `title`
- `expiresAt`
- `inputKind`
- `fileCount`
- `mode`
- `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` عند التوفر)

حقول الملفات عند عرض PNG أو PDF:

- `artifactId`
- `expiresAt`
- `filePath`
- `path` (القيمة نفسها الخاصة بـ `filePath`، من أجل توافق أداة الرسائل)
- `fileBytes`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`

كما يتم إرجاع أسماء بديلة للتوافق مع المستدعين الحاليين:

- `format` (القيمة نفسها الخاصة بـ `fileFormat`)
- `imagePath` (القيمة نفسها الخاصة بـ `filePath`)
- `imageBytes` (القيمة نفسها الخاصة بـ `fileBytes`)
- `imageQuality` (القيمة نفسها الخاصة بـ `fileQuality`)
- `imageScale` (القيمة نفسها الخاصة بـ `fileScale`)
- `imageMaxWidth` (القيمة نفسها الخاصة بـ `fileMaxWidth`)

ملخص سلوك الوضع:

- `mode: "view"`: حقول العارض فقط.
- `mode: "file"`: حقول الملفات فقط، من دون عنصر عارض.
- `mode: "both"`: حقول العارض بالإضافة إلى حقول الملفات. وإذا فشل عرض الملف، فسيظل العارض يُعاد مع `fileError` والاسم البديل المتوافق `imageError`.

## المقاطع غير المتغيرة المطوية

- يمكن للعارض أن يعرض صفوفًا مثل `N unmodified lines`.
- عناصر التحكم الخاصة بالتوسيع في تلك الصفوف شرطية وليست مضمونة لكل نوع إدخال.
- تظهر عناصر التحكم الخاصة بالتوسيع عندما يحتوي diff المعروض على بيانات سياق قابلة للتوسيع، وهذا شائع في إدخال before/after.
- في كثير من مدخلات unified patch، لا تكون أجسام السياق المحذوفة متاحة في hunkات patch المحللة، لذلك قد يظهر الصف من دون عناصر تحكم للتوسيع. وهذا سلوك متوقع.
- لا تنطبق `expandUnchanged` إلا عندما يكون هناك سياق قابل للتوسيع.

## القيم الافتراضية للـ plugin

اضبط القيم الافتراضية العامة للـ plugin في `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

القيم الافتراضية المدعومة:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

تتجاوز معاملات الأداة الصريحة هذه القيم الافتراضية.

إعداد عنوان URL الدائم للعارض:

- `viewerBaseUrl` (`string`, اختياري)
  - بديل احتياطي مملوك للـ plugin من أجل روابط العارض المعادة عندما لا يمرر استدعاء الأداة `baseUrl`.
  - يجب أن يكون `http` أو `https`، ومن دون query/hash.

مثال:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## إعداد الأمان

- `security.allowRemoteViewer` (`boolean`, الافتراضي `false`)
  - `false`: تُرفض الطلبات غير loopback الموجهة إلى مسارات العارض.
  - `true`: يُسمح بالعارضات البعيدة إذا كان المسار المرمّز صالحًا.

مثال:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## دورة حياة العناصر وتخزينها

- تُخزَّن العناصر تحت المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي البيانات الوصفية لعنصر العارض على:
  - معرّف عنصر عشوائي (20 محرفًا سداسيًا)
  - token عشوائية (48 محرفًا سداسيًا)
  - `createdAt` و`expiresAt`
  - مسار `viewer.html` المخزن
- تكون مدة TTL الافتراضية للعنصر 30 دقيقة عند عدم تحديدها.
- أقصى TTL مقبولة للعارض هي 6 ساعات.
- تعمل عملية التنظيف بشكل انتهازي بعد إنشاء العنصر.
- يتم حذف العناصر منتهية الصلاحية.
- تزيل عملية تنظيف fallback المجلدات القديمة الراكدة الأقدم من 24 ساعة عندما تكون البيانات الوصفية مفقودة.

## عنوان URL الخاص بالعارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

يحل مستند العارض هذه الأصول نسبةً إلى عنوان URL الخاص بالعارض، لذلك يتم الحفاظ على بادئة المسار الاختيارية `baseUrl` أيضًا لكل طلبات الأصول.

سلوك إنشاء عنوان URL:

- إذا تم تقديم `baseUrl` في استدعاء الأداة، فسيتم استخدامه بعد تحقق صارم.
- وإلا، إذا كانت قيمة `viewerBaseUrl` الخاصة بالـ plugin مضبوطة، فسيتم استخدامها.
- ومن دون أي تجاوز، يفترض عنوان URL الخاص بالعارض قيمة loopback `127.0.0.1`.
- إذا كان وضع ربط gateway هو `custom` وكانت قيمة `gateway.customBindHost` مضبوطة، فسيتم استخدام ذلك المضيف.

قواعد `baseUrl`:

- يجب أن تكون `http://` أو `https://`.
- يتم رفض query وhash.
- يُسمح بالأصل بالإضافة إلى مسار أساسي اختياري.

## نموذج الأمان

تدعيم العارض:

- loopback فقط افتراضيًا.
- مسارات عارض مضمّنة فيها token مع تحقق صارم من المعرّف وtoken.
- CSP الخاصة باستجابة العارض:
  - `default-src 'none'`
  - السكربتات والأصول من self فقط
  - لا يوجد `connect-src` صادر
- خنق الإخفاقات البعيدة عند تفعيل الوصول البعيد:
  - 40 إخفاقًا لكل 60 ثانية
  - حظر لمدة 60 ثانية (`429 Too Many Requests`)

تدعيم عرض الملفات:

- يكون توجيه طلبات متصفح لقطات الشاشة بنمط الرفض افتراضيًا.
- لا يُسمح إلا بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
- يتم حظر طلبات الشبكة الخارجية.

## متطلبات المتصفح من أجل وضع الملفات

يحتاج `mode: "file"` و`mode: "both"` إلى متصفح متوافق مع Chromium.

ترتيب التحليل:

1. `browser.executablePath` في إعداد OpenClaw.
2. متغيرات البيئة:
   - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
   - `BROWSER_EXECUTABLE_PATH`
   - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
3. بديل اكتشاف أوامر/مسارات المنصة.

نص الإخفاق الشائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome، أو Chromium، أو Edge، أو Brave، أو بتحديد أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

أخطاء التحقق من الإدخال:

- `Provide patch or both before and after text.`
  - ضمّن كلًا من `before` و`after`، أو قدّم `patch`.
- `Provide either patch or before/after input, not both.`
  - لا تخلط بين أوضاع الإدخال.
- `Invalid baseUrl: ...`
  - استخدم أصل `http(s)` مع مسار اختياري، ومن دون query/hash.
- `{field} exceeds maximum size (...)`
  - قلّل حجم الحمولة.
- رفض patch كبيرة
  - قلّل عدد ملفات patch أو إجمالي عدد الأسطر.

مشكلات الوصول إلى العارض:

- يُحل عنوان URL الخاص بالعارض إلى `127.0.0.1` افتراضيًا.
- في سيناريوهات الوصول البعيد، إما:
  - اضبط `viewerBaseUrl` الخاصة بالـ plugin، أو
  - مرّر `baseUrl` لكل استدعاء أداة، أو
  - استخدم `gateway.bind=custom` و`gateway.customBindHost`
- إذا تضمنت `gateway.trustedProxies` قيمة loopback لوجود proxy على المضيف نفسه (مثل Tailscale Serve)، فإن طلبات العارض الخام عبر loopback من دون رؤوس IP عميل مُمرّرة تفشل بشكل مغلق وفق التصميم.
- في هذا النوع من بنية proxy:
  - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج فقط إلى مرفق، أو
  - فعّل عمدًا `security.allowRemoteViewer` واضبط `viewerBaseUrl` الخاصة بالـ plugin أو مرّر `baseUrl` خاصة بـ proxy/public عندما تحتاج إلى عنوان URL قابل للمشاركة للعارض
- فعّل `security.allowRemoteViewer` فقط عندما تقصد الوصول إلى العارض الخارجي.

صف الأسطر غير المعدلة لا يحتوي على زر توسيع:

- يمكن أن يحدث هذا مع إدخال patch عندما لا تحمل patch سياقًا قابلًا للتوسيع.
- هذا سلوك متوقع ولا يشير إلى فشل في العارض.

لم يتم العثور على العنصر:

- انتهت صلاحية العنصر بسبب TTL.
- تغيّرت token أو المسار.
- أزالت عملية التنظيف البيانات القديمة.

## إرشادات تشغيلية

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية داخل canvas.
- فضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطّلًا ما لم يكن نشرُك يتطلب عناوين URL بعيدة للعارض.
- اضبط `ttlSeconds` قصيرة وصريحة للفروق الحساسة.
- تجنب إرسال الأسرار في إدخال diff عندما لا يكون ذلك مطلوبًا.
- إذا كانت قناتك تضغط الصور بشدة (مثل Telegram أو WhatsApp)، ففضّل خرج PDF (`fileFormat: "pdf"`).

محرك عرض diff:

- يعمل بواسطة [Diffs](https://diffs.com).

## مستندات ذات صلة

- [نظرة عامة على الأدوات](/ar/tools)
- [Plugins](/ar/tools/plugin)
- [Browser](/ar/tools/browser)

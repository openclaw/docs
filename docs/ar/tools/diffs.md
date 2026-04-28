---
read_when:
    - تريد أن تعرض الوكلاء تعديلات الكود أو Markdown على شكل فروق
    - تريد عنوان URL لعارض جاهز لـ canvas أو ملف فروق مُصيَّرًا
    - تحتاج إلى عناصر فروق مؤقتة ومضبوطة بإعدادات آمنة افتراضيًا
sidebarTitle: Diffs
summary: عارض فروق للقراءة فقط ومُصيّر ملفات للوكلاء (أداة Plugin اختيارية)
title: الفروق
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:41:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs` هي أداة Plugin اختيارية تحتوي على إرشاد نظامي مضمّن قصير ومهارة مصاحبة تحوّل محتوى التغييرات إلى عنصر فروق للقراءة فقط يمكن للوكلاء استخدامه.

وهي تقبل أحد الخيارين التاليين:

- النص `before` والنص `after`
- أو `patch` موحّد

ويمكنها أن تعيد:

- عنوان URL لعارض Gateway من أجل العرض في canvas
- مسار ملف مُصيَّر (PNG أو PDF) لتسليم الرسائل
- أو كلا المخرجين في استدعاء واحد

عند التفعيل، تضيف Plugin إرشادات استخدام موجزة إلى مساحة موجّه النظام، كما تكشف أيضًا عن مهارة مفصلة للحالات التي يحتاج فيها الوكيل إلى تعليمات أكثر اكتمالًا.

## البدء السريع

<Steps>
  <Step title="تفعيل Plugin">
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
  </Step>
  <Step title="اختيار وضع">
    <Tabs>
      <Tab title="view">
        تدفقات العمل التي تبدأ من canvas: يستدعي الوكلاء `diffs` باستخدام `mode: "view"` ثم يفتحون `details.viewerUrl` بواسطة `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم ملفات المحادثة: يستدعي الوكلاء `diffs` باستخدام `mode: "file"` ثم يرسلون `details.filePath` باستخدام `message` مع `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        وضع مدمج: يستدعي الوكلاء `diffs` باستخدام `mode: "both"` للحصول على كلا العنصرين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل الإرشاد النظامي المضمّن

إذا أردت إبقاء أداة `diffs` مفعلة لكن تعطيل إرشادها المضمّن في موجّه النظام، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

يمنع هذا خطاف `before_prompt_build` الخاص بـ Plugin ‏diffs مع إبقاء Plugin والأداة والمهارة المصاحبة متاحة.

إذا أردت تعطيل الإرشاد والأداة معًا، فعطّل Plugin بدلًا من ذلك.

## سير العمل المعتاد للوكيل

<Steps>
  <Step title="استدعاء diffs">
    يستدعي الوكيل أداة `diffs` مع الإدخال.
  </Step>
  <Step title="قراءة التفاصيل">
    يقرأ الوكيل حقول `details` من الاستجابة.
  </Step>
  <Step title="العرض">
    يفتح الوكيل إما `details.viewerUrl` باستخدام `canvas present`، أو يرسل `details.filePath` باستخدام `message` مع `path` أو `filePath`، أو ينفذ الأمرين معًا.
  </Step>
</Steps>

## أمثلة الإدخال

<Tabs>
  <Tab title="قبل وبعد">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## مرجع مدخلات الأداة

كل الحقول اختيارية ما لم يُذكر خلاف ذلك.

<ParamField path="before" type="string">
  النص الأصلي. مطلوب مع `after` عند حذف `patch`.
</ParamField>
<ParamField path="after" type="string">
  النص المحدّث. مطلوب مع `before` عند حذف `patch`.
</ParamField>
<ParamField path="patch" type="string">
  نص الفروق الموحّد. متنافي مع `before` و`after`.
</ParamField>
<ParamField path="path" type="string">
  اسم الملف المعروض في وضع قبل/بعد.
</ParamField>
<ParamField path="lang" type="string">
  تلميح لتجاوز اللغة في وضع قبل/بعد. تعود القيم غير المعروفة إلى النص العادي.
</ParamField>
<ParamField path="title" type="string">
  تجاوز لعنوان العارض.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  وضع الإخراج. القيمة الافتراضية هي الافتراضي الخاص بـ Plugin عند `defaults.mode`. الاسم البديل المهجور: `"image"` يعمل مثل `"file"` ولا يزال مقبولًا للتوافق مع الإصدارات السابقة.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. القيمة الافتراضية هي الافتراضي الخاص بـ Plugin عند `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط الفروق. القيمة الافتراضية هي الافتراضي الخاص بـ Plugin عند `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  يوسّع المقاطع غير المتغيرة عندما يكون السياق الكامل متاحًا. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا على مستوى Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المُصيَّر. القيمة الافتراضية هي الافتراضي الخاص بـ Plugin عند `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  إعداد جودة مسبق لتصيير PNG أو PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  تجاوز لمقياس الجهاز (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  أقصى عرض للتصيير بوحدة بكسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  مدة بقاء العنصر بالثواني لمخرجات العارض والملفات المستقلة. الحد الأقصى 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL الخاص بالعارض. يتجاوز قيمة Plugin ‏`viewerBaseUrl`. يجب أن يكون `http` أو `https`، من دون query أو hash.
</ParamField>

<AccordionGroup>
  <Accordion title="أسماء الإدخال البديلة القديمة">
    لا تزال مقبولة للتوافق مع الإصدارات السابقة:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="التحقق والحدود">
    - الحد الأقصى لكل من `before` و`after` هو 512 KiB.
    - الحد الأقصى لـ `patch` هو 2 MiB.
    - الحد الأقصى لـ `path` هو 2048 بايت.
    - الحد الأقصى لـ `lang` هو 128 بايت.
    - الحد الأقصى لـ `title` هو 1024 بايت.
    - حد تعقيد Patch: بحد أقصى 128 ملفًا و120000 سطر إجمالًا.
    - يتم رفض الجمع بين `patch` و`before` أو `after`.
    - حدود أمان الملفات المُصيَّرة (تنطبق على PNG وPDF):
      - `fileQuality: "standard"`: حد أقصى 8 MP (8,000,000 بكسل مُصيَّر).
      - `fileQuality: "hq"`: حد أقصى 14 MP (14,000,000 بكسل مُصيَّر).
      - `fileQuality: "print"`: حد أقصى 24 MP (24,000,000 بكسل مُصيَّر).
      - كما أن PDF له حد أقصى يبلغ 50 صفحة.
  </Accordion>
</AccordionGroup>

## عقد تفاصيل الإخراج

تعيد الأداة بيانات تعريف منظمة تحت `details`.

<AccordionGroup>
  <Accordion title="حقول العارض">
    الحقول المشتركة للأوضاع التي تنشئ عارضًا:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId` و`sessionId` و`messageChannel` و`agentAccountId` عند توفرها)

  </Accordion>
  <Accordion title="حقول الملف">
    حقول الملف عند تصيير PNG أو PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (القيمة نفسها الموجودة في `filePath`، للتوافق مع أداة الرسائل)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="الأسماء البديلة للتوافق">
    تُعاد أيضًا للمستدعين الحاليين:

    - `format` (القيمة نفسها الموجودة في `fileFormat`)
    - `imagePath` (القيمة نفسها الموجودة في `filePath`)
    - `imageBytes` (القيمة نفسها الموجودة في `fileBytes`)
    - `imageQuality` (القيمة نفسها الموجودة في `fileQuality`)
    - `imageScale` (القيمة نفسها الموجودة في `fileScale`)
    - `imageMaxWidth` (القيمة نفسها الموجودة في `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

ملخص سلوك الأوضاع:

| الوضع     | ما يتم إرجاعه                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                                                    |
| `"file"` | حقول الملف فقط، من دون عنصر عارض.                                                                                  |
| `"both"` | حقول العارض بالإضافة إلى حقول الملف. وإذا فشل تصيير الملف، يبقى العارض مُعادًا مع `fileError` والاسم البديل `imageError`. |

## المقاطع غير المتغيرة المطوية

- يمكن للعارض أن يعرض صفوفًا مثل `N unmodified lines`.
- عناصر التحكم في التوسيع على هذه الصفوف مشروطة وليست مضمونة لكل أنواع الإدخال.
- تظهر عناصر التحكم في التوسيع عندما تحتوي الفروق المُصيَّرة على بيانات سياق قابلة للتوسيع، وهذا شائع عادةً مع إدخال قبل/بعد.
- في كثير من مدخلات Patch الموحّدة، لا تكون أجسام السياق المحذوفة متاحة في مقاطع Patch المحللة، لذلك قد يظهر الصف من دون عناصر تحكم للتوسيع. وهذا سلوك متوقع.
- ينطبق `expandUnchanged` فقط عندما يكون السياق القابل للتوسيع موجودًا.

## الإعدادات الافتراضية لـ Plugin

اضبط الإعدادات الافتراضية على مستوى Plugin في `~/.openclaw/openclaw.json`:

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

الإعدادات الافتراضية المدعومة:

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

تتجاوز معلمات الأداة الصريحة هذه الإعدادات الافتراضية.

### إعداد عنوان URL الدائم للعارض

<ParamField path="viewerBaseUrl" type="string">
  قيمة احتياطية مملوكة لـ Plugin للروابط المعادة الخاصة بالعارض عندما لا يمرر استدعاء الأداة `baseUrl`. يجب أن يكون `http` أو `https`، من دون query أو hash.
</ParamField>

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

## إعدادات الأمان

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: تُرفض الطلبات غير الموجهة إلى loopback والمسندة إلى مسارات العارض. `true`: يُسمح بالعارضات البعيدة إذا كان المسار المرمّز بالرمز المميز صالحًا.
</ParamField>

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

## دورة حياة العناصر والتخزين

- تُخزَّن العناصر تحت المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي بيانات تعريف عنصر العارض على:
  - معرّف عنصر عشوائي (20 حرف hex)
  - رمز عشوائي (48 حرف hex)
  - `createdAt` و`expiresAt`
  - المسار المخزّن لـ `viewer.html`
- مدة البقاء الافتراضية للعنصر هي 30 دقيقة عند عدم تحديدها.
- الحد الأقصى المقبول لمدة بقاء العارض هو 6 ساعات.
- يعمل التنظيف بشكل انتهازي بعد إنشاء العنصر.
- يتم حذف العناصر منتهية الصلاحية.
- يزيل التنظيف الاحتياطي المجلدات القديمة الأقدم من 24 ساعة عندما تكون بيانات التعريف مفقودة.

## عنوان URL الخاص بالعارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

يحل مستند العارض هذه الأصول نسبةً إلى عنوان URL الخاص بالعارض، لذلك يتم الحفاظ أيضًا على بادئة المسار الاختيارية في `baseUrl` لكل طلبات الأصول.

سلوك إنشاء عنوان URL:

- إذا تم توفير `baseUrl` في استدعاء الأداة، فسيُستخدم بعد التحقق الصارم.
- وإلا، إذا كان `viewerBaseUrl` الخاص بـ Plugin مهيّأً، فسيُستخدم.
- ومن دون أي تجاوز منهما، تكون القيمة الافتراضية لعنوان URL الخاص بالعارض هي loopback عند `127.0.0.1`.
- إذا كان وضع ربط Gateway هو `custom` وكان `gateway.customBindHost` مضبوطًا، فسيُستخدم ذلك المضيف.

قواعد `baseUrl`:

- يجب أن يبدأ بـ `http://` أو `https://`.
- يتم رفض `query` و`hash`.
- يُسمح بالأصل مع مسار أساسي اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تقوية العارض">
    - يقتصر افتراضيًا على loopback فقط.
    - مسارات عارض مرمّزة برمز مميز مع تحقق صارم من المعرّف والرمز.
    - سياسة CSP لاستجابة العارض:
      - `default-src 'none'`
      - السكربتات والأصول من المصدر نفسه فقط
      - لا يوجد `connect-src` صادر
    - خنق الإخفاقات البعيدة عند تفعيل الوصول البعيد:
      - 40 إخفاقًا لكل 60 ثانية
      - حظر لمدة 60 ثانية (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="تقوية تصيير الملفات">
    - يكون توجيه طلبات متصفح لقطات الشاشة مرفوضًا افتراضيًا ما لم يُسمح به.
    - لا يُسمح إلا بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - يتم حظر طلبات الشبكة الخارجية.
  </Accordion>
</AccordionGroup>

## متطلبات المتصفح لوضع الملف

يحتاج `mode: "file"` و`mode: "both"` إلى متصفح متوافق مع Chromium.

ترتيب الحل:

<Steps>
  <Step title="الإعدادات">
    `browser.executablePath` في إعدادات OpenClaw.
  </Step>
  <Step title="متغيرات البيئة">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="الرجوع حسب المنصة">
    الرجوع إلى اكتشاف الأمر/المسار بحسب المنصة.
  </Step>
</Steps>

نص الإخفاق الشائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بضبط أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من الإدخال">
    - `Provide patch or both before and after text.` — ضمّن كلًا من `before` و`after`، أو وفّر `patch`.
    - `Provide either patch or before/after input, not both.` — لا تخلط بين وضعي الإدخال.
    - `Invalid baseUrl: ...` — استخدم أصل `http(s)` مع مسار اختياري، ومن دون query أو hash.
    - `{field} exceeds maximum size (...)` — قلّل حجم الحمولة.
    - رفض Patch كبيرة — قلّل عدد ملفات Patch أو عدد الأسطر الكلي.
  </Accordion>
  <Accordion title="إمكانية الوصول إلى العارض">
    - يُحل عنوان URL الخاص بالعارض إلى `127.0.0.1` افتراضيًا.
    - في سيناريوهات الوصول البعيد، يمكنك إما:
      - ضبط `viewerBaseUrl` الخاص بـ Plugin، أو
      - تمرير `baseUrl` لكل استدعاء أداة، أو
      - استخدام `gateway.bind=custom` و`gateway.customBindHost`
    - إذا تضمّن `gateway.trustedProxies` عنوان loopback لوكيل على المضيف نفسه (مثل Tailscale Serve)، فإن طلبات عارض loopback الخام من دون ترويسات عنوان IP الخاصة بالعميل المُمرَّرة تفشل بشكل مغلق حسب التصميم.
    - لهذا النمط من الوكلاء:
      - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج فقط إلى مرفق، أو
      - فعّل عمدًا `security.allowRemoteViewer` واضبط `viewerBaseUrl` الخاص بـ Plugin أو مرّر `baseUrl` خاصًا بوكيل/عام عندما تحتاج إلى عنوان URL قابل للمشاركة للعارض
    - فعّل `security.allowRemoteViewer` فقط عندما تنوي السماح بوصول خارجي إلى العارض.
  </Accordion>
  <Accordion title="صف الأسطر غير المعدّلة لا يحتوي على زر توسيع">
    قد يحدث هذا مع إدخال Patch عندما لا تحمل Patch سياقًا قابلًا للتوسيع. هذا سلوك متوقع ولا يشير إلى فشل في العارض.
  </Accordion>
  <Accordion title="العنصر غير موجود">
    - انتهت صلاحية العنصر بسبب TTL.
    - تم تغيير الرمز أو المسار.
    - أزال التنظيف البيانات القديمة.
  </Accordion>
</AccordionGroup>

## إرشادات تشغيلية

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية في canvas.
- فضّل `mode: "file"` لقنوات المحادثة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطّلًا ما لم يكن نشرُك يتطلب عناوين URL بعيدة للعارض.
- اضبط `ttlSeconds` قصيرًا وصريحًا للفروق الحساسة.
- تجنّب إرسال الأسرار في مدخلات الفروق عندما لا يكون ذلك مطلوبًا.
- إذا كانت قناتك تضغط الصور بقوة (مثل Telegram أو WhatsApp)، ففضّل خرج PDF (`fileFormat: "pdf"`).

<Note>
محرك تصيير الفروق مدعوم من [Diffs](https://diffs.com).
</Note>

## ذو صلة

- [Browser](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

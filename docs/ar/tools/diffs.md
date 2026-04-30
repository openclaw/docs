---
read_when:
    - تريد أن تعرض الوكلاء تعديلات التعليمات البرمجية أو Markdown على هيئة فروقات
    - تريد عنوان URL لعارض جاهز للوحة الرسم أو ملف فروقات معروض
    - تحتاج إلى مخرجات فروقات مؤقتة ومضبوطة بإعدادات افتراضية آمنة
sidebarTitle: Diffs
summary: عارض فروقات ومصيّر ملفات للقراءة فقط للوكلاء (أداة Plugin اختيارية)
title: الفروقات
x-i18n:
    generated_at: "2026-04-30T08:29:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` هي أداة Plugin اختيارية مع إرشادات نظام مدمجة قصيرة وSkill مرافقة تحوّل محتوى التغييرات إلى أثر diff للقراءة فقط للوكلاء.

تقبل إما:

- النصين `before` و`after`
- `patch` موحّدة

ويمكنها إرجاع:

- عنوان URL لعارض Gateway للعرض على canvas
- مسار ملف مُصيّر (PNG أو PDF) للتسليم عبر الرسائل
- كلا المخرجين في استدعاء واحد

عند التمكين، تضيف Plugin إرشادات استخدام موجزة إلى مساحة مطالبة النظام، وتكشف أيضًا Skill مفصلة للحالات التي يحتاج فيها الوكيل إلى تعليمات أوفى.

## البدء السريع

<Steps>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        تدفقات canvas أولًا: تستدعي الوكلاء `diffs` مع `mode: "view"` وتفتح `details.viewerUrl` باستخدام `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم ملفات المحادثة: تستدعي الوكلاء `diffs` مع `mode: "file"` وترسل `details.filePath` باستخدام `message` عبر `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        مدمج: تستدعي الوكلاء `diffs` مع `mode: "both"` للحصول على كلا الأثرين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل إرشادات النظام المدمجة

إذا أردت إبقاء أداة `diffs` مفعلة مع تعطيل إرشادات مطالبة النظام المدمجة الخاصة بها، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

يحظر هذا خطاف `before_prompt_build` الخاص بـ Plugin diffs مع إبقاء Plugin والأداة وSkill المرافقة متاحة.

إذا أردت تعطيل كل من الإرشادات والأداة، فعطّل Plugin بدلًا من ذلك.

## سير عمل الوكيل النموذجي

<Steps>
  <Step title="Call diffs">
    يستدعي الوكيل أداة `diffs` مع المُدخل.
  </Step>
  <Step title="Read details">
    يقرأ الوكيل حقول `details` من الاستجابة.
  </Step>
  <Step title="Present">
    إما أن يفتح الوكيل `details.viewerUrl` باستخدام `canvas present`، أو يرسل `details.filePath` باستخدام `message` عبر `path` أو `filePath`، أو يفعل الأمرين معًا.
  </Step>
</Steps>

## أمثلة الإدخال

<Tabs>
  <Tab title="Before and after">
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

## مرجع مُدخلات الأداة

كل الحقول اختيارية ما لم يُذكر خلاف ذلك.

<ParamField path="before" type="string">
  النص الأصلي. مطلوب مع `after` عند حذف `patch`.
</ParamField>
<ParamField path="after" type="string">
  النص المحدّث. مطلوب مع `before` عند حذف `patch`.
</ParamField>
<ParamField path="patch" type="string">
  نص diff موحّد. متنافي مع `before` و`after`.
</ParamField>
<ParamField path="path" type="string">
  اسم الملف المعروض لوضع قبل وبعد.
</ParamField>
<ParamField path="lang" type="string">
  تلميح تجاوز اللغة لوضع قبل وبعد. القيم غير المعروفة تعود إلى نص عادي.
</ParamField>
<ParamField path="title" type="string">
  تجاوز عنوان العارض.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  وضع الإخراج. الإعداد الافتراضي هو الإعداد الافتراضي لـ Plugin وهو `defaults.mode`. الاسم البديل المهمل: `"image"` يتصرف مثل `"file"` وما زال مقبولًا للتوافق مع الإصدارات السابقة.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. الإعداد الافتراضي هو الإعداد الافتراضي لـ Plugin وهو `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط diff. الإعداد الافتراضي هو الإعداد الافتراضي لـ Plugin وهو `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  توسيع الأقسام غير المتغيرة عندما يكون السياق الكامل متاحًا. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا لـ Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المُصيّر. الإعداد الافتراضي هو الإعداد الافتراضي لـ Plugin وهو `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  إعداد جودة مسبق لتصيير PNG أو PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  تجاوز مقياس الجهاز (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  أقصى عرض للتصيير بوحدات بكسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  مدة بقاء الأثر بالثواني لمخرجات العارض والملفات المستقلة. الحد الأقصى 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL للعارض. يتجاوز `viewerBaseUrl` الخاص بـ Plugin. يجب أن يكون `http` أو `https`، بلا استعلام/هاش.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    ما زالت مقبولة للتوافق مع الإصدارات السابقة:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - الحد الأقصى لكل من `before` و`after` هو 512 KiB.
    - الحد الأقصى لـ `patch` هو 2 MiB.
    - الحد الأقصى لـ `path` هو 2048 بايت.
    - الحد الأقصى لـ `lang` هو 128 بايت.
    - الحد الأقصى لـ `title` هو 1024 بايت.
    - حد تعقيد التصحيح: بحد أقصى 128 ملفًا و120000 سطر إجماليًا.
    - يُرفض استخدام `patch` مع `before` أو `after` معًا.
    - حدود سلامة الملفات المُصيّرة (تنطبق على PNG وPDF):
      - `fileQuality: "standard"`: الحد الأقصى 8 MP (8,000,000 بكسل مُصيّر).
      - `fileQuality: "hq"`: الحد الأقصى 14 MP (14,000,000 بكسل مُصيّر).
      - `fileQuality: "print"`: الحد الأقصى 24 MP (24,000,000 بكسل مُصيّر).
      - يحتوي PDF أيضًا على حد أقصى قدره 50 صفحة.

  </Accordion>
</AccordionGroup>

## عقد تفاصيل الإخراج

تعيد الأداة بيانات وصفية منظمة ضمن `details`.

<AccordionGroup>
  <Accordion title="Viewer fields">
    الحقول المشتركة للأوضاع التي تنشئ عارضًا:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` عند توفرها)

  </Accordion>
  <Accordion title="File fields">
    حقول الملف عند تصيير PNG أو PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (نفس قيمة `filePath`، للتوافق مع أداة الرسائل)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    تُعاد أيضًا للمتصلين الحاليين:

    - `format` (القيمة نفسها مثل `fileFormat`)
    - `imagePath` (القيمة نفسها مثل `filePath`)
    - `imageBytes` (القيمة نفسها مثل `fileBytes`)
    - `imageQuality` (القيمة نفسها مثل `fileQuality`)
    - `imageScale` (القيمة نفسها مثل `fileScale`)
    - `imageMaxWidth` (القيمة نفسها مثل `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

ملخص سلوك الوضع:

| الوضع    | ما يتم إرجاعه                                                                                                             |
| -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                                                          |
| `"file"` | حقول الملف فقط، من دون أثر للعارض.                                                                                        |
| `"both"` | حقول العارض بالإضافة إلى حقول الملف. إذا فشل تصيير الملف، فسيظل العارض يرجع مع الاسم البديل `fileError` و`imageError`. |

## الأقسام غير المتغيرة المطوية

- يمكن للعارض أن يعرض صفوفًا مثل `N unmodified lines`.
- عناصر التحكم في التوسيع على تلك الصفوف شرطية ولا تكون مضمونة لكل نوع إدخال.
- تظهر عناصر التحكم في التوسيع عندما يحتوي الفرق المصير على بيانات سياق قابلة للتوسيع، وهذا شائع في الإدخالين قبل وبعد.
- بالنسبة إلى العديد من إدخالات الرقع الموحدة، لا تكون أجسام السياق المحذوفة متاحة في مقاطع الرقعة المحللة، لذلك قد يظهر الصف من دون عناصر تحكم في التوسيع. هذا سلوك متوقع.
- ينطبق `expandUnchanged` فقط عند وجود سياق قابل للتوسيع.

## افتراضيات Plugin

عيّن الافتراضيات على مستوى Plugin في `~/.openclaw/openclaw.json`:

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

الافتراضيات المدعومة:

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

تتجاوز معاملات الأداة الصريحة هذه الافتراضيات.

### تكوين URL العارض الدائم

<ParamField path="viewerBaseUrl" type="string">
  قيمة احتياطية مملوكة لـ Plugin لروابط العارض المرجعة عندما لا يمرر استدعاء الأداة `baseUrl`. يجب أن تكون `http` أو `https`، من دون استعلام/تجزئة.
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

## تكوين الأمان

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: يتم رفض الطلبات غير المحلية إلى مسارات العارض. `true`: يُسمح بالعارضين البعيدين إذا كان المسار المرمز صالحًا.
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

## دورة حياة الآثار والتخزين

- تُخزّن الآثار ضمن المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي بيانات تعريف أثر العارض على:
  - معرّف أثر عشوائي (20 حرفًا سداسيًا عشريًا)
  - رمز عشوائي (48 حرفًا سداسيًا عشريًا)
  - `createdAt` و`expiresAt`
  - مسار `viewer.html` المخزن
- مدة TTL الافتراضية للأثر هي 30 دقيقة عند عدم تحديدها.
- الحد الأقصى المقبول لمدة TTL للعارض هو 6 ساعات.
- يتم تشغيل التنظيف انتهازيًا بعد إنشاء الأثر.
- تُحذف الآثار منتهية الصلاحية.
- يزيل التنظيف الاحتياطي المجلدات القديمة التي يتجاوز عمرها 24 ساعة عندما تكون بيانات التعريف مفقودة.

## URL العارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

يحل مستند العارض تلك الأصول نسبةً إلى URL العارض، لذلك يتم الاحتفاظ ببادئة مسار `baseUrl` الاختيارية لطلبات الأصول أيضًا.

سلوك إنشاء URL:

- إذا تم توفير `baseUrl` في استدعاء الأداة، فسيتم استخدامه بعد تحقق صارم.
- وإلا إذا تم تكوين `viewerBaseUrl` الخاص بـ Plugin، فسيتم استخدامه.
- من دون أي تجاوز منهما، يكون URL العارض افتراضيًا على local loopback `127.0.0.1`.
- إذا كان وضع ربط Gateway هو `custom` وتم تعيين `gateway.customBindHost`، فسيتم استخدام ذلك المضيف.

قواعد `baseUrl`:

- يجب أن يكون `http://` أو `https://`.
- يتم رفض الاستعلام والتجزئة.
- يُسمح بالأصل بالإضافة إلى مسار أساسي اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تقوية العارض">
    - local loopback فقط افتراضيًا.
    - مسارات عارض مرمزة مع تحقق صارم من المعرّف والرمز.
    - CSP لاستجابة العارض:
      - `default-src 'none'`
      - السكربتات والأصول من الذات فقط
      - لا يوجد `connect-src` صادر
    - تقييد الإخفاقات البعيدة عند تمكين الوصول البعيد:
      - 40 إخفاقًا لكل 60 ثانية
      - قفل لمدة 60 ثانية (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="تعزيز أمان عرض الملفات">
    - توجيه طلبات متصفح لقطات الشاشة يعتمد الرفض افتراضيًا.
    - يُسمح فقط بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - تُحظر طلبات الشبكة الخارجية.

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
  <Step title="الرجوع الاحتياطي للمنصة">
    الرجوع احتياطيًا إلى اكتشاف أوامر/مسارات المنصة.
  </Step>
</Steps>

نص الفشل الشائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بتعيين أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من صحة الإدخال">
    - `Provide patch or both before and after text.` — ضمّن كلًا من `before` و`after`، أو وفّر `patch`.
    - `Provide either patch or before/after input, not both.` — لا تخلط بين أوضاع الإدخال.
    - `Invalid baseUrl: ...` — استخدم أصل `http(s)` مع مسار اختياري، ودون استعلام/تجزئة.
    - `{field} exceeds maximum size (...)` — قلّل حجم الحمولة.
    - رفض الرقعة الكبيرة — قلّل عدد ملفات الرقعة أو إجمالي الأسطر.

  </Accordion>
  <Accordion title="إتاحة العارض">
    - يتحول عنوان URL الخاص بالعارض إلى `127.0.0.1` افتراضيًا.
    - في سيناريوهات الوصول عن بُعد، إمّا:
      - اضبط `viewerBaseUrl` الخاص بـ Plugin، أو
      - مرّر `baseUrl` لكل استدعاء أداة، أو
      - استخدم `gateway.bind=custom` و`gateway.customBindHost`
    - إذا كان `gateway.trustedProxies` يتضمن loopback لوكيل على المضيف نفسه (مثل Tailscale Serve)، فستفشل طلبات عارض loopback الخام دون ترويسات عنوان IP للعميل المُمرَّرة، وذلك بشكل مغلق حسب التصميم.
    - لطوبولوجيا الوكيل هذه:
      - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج فقط إلى مرفق، أو
      - فعّل عمدًا `security.allowRemoteViewer` واضبط `viewerBaseUrl` الخاص بـ Plugin أو مرّر `baseUrl` لوكيل/عام عندما تحتاج إلى عنوان URL عارض قابل للمشاركة
    - فعّل `security.allowRemoteViewer` فقط عندما تقصد إتاحة وصول خارجي إلى العارض.

  </Accordion>
  <Accordion title="صف الأسطر غير المعدّلة لا يحتوي على زر توسيع">
    يمكن أن يحدث هذا لإدخال الرقعة عندما لا تحمل الرقعة سياقًا قابلًا للتوسيع. هذا متوقع ولا يشير إلى فشل في العارض.
  </Accordion>
  <Accordion title="لم يتم العثور على الأثر">
    - انتهت صلاحية الأثر بسبب TTL.
    - تغيّر الرمز أو المسار.
    - أزالت عملية التنظيف البيانات القديمة.

  </Accordion>
</AccordionGroup>

## إرشادات تشغيلية

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية في اللوحة.
- فضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطّلًا ما لم يتطلب النشر لديك عناوين URL عارض بعيدة.
- عيّن `ttlSeconds` قصيرة وصريحة للفروق الحساسة.
- تجنب إرسال الأسرار في إدخال الفروق عندما لا تكون مطلوبة.
- إذا كانت قناتك تضغط الصور بقوة (مثل Telegram أو WhatsApp)، ففضّل إخراج PDF (`fileFormat: "pdf"`).

<Note>
محرك عرض الفروق مدعوم من [Diffs](https://diffs.com).
</Note>

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

---
read_when:
    - تريد أن يعرض الوكلاء تعديلات الكود أو Markdown على شكل فروقات
    - تريد عنوان URL لعارض جاهز للوحة الرسم أو ملف فرق مُصيَّر
    - تحتاج إلى مخرجات diff مؤقتة ومضبوطة بإعدادات افتراضية آمنة
sidebarTitle: Diffs
summary: عارض فروقات ومُصيّر ملفات للقراءة فقط للوكلاء (أداة Plugin اختيارية)
title: الفروقات
x-i18n:
    generated_at: "2026-05-02T07:44:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` هي أداة Plugin اختيارية تتضمن إرشادات نظام مدمجة موجزة وSkill مصاحبة تحول محتوى التغييرات إلى أثر فرق للقراءة فقط للوكلاء.

تقبل إما:

- نصي `before` و`after`
- `patch` موحدًا

يمكنها إرجاع:

- عنوان URL لعارض Gateway للعرض على اللوحة
- مسار ملف مُصيّر (PNG أو PDF) للتسليم عبر الرسائل
- كلا المخرجين في استدعاء واحد

عند تمكينها، تضيف Plugin إرشادات استخدام موجزة إلى مساحة موجه النظام، وتعرض أيضًا Skill مفصلة للحالات التي يحتاج فيها الوكيل إلى تعليمات أوفى.

## البدء السريع

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        تدفقات تركّز على اللوحة أولًا: يستدعي الوكلاء `diffs` مع `mode: "view"` ويفتحون `details.viewerUrl` باستخدام `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم ملفات الدردشة: يستدعي الوكلاء `diffs` مع `mode: "file"` ويرسلون `details.filePath` باستخدام `message` عبر `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        مدمج: يستدعي الوكلاء `diffs` مع `mode: "both"` للحصول على الأثرين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل إرشادات النظام المدمجة

إذا أردت إبقاء أداة `diffs` مُمكّنة مع تعطيل إرشادات موجه النظام المدمجة الخاصة بها، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

يحظر هذا خطاف `before_prompt_build` الخاص بـ Plugin diffs مع إبقاء Plugin والأداة وSkill المصاحبة متاحة.

إذا أردت تعطيل كل من الإرشادات والأداة، فعطّل Plugin بدلًا من ذلك.

## سير عمل الوكيل المعتاد

<Steps>
  <Step title="Call diffs">
    يستدعي الوكيل أداة `diffs` مع الإدخال.
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

## مرجع إدخال الأداة

كل الحقول اختيارية ما لم يُذكر خلاف ذلك.

<ParamField path="before" type="string">
  النص الأصلي. مطلوب مع `after` عند حذف `patch`.
</ParamField>
<ParamField path="after" type="string">
  النص المحدّث. مطلوب مع `before` عند حذف `patch`.
</ParamField>
<ParamField path="patch" type="string">
  نص فرق موحد. لا يمكن استخدامه مع `before` و`after`.
</ParamField>
<ParamField path="path" type="string">
  اسم الملف المعروض لوضع قبل وبعد.
</ParamField>
<ParamField path="lang" type="string">
  تلميح لتجاوز اللغة في وضع قبل وبعد. القيم غير المعروفة تعود إلى نص عادي.
</ParamField>
<ParamField path="title" type="string">
  تجاوز عنوان العارض.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  وضع الإخراج. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.mode`. الاسم المستعار المهمل: `"image"` يتصرف مثل `"file"` وما زال مقبولًا للتوافق العكسي.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط الفرق. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  توسيع الأقسام غير المتغيرة عندما يكون السياق الكامل متاحًا. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا في Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المُصيّر. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.fileFormat`.
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
  مدة بقاء الأثر بالثواني لمخرجات العارض والملف المستقل. الحد الأقصى 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL للعارض. يتجاوز `viewerBaseUrl` الخاص بـ Plugin. يجب أن يكون `http` أو `https`، بلا استعلام/تجزئة.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    لا تزال مقبولة للتوافق العكسي:

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
    - حد تعقيد الرقعة: بحد أقصى 128 ملفًا و120000 سطر إجمالًا.
    - يُرفض الجمع بين `patch` و`before` أو `after`.
    - حدود أمان الملف المُصيّر (تنطبق على PNG وPDF):
      - `fileQuality: "standard"`: بحد أقصى 8 MP (8,000,000 بكسل مُصيّر).
      - `fileQuality: "hq"`: بحد أقصى 14 MP (14,000,000 بكسل مُصيّر).
      - `fileQuality: "print"`: بحد أقصى 24 MP (24,000,000 بكسل مُصيّر).
      - لدى PDF أيضًا حد أقصى يبلغ 50 صفحة.

  </Accordion>
</AccordionGroup>

## عقد تفاصيل الإخراج

تعيد الأداة بيانات وصفية منظمة تحت `details`.

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

    - `format` (نفس قيمة `fileFormat`)
    - `imagePath` (نفس قيمة `filePath`)
    - `imageBytes` (نفس قيمة `fileBytes`)
    - `imageQuality` (نفس قيمة `fileQuality`)
    - `imageScale` (نفس قيمة `fileScale`)
    - `imageMaxWidth` (نفس قيمة `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

ملخص سلوك الوضع:

| الوضع     | ما يتم إرجاعه                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                                                    |
| `"file"` | حقول الملف فقط، بلا أثر عارض.                                                                                  |
| `"both"` | حقول العارض بالإضافة إلى حقول الملف. إذا فشل تصيير الملف، يظل العارض يُعاد مع `fileError` والاسم المستعار `imageError`. |

## الأقسام غير المتغيرة المطوية

- يمكن للعارض إظهار صفوف مثل `N unmodified lines`.
- عناصر التحكم في التوسيع على تلك الصفوف مشروطة وليست مضمونة لكل نوع إدخال.
- تظهر عناصر التحكم في التوسيع عندما يحتوي الفرق المُصيّر على بيانات سياق قابلة للتوسيع، وهذا معتاد لإدخال قبل وبعد.
- في كثير من مدخلات الرقع الموحدة، لا تكون أجسام السياق المحذوفة متاحة في كتل الرقعة المحللة، لذلك قد يظهر الصف دون عناصر تحكم للتوسيع. هذا سلوك متوقع.
- لا ينطبق `expandUnchanged` إلا عند وجود سياق قابل للتوسيع.

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

### إعداد عنوان URL دائم للعارض

<ParamField path="viewerBaseUrl" type="string">
  بديل احتياطي مملوك لـ Plugin لروابط العارض المُعادة عندما لا يمرر استدعاء الأداة `baseUrl`. يجب أن يكون `http` أو `https`، بلا استعلام/تجزئة.
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

## إعداد الأمان

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: تُرفض الطلبات غير local loopback إلى مسارات العارض. `true`: يُسمح بالعارضين البعيدين إذا كان المسار المرمّز صالحًا.
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

## دورة حياة الأثر والتخزين

- تُخزّن الآثار ضمن المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي بيانات وصف أثر العارض على:
  - معرّف أثر عشوائي (20 حرفًا سداسيًا)
  - رمز عشوائي (48 حرفًا سداسيًا)
  - `createdAt` و`expiresAt`
  - مسار `viewer.html` المخزّن
- مدة بقاء الأثر الافتراضية هي 30 دقيقة عند عدم تحديدها.
- أقصى مدة بقاء عارض مقبولة هي 6 ساعات.
- يعمل التنظيف انتهازيًا بعد إنشاء الأثر.
- تُحذف الآثار منتهية الصلاحية.
- يزيل التنظيف الاحتياطي المجلدات القديمة التي يزيد عمرها عن 24 ساعة عند فقدان البيانات الوصفية.

## عنوان URL للعارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

يحل مستند العارض تلك الأصول نسبةً إلى عنوان URL للعارض، لذلك يُحافظ أيضًا على بادئة مسار `baseUrl` الاختيارية لكلا طلبي الأصول.

سلوك إنشاء عنوان URL:

- إذا قُدّم `baseUrl` في استدعاء الأداة، فيُستخدم بعد تحقق صارم.
- وإلا إذا كان `viewerBaseUrl` الخاص بـ Plugin مهيأً، فيُستخدم.
- دون أي من التجاوزين، يكون عنوان URL للعارض افتراضيًا هو local loopback `127.0.0.1`.
- إذا كان وضع ربط Gateway هو `custom` وكان `gateway.customBindHost` مضبوطًا، فيُستخدم ذلك المضيف.

قواعد `baseUrl`:

- يجب أن يكون `http://` أو `https://`.
- تُرفض الاستعلامات والتجزئات.
- يُسمح بالأصل بالإضافة إلى مسار أساسي اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تقوية العارض">
    - local loopback فقط افتراضيًا.
    - مسارات عارض مزودة برموز مع تحقق صارم من المعرّف والرمز.
    - سياسة CSP لاستجابة العارض:
      - `default-src 'none'`
      - السكربتات والأصول من الذات فقط
      - لا يوجد `connect-src` صادر
    - تقييد الإخفاقات البعيدة عند تمكين الوصول البعيد:
      - 40 إخفاقًا لكل 60 ثانية
      - قفل لمدة 60 ثانية (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="تقوية عرض الملفات">
    - توجيه طلبات متصفح لقطات الشاشة يرفض افتراضيًا.
    - يُسمح فقط بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - تُحظر طلبات الشبكة الخارجية.

  </Accordion>
</AccordionGroup>

## متطلبات المتصفح لوضع الملفات

يحتاج `mode: "file"` و`mode: "both"` إلى متصفح متوافق مع Chromium.

ترتيب الحل:

<Steps>
  <Step title="الإعداد">
    `browser.executablePath` في إعداد OpenClaw.
  </Step>
  <Step title="متغيرات البيئة">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="الرجوع إلى المنصة">
    رجوع إلى اكتشاف أمر/مسار المنصة.
  </Step>
</Steps>

نص فشل شائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بتعيين أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من الإدخال">
    - `Provide patch or both before and after text.` — ضمّن كلًا من `before` و`after`، أو وفّر `patch`.
    - `Provide either patch or before/after input, not both.` — لا تخلط أوضاع الإدخال.
    - `Invalid baseUrl: ...` — استخدم أصل `http(s)` مع مسار اختياري، بلا استعلام/هاش.
    - `{field} exceeds maximum size (...)` — قلّل حجم الحمولة.
    - رفض الرقعة الكبيرة — قلّل عدد ملفات الرقعة أو إجمالي الأسطر.

  </Accordion>
  <Accordion title="إمكانية الوصول إلى العارض">
    - يُحل عنوان URL للعارض إلى `127.0.0.1` افتراضيًا.
    - لسيناريوهات الوصول البعيد، إمّا:
      - عيّن `viewerBaseUrl` في Plugin، أو
      - مرّر `baseUrl` لكل استدعاء أداة، أو
      - استخدم `gateway.bind=custom` و`gateway.customBindHost`
    - إذا كان `gateway.trustedProxies` يتضمن local loopback لوكيل على المضيف نفسه (مثل Tailscale Serve)، فإن طلبات عارض local loopback الخام من دون ترويسات عنوان IP للعميل المُمرَّرة تفشل مغلقةً حسب التصميم.
    - لطوبولوجيا الوكيل تلك:
      - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج إلى مرفق فقط، أو
      - مكّن `security.allowRemoteViewer` عمدًا وعيّن `viewerBaseUrl` في Plugin أو مرّر `baseUrl` لوكيل/عام عندما تحتاج إلى عنوان URL عارض قابل للمشاركة
    - مكّن `security.allowRemoteViewer` فقط عندما تقصد إتاحة وصول خارجي إلى العارض.

  </Accordion>
  <Accordion title="صف الأسطر غير المعدّلة لا يحتوي على زر توسيع">
    يمكن أن يحدث هذا لإدخال الرقعة عندما لا تحمل الرقعة سياقًا قابلًا للتوسيع. هذا متوقع ولا يشير إلى فشل في العارض.
  </Accordion>
  <Accordion title="لم يُعثر على الأثر">
    - انتهت صلاحية الأثر بسبب TTL.
    - تغيّر الرمز أو المسار.
    - أزالت عملية التنظيف بيانات قديمة.

  </Accordion>
</AccordionGroup>

## إرشادات تشغيلية

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية في اللوحة.
- فضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطلًا ما لم يتطلب نشرُك عناوين URL بعيدة للعارض.
- عيّن `ttlSeconds` قصيرة وصريحة للفروقات الحساسة.
- تجنب إرسال الأسرار في إدخال الفرق عندما لا تكون مطلوبة.
- إذا كانت قناتك تضغط الصور بقوة (مثل Telegram أو WhatsApp)، ففضّل إخراج PDF (`fileFormat: "pdf"`).

<Note>
محرك عرض الفروقات مدعوم من [Diffs](https://diffs.com).
</Note>

## ذات صلة

- [المتصفح](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

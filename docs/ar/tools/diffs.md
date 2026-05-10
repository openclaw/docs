---
read_when:
    - تريد أن تعرض الوكلاء تعديلات التعليمات البرمجية أو Markdown على هيئة فروقات
    - تريد عنوان URL لعارض جاهز للوحة الرسم أو ملف فروقات مُصيَّر
    - تحتاج إلى مخرجات diff مؤقتة ومضبوطة بإعدادات افتراضية آمنة
sidebarTitle: Diffs
summary: عارض فروقات وقارئ ملفات للوكيل (أداة Plugin اختيارية)
title: الفروقات
x-i18n:
    generated_at: "2026-05-10T20:03:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` هي أداة Plugin اختيارية مع إرشادات نظام مدمجة موجزة وSkill مرافقة تحوّل محتوى التغييرات إلى أثر diff للقراءة فقط من أجل الوكلاء.

تقبل إما:

- نصي `before` و`after`
- `patch` موحّدًا

يمكنها إرجاع:

- عنوان URL لعارض Gateway من أجل عرض اللوحة
- مسار ملف معروض (PNG أو PDF) من أجل تسليم الرسائل
- كلا المخرجين في استدعاء واحد

عند تمكينها، تضيف Plugin إرشادات استخدام موجزة إلى مساحة موجه النظام، وتعرض أيضًا Skill تفصيلية للحالات التي يحتاج فيها الوكيل إلى تعليمات أوفى.

## البدء السريع

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="فعّل Plugin">
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
  <Step title="اختر وضعًا">
    <Tabs>
      <Tab title="view">
        تدفقات اللوحة أولًا: يستدعي الوكلاء `diffs` مع `mode: "view"` ويفتحون `details.viewerUrl` باستخدام `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم ملف الدردشة: يستدعي الوكلاء `diffs` مع `mode: "file"` ويرسلون `details.filePath` باستخدام `message` عبر `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        مدمج: يستدعي الوكلاء `diffs` مع `mode: "both"` للحصول على كلا الأثرين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل إرشادات النظام المدمجة

إذا أردت إبقاء أداة `diffs` مفعّلة مع تعطيل إرشادات موجه النظام المدمجة الخاصة بها، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

يحظر هذا خطاف `before_prompt_build` الخاص بـPlugin diffs مع إبقاء Plugin والأداة وSkill المرافقة متاحة.

إذا أردت تعطيل كل من الإرشادات والأداة، فعطّل Plugin بدلًا من ذلك.

## سير عمل الوكيل المعتاد

<Steps>
  <Step title="استدعِ diffs">
    يستدعي الوكيل أداة `diffs` مع الإدخال.
  </Step>
  <Step title="اقرأ التفاصيل">
    يقرأ الوكيل حقول `details` من الاستجابة.
  </Step>
  <Step title="اعرض">
    يفتح الوكيل إما `details.viewerUrl` باستخدام `canvas present`، أو يرسل `details.filePath` باستخدام `message` عبر `path` أو `filePath`، أو يفعل الاثنين معًا.
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

## مرجع إدخال الأداة

كل الحقول اختيارية ما لم يُذكر خلاف ذلك.

<ParamField path="before" type="string">
  النص الأصلي. مطلوب مع `after` عند حذف `patch`.
</ParamField>
<ParamField path="after" type="string">
  النص المحدّث. مطلوب مع `before` عند حذف `patch`.
</ParamField>
<ParamField path="patch" type="string">
  نص diff موحّد. متنافر مع `before` و`after`.
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
  وضع الإخراج. الافتراضي هو القيمة الافتراضية لـPlugin `defaults.mode`. الاسم المستعار المهمل: `"image"` يتصرف مثل `"file"` ولا يزال مقبولًا للتوافق العكسي.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. الافتراضي هو القيمة الافتراضية لـPlugin `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط diff. الافتراضي هو القيمة الافتراضية لـPlugin `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  توسيع الأقسام غير المتغيرة عند توفر السياق الكامل. خيار لكل استدعاء فقط (ليس مفتاحًا افتراضيًا لـPlugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المعروض. الافتراضي هو القيمة الافتراضية لـPlugin `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  إعداد جودة مسبق لعرض PNG أو PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  تجاوز مقياس الجهاز (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  أقصى عرض للعرض بالبكسلات في CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  مدة TTL للأثر بالثواني لمخرجات العارض والملف المستقل. الحد الأقصى 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL للعارض. يتجاوز `viewerBaseUrl` الخاص بـPlugin. يجب أن يكون `http` أو `https`، بلا استعلام/تجزئة.
</ParamField>

<AccordionGroup>
  <Accordion title="أسماء الإدخال المستعارة القديمة">
    لا تزال مقبولة للتوافق العكسي:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="التحقق والحدود">
    - الحد الأقصى لكل من `before` و`after` هو 512 KiB.
    - الحد الأقصى لـ`patch` هو 2 MiB.
    - الحد الأقصى لـ`path` هو 2048 بايت.
    - الحد الأقصى لـ`lang` هو 128 بايت.
    - الحد الأقصى لـ`title` هو 1024 بايت.
    - حد تعقيد Patch: 128 ملفًا كحد أقصى و120000 سطر إجمالًا.
    - يتم رفض `patch` مع `before` أو `after` معًا.
    - حدود أمان الملف المعروض (تنطبق على PNG وPDF):
      - `fileQuality: "standard"`: الحد الأقصى 8 MP (8,000,000 بكسل معروض).
      - `fileQuality: "hq"`: الحد الأقصى 14 MP (14,000,000 بكسل معروض).
      - `fileQuality: "print"`: الحد الأقصى 24 MP (24,000,000 بكسل معروض).
      - لدى PDF أيضًا حد أقصى قدره 50 صفحة.

  </Accordion>
</AccordionGroup>

## عقد تفاصيل الإخراج

تعيد الأداة بيانات وصفية منظّمة ضمن `details`.

<AccordionGroup>
  <Accordion title="حقول العارض">
    حقول مشتركة للأوضاع التي تنشئ عارضًا:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` عند التوفر)

  </Accordion>
  <Accordion title="حقول الملف">
    حقول الملف عند عرض PNG أو PDF:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (القيمة نفسها مثل `filePath`، للتوافق مع أداة الرسائل)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="أسماء التوافق المستعارة">
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

| الوضع     | ما يتم إرجاعه                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                                                    |
| `"file"` | حقول الملف فقط، بلا أثر عارض.                                                                                  |
| `"both"` | حقول العارض إضافة إلى حقول الملف. إذا فشل عرض الملف، يظل العارض يُعاد مع `fileError` والاسم المستعار `imageError`. |

## الأقسام غير المتغيرة المطوية

- يمكن أن يعرض العارض صفوفًا مثل `N unmodified lines`.
- عناصر التحكم في التوسيع على تلك الصفوف شرطية وليست مضمونة لكل نوع إدخال.
- تظهر عناصر التحكم في التوسيع عندما يحتوي diff المعروض على بيانات سياق قابلة للتوسيع، وهذا معتاد لإدخال قبل وبعد.
- بالنسبة للعديد من إدخالات Patch الموحّدة، لا تكون أجسام السياق المحذوفة متاحة في أجزاء Patch المحللة، لذا يمكن أن يظهر الصف من دون عناصر تحكم في التوسيع. هذا سلوك متوقع.
- ينطبق `expandUnchanged` فقط عند وجود سياق قابل للتوسيع.

## القيم الافتراضية لـPlugin

اضبط القيم الافتراضية على مستوى Plugin في `~/.openclaw/openclaw.json`:

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

تتجاوز معاملات الأداة الصريحة هذه القيم الافتراضية.

### إعداد عنوان URL عارض دائم

<ParamField path="viewerBaseUrl" type="string">
  بديل احتياطي مملوك لـPlugin لروابط العارض المُعادة عندما لا يمرر استدعاء الأداة `baseUrl`. يجب أن يكون `http` أو `https`، بلا استعلام/تجزئة.
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
  `false`: تُرفض الطلبات غير المحلية إلى مسارات العارض. `true`: يُسمح بالعارضين البعيدين إذا كان المسار ذي الرمز صالحًا.
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

- تُخزن الآثار ضمن المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي البيانات الوصفية لأثر العارض على:
  - معرّف أثر عشوائي (20 حرفًا سداسيًا)
  - رمز عشوائي (48 حرفًا سداسيًا)
  - `createdAt` و`expiresAt`
  - مسار `viewer.html` المخزّن
- مدة TTL الافتراضية للأثر هي 30 دقيقة عند عدم تحديدها.
- الحد الأقصى المقبول لمدة TTL للعارض هو 6 ساعات.
- يعمل التنظيف انتهازيًا بعد إنشاء الأثر.
- تُحذف الآثار المنتهية.
- يزيل التنظيف الاحتياطي المجلدات القديمة التي يزيد عمرها عن 24 ساعة عند غياب البيانات الوصفية.

## عنوان URL للعارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

تحل وثيقة العارض تلك الأصول نسبةً إلى عنوان URL للعارض، لذا يُحافظ أيضًا على بادئة مسار `baseUrl` الاختيارية لكل طلبي الأصلين.

سلوك إنشاء عنوان URL:

- إذا تم توفير `baseUrl` في استدعاء الأداة، فسيُستخدم بعد تحقق صارم.
- وإلا إذا تم إعداد `viewerBaseUrl` الخاص بـPlugin، فسيُستخدم.
- من دون أي تجاوز، يكون عنوان URL للعارض افتراضيًا local loopback `127.0.0.1`.
- إذا كان وضع ربط Gateway هو `custom` وتم ضبط `gateway.customBindHost`، فسيُستخدم ذلك المضيف.

قواعد `baseUrl`:

- يجب أن يكون `http://` أو `https://`.
- تُرفض الاستعلامات والتجزئة.
- يُسمح بالأصل مع مسار أساس اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تقوية العارض">
    - يقتصر على Loopback افتراضيا.
    - مسارات عارض مرمزة برموز مميزة مع تحقق صارم من المعرف والرمز المميز.
    - CSP لاستجابة العارض:
      - `default-src 'none'`
      - النصوص البرمجية والأصول من self فقط
      - لا يوجد `connect-src` صادر
    - تقييد حالات الفقد البعيدة عند تفعيل الوصول البعيد:
      - 40 إخفاقا لكل 60 ثانية
      - قفل لمدة 60 ثانية (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="تقوية عرض الملفات">
    - توجيه طلبات متصفح لقطات الشاشة يرفض افتراضيا.
    - يسمح فقط بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - تحظر طلبات الشبكة الخارجية.

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
  <Step title="رجوع المنصة">
    رجوع اكتشاف أمر/مسار المنصة.
  </Step>
</Steps>

نص الإخفاق الشائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بتعيين أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من صحة الإدخال">
    - `Provide patch or both before and after text.` — ضمّن كلا من `before` و`after`، أو قدم `patch`.
    - `Provide either patch or before/after input, not both.` — لا تخلط بين أوضاع الإدخال.
    - `Invalid baseUrl: ...` — استخدم أصل `http(s)` مع مسار اختياري، بدون استعلام/جزء.
    - `{field} exceeds maximum size (...)` — قلل حجم الحمولة.
    - رفض التصحيح الكبير — قلل عدد ملفات التصحيح أو إجمالي الأسطر.

  </Accordion>
  <Accordion title="إمكانية الوصول إلى العارض">
    - يحل عنوان URL للعارض إلى `127.0.0.1` افتراضيا.
    - لسيناريوهات الوصول البعيد، إما:
      - عيّن `viewerBaseUrl` الخاص بالـ Plugin، أو
      - مرر `baseUrl` لكل استدعاء أداة، أو
      - استخدم `gateway.bind=custom` و`gateway.customBindHost`
    - إذا كان `gateway.trustedProxies` يتضمن loopback لوكيل على المضيف نفسه (على سبيل المثال Tailscale Serve)، فستفشل طلبات عارض loopback الخام التي لا تحتوي على ترويسات عنوان IP للعميل المعاد توجيهها على نحو مغلق حسب التصميم.
    - لطوبولوجيا الوكيل هذه:
      - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج إلى مرفق فقط، أو
      - فعّل `security.allowRemoteViewer` عمدا وعيّن `viewerBaseUrl` الخاص بالـ Plugin أو مرر `baseUrl` للوكيل/العام عندما تحتاج إلى عنوان URL قابل للمشاركة للعارض
    - فعّل `security.allowRemoteViewer` فقط عندما تقصد إتاحة وصول خارجي إلى العارض.

  </Accordion>
  <Accordion title="صف الأسطر غير المعدلة لا يحتوي على زر توسيع">
    قد يحدث هذا لإدخال التصحيح عندما لا يحمل التصحيح سياقا قابلا للتوسيع. هذا متوقع ولا يشير إلى إخفاق في العارض.
  </Accordion>
  <Accordion title="لم يعثر على الأثر">
    - انتهت صلاحية الأثر بسبب TTL.
    - تغير الرمز المميز أو المسار.
    - أزالت عملية التنظيف البيانات القديمة.

  </Accordion>
</AccordionGroup>

## الإرشادات التشغيلية

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية في اللوحة.
- فضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبق `allowRemoteViewer` معطلا ما لم يتطلب نشرك عناوين URL بعيدة للعارض.
- عيّن `ttlSeconds` قصيرة وصريحة للفروقات الحساسة.
- تجنب إرسال الأسرار في إدخال الفروقات عندما لا تكون مطلوبة.
- إذا كانت قناتك تضغط الصور بقوة (على سبيل المثال Telegram أو WhatsApp)، ففضّل إخراج PDF (`fileFormat: "pdf"`).

<Note>
يشغّل محرك عرض الفروقات [Diffs](https://diffs.com).
</Note>

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

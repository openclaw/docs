---
read_when:
    - تريد أن تعرض الوكلاء تعديلات الكود أو Markdown كفروقات
    - تريد عنوان URL لعارض جاهز للوحة الرسم أو ملف فرق مُصيَّر
    - تحتاج إلى عناصر diff مؤقتة ومضبوطة بإعدادات افتراضية آمنة
sidebarTitle: Diffs
summary: عارض فروقات للقراءة فقط ومصيّر ملفات للوكلاء (أداة Plugin اختيارية)
title: الفروقات
x-i18n:
    generated_at: "2026-06-27T18:40:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` هي أداة Plugin اختيارية تتضمن إرشادات نظام مدمجة قصيرة وSkill مرافقة تحوّل محتوى التغييرات إلى أثر diff للقراءة فقط للوكلاء.

تقبل إما:

- نص `before` و`after`
- `patch` موحدًا

يمكنها إرجاع:

- عنوان URL لعارض Gateway لعرض canvas
- مسار ملف مُصيَّر (PNG أو PDF) لتسليم الرسائل
- كلا المخرجين في استدعاء واحد

عند تمكينها، تضيف Plugin إرشادات استخدام موجزة في مساحة مطالبة النظام، وتكشف أيضًا عن Skill مفصلة للحالات التي يحتاج فيها الوكيل إلى تعليمات أكمل.

## البدء السريع

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="مكّن Plugin">
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
        تدفقات canvas أولًا: يستدعي الوكلاء `diffs` مع `mode: "view"` ويفتحون `details.viewerUrl` باستخدام `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم ملف الدردشة: يستدعي الوكلاء `diffs` مع `mode: "file"` ويرسلون `details.filePath` باستخدام `message` مع `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        مدمج: يستدعي الوكلاء `diffs` مع `mode: "both"` للحصول على كلا الأثرين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل إرشادات النظام المدمجة

إذا أردت إبقاء أداة `diffs` ممكّنة مع تعطيل إرشادات مطالبة النظام المدمجة بها، فاضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

## سير عمل الوكيل المعتاد

<Steps>
  <Step title="استدعِ diffs">
    يستدعي الوكيل أداة `diffs` مع الإدخال.
  </Step>
  <Step title="اقرأ التفاصيل">
    يقرأ الوكيل حقول `details` من الاستجابة.
  </Step>
  <Step title="اعرض">
    يفتح الوكيل إما `details.viewerUrl` باستخدام `canvas present`، أو يرسل `details.filePath` باستخدام `message` مع `path` أو `filePath`، أو يفعل الأمرين معًا.
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
  نص diff موحد. متنافي مع `before` و`after`.
</ParamField>
<ParamField path="path" type="string">
  اسم ملف العرض لوضع قبل وبعد.
</ParamField>
<ParamField path="lang" type="string">
  تلميح تجاوز اللغة لوضع قبل وبعد. القيم غير المعروفة واللغات خارج مجموعة العارض الافتراضية تعود إلى نص عادي ما لم تكن
  Diff Viewer Language Pack Plugin مثبتة.
</ParamField>

<ParamField path="title" type="string">
  تجاوز عنوان العارض.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  وضع الإخراج. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.mode`. الاسم المستعار المهمل: `"image"` يتصرف مثل `"file"` وما زال مقبولًا للتوافق مع الإصدارات السابقة.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط diff. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  توسيع الأقسام غير المتغيرة عند توفر السياق الكامل. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا لـ Plugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المُصيَّر. القيمة الافتراضية هي إعداد Plugin الافتراضي `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  إعداد جودة مسبق لتصيير PNG أو PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  تجاوز مقياس الجهاز (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  أقصى عرض تصيير بوحدات بكسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  مدة بقاء الأثر بالثواني لمخرجات العارض والملف المستقل. الحد الأقصى 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL للعارض. يتجاوز `viewerBaseUrl` الخاص بـ Plugin. يجب أن يكون `http` أو `https`، بلا استعلام/تجزئة.
</ParamField>

<AccordionGroup>
  <Accordion title="أسماء الإدخال المستعارة القديمة">
    ما زالت مقبولة للتوافق مع الإصدارات السابقة:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="التحقق والحدود">
    - `before` و`after` بحد أقصى 512 KiB لكل منهما.
    - `patch` بحد أقصى 2 MiB.
    - `path` بحد أقصى 2048 بايت.
    - `lang` بحد أقصى 128 بايت.
    - `title` بحد أقصى 1024 بايت.
    - سقف تعقيد Patch: بحد أقصى 128 ملفًا و120000 سطر إجمالي.
    - يتم رفض جمع `patch` مع `before` أو `after`.
    - حدود أمان الملف المُصيَّر (تنطبق على PNG وPDF):
      - `fileQuality: "standard"`: بحد أقصى 8 MP (8,000,000 بكسل مُصيَّر).
      - `fileQuality: "hq"`: بحد أقصى 14 MP (14,000,000 بكسل مُصيَّر).
      - `fileQuality: "print"`: بحد أقصى 24 MP (24,000,000 بكسل مُصيَّر).
      - PDF له أيضًا حد أقصى قدره 50 صفحة.

  </Accordion>
</AccordionGroup>

## تمييز الصياغة

يتضمن OpenClaw تمييز الصياغة للغات المصدر والتكوين والتوثيق الشائعة:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, و`toml`.

تتم تسوية الأسماء المستعارة الشائعة مثل `js` و`ts` و`bash` و`md` و`yml` و`c++` و`dockerfile` و`rb` و`kt` و`ps1` إلى تلك اللغات الافتراضية.

ثبّت Plugin حزمة لغة عارض الفروقات لتمييز لغات أخرى:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

عند توفر حزمة اللغة، يستطيع OpenClaw تمييز عدد أكبر بكثير من اللغات. إذا لم تكن الحزمة مثبتة، فستظل الملفات خارج القائمة الافتراضية تُعرض كنص عادي قابل للقراءة. تشمل الأمثلة Astro وVue وSvelte وMDX وGraphQL وTerraform/HCL وNix وClojure وElixir وHaskell وOCaml وScala وZig وSolidity وVerilog/VHDL وFortran وMATLAB وLaTeX وMermaid وSass/Less/SCSS وNginx وApache وCSV وdotenv وINI وملفات diff.

راجع [Plugin حزمة لغة الفروقات](/ar/plugins/reference/diffs-language-pack) للتفاصيل و[لغات Shiki](https://shiki.style/languages) لفهرس اللغات والأسماء المستعارة الصادر من Shiki.

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
    - `context` (`agentId` و`sessionId` و`messageChannel` و`agentAccountId` عند توفرها)

  </Accordion>
  <Accordion title="File fields">
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
  <Accordion title="Compatibility aliases">
    تُعاد أيضًا للجهات المستدعية الحالية:

    - `format` (القيمة نفسها مثل `fileFormat`)
    - `imagePath` (القيمة نفسها مثل `filePath`)
    - `imageBytes` (القيمة نفسها مثل `fileBytes`)
    - `imageQuality` (القيمة نفسها مثل `fileQuality`)
    - `imageScale` (القيمة نفسها مثل `fileScale`)
    - `imageMaxWidth` (القيمة نفسها مثل `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

ملخص سلوك الوضع:

| الوضع     | ما الذي يُعاد                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                                                    |
| `"file"` | حقول الملف فقط، بدون عنصر عارض.                                                                                  |
| `"both"` | حقول العارض بالإضافة إلى حقول الملف. إذا فشل عرض الملف، فسيظل العارض يُعاد مع `fileError` والاسم المستعار `imageError`. |

## الأقسام غير المتغيرة المطوية

- يمكن للعارض إظهار صفوف مثل `N unmodified lines`.
- عناصر التحكم في التوسيع على تلك الصفوف شرطية وليست مضمونة لكل نوع إدخال.
- تظهر عناصر التحكم في التوسيع عندما يحتوي الفرق المعروض على بيانات سياق قابلة للتوسيع، وهذا شائع لإدخال ما قبل وما بعد.
- في كثير من إدخالات التصحيحات الموحدة، لا تكون أجسام السياق المحذوفة متاحة في مقاطع التصحيح المحللة، لذلك قد يظهر الصف بدون عناصر تحكم في التوسيع. هذا سلوك متوقع.
- ينطبق `expandUnchanged` فقط عند وجود سياق قابل للتوسيع.

## افتراضيات Plugin

اضبط الافتراضيات على مستوى Plugin في `~/.openclaw/openclaw.json`:

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
- `ttlSeconds`

تتجاوز معاملات الأداة الصريحة هذه الافتراضيات.

### إعداد عنوان URL عارض دائم

<ParamField path="viewerBaseUrl" type="string">
  بديل احتياطي مملوك لـ Plugin لروابط العارض المُعادة عندما لا تمرر استدعاءة الأداة `baseUrl`. يجب أن يكون `http` أو `https`، بدون استعلام/تجزئة.
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

## دورة حياة العناصر والتخزين

- تُخزَّن الآثار ضمن المجلد الفرعي المؤقت: `$TMPDIR/openclaw-diffs`.
- تحتوي بيانات تعريف أثر العارض على:
  - معرّف أثر عشوائي (20 حرفًا سداسيًا)
  - رمز عشوائي (48 حرفًا سداسيًا)
  - `createdAt` و`expiresAt`
  - مسار `viewer.html` المخزَّن
- قيمة TTL الافتراضية للأثر هي 30 دقيقة عند عدم تحديدها.
- الحد الأقصى المقبول لقيمة TTL للعارض هو 6 ساعات.
- يعمل التنظيف بصورة انتهازية بعد إنشاء الأثر.
- تُحذف الآثار منتهية الصلاحية.
- يزيل التنظيف الاحتياطي المجلدات القديمة التي يتجاوز عمرها 24 ساعة عند غياب بيانات التعريف.

## عنوان URL للعارض وسلوك الشبكة

مسار العارض:

- `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` عندما يستخدم الفرق لغة من حزمة لغة عارض الفروقات

يحلّ مستند العارض تلك الأصول نسبةً إلى عنوان URL للعارض، لذلك يُحفَظ بادئ مسار `baseUrl` الاختياري لطلبات الأصول أيضًا.

سلوك إنشاء عنوان URL:

- إذا تم توفير `baseUrl` في استدعاء الأداة، فيُستخدم بعد تحقق صارم.
- وإلا، إذا تم تكوين `viewerBaseUrl` في Plugin، فيُستخدم.
- من دون أي من التجاوزين، يكون عنوان URL للعارض افتراضيًا على loopback `127.0.0.1`.
- إذا كان وضع ربط Gateway هو `custom` وتم ضبط `gateway.customBindHost`، فيُستخدم ذلك المضيف.

قواعد `baseUrl`:

- يجب أن يكون `http://` أو `https://`.
- تُرفض الاستعلامات والهاش.
- يُسمح بالأصل مع مسار أساسي اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تقوية العارض">
    - يقتصر افتراضيًا على loopback.
    - مسارات عارض مرمّزة مع تحقق صارم من المعرّف والرمز.
    - CSP لاستجابة العارض:
      - `default-src 'none'`
      - السكربتات والأصول من المصدر نفسه فقط
      - لا يوجد `connect-src` صادر
    - تقييد الإخفاقات البعيدة عند تمكين الوصول البعيد:
      - 40 إخفاقًا كل 60 ثانية
      - قفل لمدة 60 ثانية (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="تقوية عرض الملفات">
    - توجيه طلبات متصفح لقطات الشاشة يرفض افتراضيًا.
    - يُسمح فقط بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - تُحظر طلبات الشبكة الخارجية.

  </Accordion>
</AccordionGroup>

## متطلبات المتصفح لوضع الملف

يحتاج `mode: "file"` و`mode: "both"` إلى متصفح متوافق مع Chromium.

ترتيب الحل:

<Steps>
  <Step title="التكوين">
    `browser.executablePath` في تكوين OpenClaw.
  </Step>
  <Step title="متغيرات البيئة">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="الاحتياطي الخاص بالمنصة">
    احتياطي اكتشاف أمر/مسار المنصة.
  </Step>
</Steps>

نص فشل شائع:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بضبط أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من الإدخال">
    - `Provide patch or both before and after text.` — أدرج كلًا من `before` و`after`، أو وفّر `patch`.
    - `Provide either patch or before/after input, not both.` — لا تخلط بين أوضاع الإدخال.
    - `Invalid baseUrl: ...` — استخدم أصل `http(s)` مع مسار اختياري، من دون استعلام/هاش.
    - `{field} exceeds maximum size (...)` — قلّل حجم الحمولة.
    - رفض الرقعة الكبيرة — قلّل عدد ملفات الرقعة أو إجمالي الأسطر.

  </Accordion>
  <Accordion title="إمكانية الوصول إلى العارض">
    - يُحلّ عنوان URL للعارض إلى `127.0.0.1` افتراضيًا.
    - في سيناريوهات الوصول البعيد، إما:
      - اضبط `viewerBaseUrl` في Plugin، أو
      - مرّر `baseUrl` لكل استدعاء أداة، أو
      - استخدم `gateway.bind=custom` و`gateway.customBindHost`
    - إذا كان `gateway.trustedProxies` يتضمن loopback لوكيل على المضيف نفسه (مثل Tailscale Serve)، فإن طلبات عارض loopback الخام من دون ترويسات عنوان IP للعميل المُعاد توجيهها تفشل مغلقة حسب التصميم.
    - لذلك الهيكل الوكيلي:
      - فضّل `mode: "file"` أو `mode: "both"` عندما تحتاج إلى مرفق فقط، أو
      - مكّن `security.allowRemoteViewer` عمدًا واضبط `viewerBaseUrl` في Plugin أو مرّر `baseUrl` لوكيل/عام عندما تحتاج إلى عنوان URL عارض قابل للمشاركة
    - مكّن `security.allowRemoteViewer` فقط عندما تقصد إتاحة وصول خارجي إلى العارض.

  </Accordion>
  <Accordion title="صف الأسطر غير المعدلة لا يحتوي زر توسيع">
    يمكن أن يحدث هذا مع إدخال الرقعة عندما لا تحمل الرقعة سياقًا قابلًا للتوسيع. هذا متوقع ولا يشير إلى فشل في العارض.
  </Accordion>
  <Accordion title="لم يتم العثور على الأثر">
    - انتهت صلاحية الأثر بسبب TTL.
    - تغيّر الرمز أو المسار.
    - أزال التنظيف بيانات قديمة.

  </Accordion>
</AccordionGroup>

## إرشادات التشغيل

- فضّل `mode: "view"` للمراجعات التفاعلية المحلية في اللوحة.
- فضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطّلًا ما لم يتطلب النشر لديك عناوين URL بعيدة للعارض.
- اضبط `ttlSeconds` قصيرة وصريحة للفروقات الحساسة.
- تجنّب إرسال الأسرار في إدخال الفرق عندما لا يكون ذلك مطلوبًا.
- إذا كانت قناتك تضغط الصور بقوة (مثل Telegram أو WhatsApp)، ففضّل مخرجات PDF (`fileFormat: "pdf"`).

<Note>
محرك عرض الفروقات مدعوم من [Diffs](https://diffs.com).
</Note>

## ذات صلة

- [المتصفح](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

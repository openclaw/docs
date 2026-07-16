---
read_when:
    - تريد من الوكلاء عرض تعديلات الشيفرة أو Markdown على شكل فروق.
    - تريد عنوان URL لعارض جاهز للوحة أو ملف فروق مُصيَّرًا
    - تحتاج إلى عناصر مؤقتة ومضبوطة لعرض الفروق، بإعدادات افتراضية آمنة
sidebarTitle: Diffs
summary: عارض فروق للقراءة فقط ومصيّر ملفات للوكلاء (أداة Plugin اختيارية)
title: الفروقات
x-i18n:
    generated_at: "2026-07-16T14:58:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` هي أداة Plugin مضمّنة اختيارية تحوّل نص ما قبل/ما بعد أو تصحيحًا موحّدًا إلى ناتج فرق للقراءة فقط. كما تضيف إرشادات موجزة للوكيل في بداية مطالبة النظام، وتأتي مع مهارة مصاحبة لتوفير تعليمات أشمل.

الإدخال: نص `before` + `after`، أو `patch` موحّد (وهما متنافيان).

الإخراج: عنوان URL لعارض Gateway للعرض على اللوحة، أو مسار ملف PNG/PDF معروض لتسليمه في رسالة، أو كلاهما.

## البدء السريع

<Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="تمكين Plugin">
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
        تدفقات تفضّل اللوحة: تستدعي الوكلاء `diffs` باستخدام `mode: "view"` وتفتح `details.viewerUrl` باستخدام `canvas present`.
      </Tab>
      <Tab title="file">
        تسليم الملفات في الدردشة: تستدعي الوكلاء `diffs` باستخدام `mode: "file"` وترسل `details.filePath` مع `message` باستخدام `path` أو `filePath`.
      </Tab>
      <Tab title="both">
        الوضع المدمج (الافتراضي): تستدعي الوكلاء `diffs` باستخدام `mode: "both"` للحصول على الناتجين في استدعاء واحد.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## تعطيل إرشادات النظام المضمّنة

للاحتفاظ بالأداة مع حذف الإرشادات المضافة في بداية مطالبة النظام، اضبط `plugins.entries.diffs.hooks.allowPromptInjection` على `false`:

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

يؤدي هذا إلى حظر خطاف `before_prompt_build` الخاص بالـPlugin مع إبقاء الأداة والمهارة متاحتين. لتعطيل الإرشادات والأداة معًا، عطّل Plugin بدلًا من ذلك.

## مرجع إدخال الأداة

جميع الحقول اختيارية ما لم يُذكر خلاف ذلك.

<ParamField path="before" type="string">
  النص الأصلي. مطلوب مع `after` عند إغفال `patch`.
</ParamField>
<ParamField path="after" type="string">
  النص المحدّث. مطلوب مع `before` عند إغفال `patch`.
</ParamField>
<ParamField path="patch" type="string">
  نص فرق موحّد. يتنافى مع `before` و`after`.
</ParamField>
<ParamField path="path" type="string">
  اسم الملف المعروض لوضع ما قبل/ما بعد.
</ParamField>
<ParamField path="lang" type="string">
  تلميح لتجاوز اللغة في وضع ما قبل/ما بعد. تعود القيم غير المعروفة واللغات الخارجة عن مجموعة العارض الافتراضية إلى النص العادي ما لم يكن Plugin حزمة لغات عارض الفروق مثبتًا.
</ParamField>
<ParamField path="title" type="string">
  تجاوز عنوان العارض.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  وضع الإخراج. يستخدم افتراضيًا إعداد Plugin الافتراضي `defaults.mode` ‏(`both`). اسم بديل مهمل: يتصرف `"image"` بالطريقة نفسها تمامًا مثل `"file"`.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  سمة العارض. تستخدم افتراضيًا إعداد Plugin الافتراضي `defaults.theme`.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  تخطيط الفرق. يستخدم افتراضيًا إعداد Plugin الافتراضي `defaults.layout`.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  توسيع الأقسام غير المتغيرة عند توفر السياق الكامل. خيار لكل استدعاء فقط (وليس مفتاحًا افتراضيًا للـPlugin).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  تنسيق الملف المعروض. يستخدم افتراضيًا إعداد Plugin الافتراضي `defaults.fileFormat`.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  إعداد مسبق للجودة لعرض PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  تجاوز مقياس الجهاز (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  أقصى عرض للتصيير بوحدات بكسل CSS ‏(`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  مدة بقاء الناتج بالثواني لمخرجات العارض والملفات المستقلة. الحد الأقصى `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  تجاوز أصل عنوان URL للعارض. يتجاوز `viewerBaseUrl` الخاص بالـPlugin. يجب أن يكون `http` أو `https`، من دون استعلام/تجزئة.
</ParamField>

<AccordionGroup>
  <Accordion title="التحقق والحدود">
    - `before`/`after`: بحد أقصى 512 KiB لكل منهما.
    - `patch`: بحد أقصى 2 MiB.
    - `path`: بحد أقصى 2048 بايت.
    - `lang`: بحد أقصى 128 بايت.
    - `title`: بحد أقصى 1024 بايت.
    - حد تعقيد التصحيح: بحد أقصى 128 ملفًا و120000 سطر إجمالًا.
    - يُرفض `patch` مع `before`/`after`.
    - حدود أمان الملف المعروض (PNG وPDF):
      - `fileQuality: "standard"`: بحد أقصى 8 MP ‏(8,000,000 بكسل معروض).
      - `fileQuality: "hq"`: بحد أقصى 14 MP.
      - `fileQuality: "print"`: بحد أقصى 24 MP.
      - يقتصر PDF أيضًا على 50 صفحة.

  </Accordion>
</AccordionGroup>

## تمييز الصياغة

اللغات المضمّنة:

`javascript`، `typescript`، `tsx`، `jsx`، `json`، `markdown`، `yaml`، `css`، `html`، `sh`، `python`، `go`، `rust`، `java`، `c`، `cpp`، `csharp`، `php`، `sql`، `docker`، `ruby`، `swift`، `kotlin`، `r`، `dart`، `lua`، `powershell`، `xml`، و`toml`.

تُطبّع الأسماء البديلة الشائعة (`js`، `ts`، `bash`، `md`، `yml`، `c++`، `dockerfile`، `rb`، `kt`، `ps1`، إلخ) إلى تلك اللغات.

ثبّت Plugin حزمة لغات عارض الفروق لمزيد من اللغات (Astro وVue وSvelte وMDX وGraphQL وTerraform/HCL وNix وClojure وElixir وHaskell وOCaml وScala وZig وSolidity وVerilog/VHDL وFortran وMATLAB وLaTeX وMermaid وSass/Less/SCSS وNginx وApache وCSV وdotenv وINI وdiff والمزيد):

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

من دون الحزمة، تظل اللغات غير المدعومة معروضة كنص عادي قابل للقراءة. راجع [Plugin حزمة لغات Diffs](/ar/plugins/reference/diffs-language-pack) و[لغات Shiki](https://shiki.style/languages) للاطلاع على الكتالوج الأساسي.

## عقد تفاصيل الإخراج

تتضمن جميع النتائج الناجحة `changed`: يعيد إدخال ما قبل/ما بعد المتطابق `false` من دون إنشاء ناتج؛ وتعيد النتائج المعروضة `true`.

<AccordionGroup>
  <Accordion title="حقول العارض (وضعا view وboth)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` ‏(`agentId`، `sessionId`، `messageChannel`، `agentAccountId` عند توفرها)

  </Accordion>
  <Accordion title="حقول الملف (وضعا file وboth)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (القيمة نفسها لـ`filePath`، للتوافق مع أداة الرسائل)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| الوضع     | المُعاد                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | حقول العارض فقط.                                                                             |
| `"file"` | حقول الملف فقط، من دون ناتج للعارض.                                                           |
| `"both"` | حقول العارض بالإضافة إلى حقول الملف. إذا فشل عرض الملف، يظل العارض يُعاد مع `fileError`. |

### الأقسام غير المتغيرة المطوية

يعرض العارض صفوفًا مثل `N unmodified lines`. لا تظهر عناصر تحكم التوسيع إلا عندما يحتوي الفرق المعروض على بيانات سياق قابلة للتوسيع (وهو المعتاد لإدخال ما قبل/ما بعد). تحذف كثير من التصحيحات الموحّدة نصوص السياق من مقاطعها، لذلك قد يظهر الصف من دون عنصر تحكم للتوسيع؛ وهذا متوقع وليس خطأ. لا ينطبق `expandUnchanged` إلا عند وجود سياق قابل للتوسيع.

### التنقل بين ملفات متعددة

تبدأ التصحيحات التي تمس أكثر من ملف ببطاقة ملخص للملفات المتغيرة: إجمالي أعداد `+N` / `-N`، والأعداد لكل ملف، وشارات الإضافة/الحذف/إعادة التسمية، وروابط ارتساء تنتقل إلى كل ملف. تحتفظ ملفات PNG/PDF المعروضة بأعداد ترويسة كل ملف، لكنها تحذف مفاتيح تبديل العرض التفاعلية لأنها عناصر تحكم غير فعالة في ملف ثابت.

## الإعدادات الافتراضية للـPlugin

عيّن الإعدادات الافتراضية على مستوى Plugin في `~/.openclaw/openclaw.json`:

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

مفاتيح `defaults` المدعومة: `fontFamily`، `fontSize`، `lineSpacing`، `layout`، `showLineNumbers`، `diffIndicators`، `wordWrap`، `background`، `theme`، `fileFormat`، `fileQuality`، `fileScale`، `fileMaxWidth`، `mode`، `ttlSeconds`. تتجاوز معاملات استدعاء الأداة الصريحة هذه الإعدادات.

### إعداد عنوان URL الدائم للعارض

<ParamField path="viewerBaseUrl" type="string">
  الخيار الاحتياطي المملوك للـPlugin لروابط العارض المعادة عندما لا يمرر استدعاء الأداة `baseUrl`. يجب أن يكون `http` أو `https`، من دون استعلام/تجزئة.
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
  `false`: تُرفض الطلبات الواردة إلى مسارات العارض من عناوين غير الاسترجاع المحلي. `true`: يُسمح بالعارضات البعيدة إذا كان المسار المرمّز صالحًا.
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

## دورة حياة الناتج وتخزينه

- توجد النواتج ضمن `$TMPDIR/openclaw-diffs`.
- تخزّن بيانات العارض الوصفية معرّف ناتج عشوائيًا من 20 محرفًا سداسيًا عشريًا، ورمزًا عشوائيًا من 48 محرفًا سداسيًا عشريًا، و`createdAt`/`expiresAt`، ومسار `viewer.html` المخزّن.
- مدة بقاء الناتج الافتراضية: 30 دقيقة. أقصى مدة بقاء مقبولة: 6 ساعات.
- تُشغّل عملية التنظيف انتهازيًا بعد كل استدعاء لإنشاء ناتج؛ وتُحذف النواتج المنتهية.
- تزيل عملية المسح الاحتياطية المجلدات القديمة التي يزيد عمرها على 24 ساعة عند غياب البيانات الوصفية.

## عنوان URL للعارض وسلوك الشبكة

مسار العارض: `/plugins/diffs/view/{artifactId}/{token}`

أصول العارض:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (فقط عندما يستخدم الفرق لغة حزمة لغات)

يحلّ مستند العارض هذه الأصول نسبةً إلى عنوان URL للعارض، لذا تُطبَّق أيضًا بادئة المسار الاختيارية `baseUrl` على طلبات الأصول.

ترتيب حل عنوان URL: ‏`baseUrl` لاستدعاء الأداة (بعد التحقق الصارم) -> ‏`viewerBaseUrl` للـ Plugin -> القيمة الافتراضية للاسترجاع الحلقي `127.0.0.1`. إذا كان وضع ربط Gateway هو `custom` وكانت `gateway.customBindHost` مضبوطة، فسيُستخدم ذلك المضيف بدلًا من الاسترجاع الحلقي.

قواعد `baseUrl`: يجب أن تكون `http://` أو `https://`؛ تُرفض سلسلة الاستعلام والتجزئة؛ ويُسمح بالأصل مع مسار أساسي اختياري.

## نموذج الأمان

<AccordionGroup>
  <Accordion title="تعزيز أمان العارض">
    - الاسترجاع الحلقي فقط افتراضيًا.
    - مسارات عارض مزوّدة برموز مميزة مع تحقق صارم من أنماط المعرّفات والرموز المميزة.
    - سياسة CSP لاستجابة العارض: `default-src 'none'`؛ لا تُحمَّل البرامج النصية/الأصول إلا من المصدر نفسه؛ ولا يُسمح باتصالات `connect-src` الصادرة.
    - تقييد حالات الإخفاق البعيدة عند تمكين الوصول البعيد: يؤدي حدوث 40 إخفاقًا خلال 60 ثانية إلى حظر لمدة 60 ثانية (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="تعزيز أمان عرض الملفات">
    - يُرفض توجيه طلبات متصفح لقطات الشاشة افتراضيًا.
    - لا يُسمح إلا بأصول العارض المحلية من `http://127.0.0.1/plugins/diffs/assets/*`.
    - تُحظر طلبات الشبكة الخارجية.

  </Accordion>
</AccordionGroup>

## متطلبات المتصفح لوضع الملفات

تحتاج `mode: "file"` و`mode: "both"` إلى متصفح متوافق مع Chromium.

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
  <Step title="الخيار الاحتياطي للنظام الأساسي">
    مسارات التثبيت الشائعة وعمليات البحث عبر `PATH` عن Chrome وChromium وEdge وBrave.
  </Step>
</Steps>

نص الإخفاق الشائع: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. أصلح ذلك بتثبيت Chrome أو Chromium أو Edge أو Brave، أو بضبط أحد خيارات مسار الملف التنفيذي أعلاه.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="أخطاء التحقق من صحة الإدخال">
    - `Provide patch or both before and after text.` -- أدرج كلًا من `before` و`after`، أو وفّر `patch`.
    - `Provide either patch or before/after input, not both.` -- لا تخلط بين أوضاع الإدخال.
    - `Invalid baseUrl: ...` -- استخدم أصل `http(s)` مع مسار اختياري، ومن دون استعلام/تجزئة.
    - `{field} exceeds maximum size (...)` -- قلّل حجم الحمولة.
    - رفض التصحيح الكبير -- قلّل عدد ملفات التصحيح أو إجمالي الأسطر.

  </Accordion>
  <Accordion title="إمكانية الوصول إلى العارض">
    - يُحل عنوان URL للعارض إلى `127.0.0.1` افتراضيًا.
    - للوصول البعيد، اضبط إما `viewerBaseUrl` للـ Plugin، أو مرّر `baseUrl` لكل استدعاء، أو استخدم `gateway.bind=custom` مع `gateway.customBindHost`.
    - إذا تضمنت `gateway.trustedProxies` الاسترجاع الحلقي لوكيل على المضيف نفسه (مثل Tailscale Serve)، فستُرفض طلبات العارض المباشرة عبر الاسترجاع الحلقي التي لا تحتوي على ترويسات عنوان IP المُمرَّر للعميل، وذلك عن قصد.
    - لطوبولوجيا الوكيل هذه، يُفضّل استخدام `mode: "file"`/`"both"` لمرفق، أو تمكين `security.allowRemoteViewer` عمدًا إلى جانب `viewerBaseUrl` للـ Plugin/‏`baseUrl` للوكيل للحصول على رابط عارض قابل للمشاركة.
    - لا تمكّن `security.allowRemoteViewer` إلا عندما يكون الوصول الخارجي إلى العارض مقصودًا.

  </Accordion>
  <Accordion title="لا يحتوي صف الأسطر غير المعدّلة على زر توسيع">
    هذا متوقع لإدخال تصحيح يفتقر إلى سياق قابل للتوسيع؛ وليس إخفاقًا في العارض.
  </Accordion>
  <Accordion title="لم يتم العثور على الأثر">
    - انتهت صلاحية الأثر بسبب مدة البقاء.
    - تغيّر الرمز المميز أو المسار.
    - أزالت عملية التنظيف البيانات القديمة.

  </Accordion>
</AccordionGroup>

## إرشادات التشغيل

- يُفضّل `mode: "view"` للمراجعات التفاعلية المحلية في اللوحة.
- يُفضّل `mode: "file"` لقنوات الدردشة الصادرة التي تحتاج إلى مرفق.
- أبقِ `allowRemoteViewer` معطّلة ما لم يتطلب نشرك عناوين URL بعيدة للعارض.
- اضبط مدة `ttlSeconds` قصيرة وصريحة للفروق الحساسة.
- تجنّب إرسال الأسرار في إدخال الفرق عندما لا تكون مطلوبة.
- إذا كانت قناتك تضغط الصور بشدة (مثل Telegram أو WhatsApp)، فيُفضّل إخراج PDF ‏(`fileFormat: "pdf"`).

<Note>
يعمل محرك عرض الفروق بواسطة [Diffs](https://diffs.com).
</Note>

## ذو صلة

- [المتصفح](/ar/tools/browser)
- [Plugins](/ar/tools/plugin)
- [نظرة عامة على الأدوات](/ar/tools)

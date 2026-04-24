---
read_when:
    - تريد تحليل ملفات PDF من الوكلاء
    - تحتاج إلى معلمات أداة PDF وحدودها بدقة
    - أنت تصحح أخطاء الوضع الأصلي لـ PDF مقابل الرجوع الاحتياطي إلى الاستخراج
summary: حلّل مستند PDF واحدًا أو أكثر باستخدام دعم الموفّر الأصلي والرجوع الاحتياطي إلى الاستخراج
title: أداة PDF
x-i18n:
    generated_at: "2026-04-24T08:10:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 945838d1e1164a15720ca76eb156f9f299bf7f603f4591c8fa557b43e4cc93a8
    source_path: tools/pdf.md
    workflow: 15
---

تقوم أداة `pdf` بتحليل مستند PDF واحد أو أكثر وتعيد النص.

السلوك السريع:

- وضع الموفّر الأصلي لموفّري النماذج Anthropic وGoogle.
- وضع الرجوع الاحتياطي إلى الاستخراج بالنسبة إلى الموفّرين الآخرين (استخراج النص أولًا، ثم صور الصفحات عند الحاجة).
- يدعم إدخالًا مفردًا (`pdf`) أو متعددًا (`pdfs`) بحد أقصى 10 ملفات PDF لكل استدعاء.

## التوفر

لا تُسجّل الأداة إلا عندما يتمكن OpenClaw من حل تهيئة نموذج قادر على التعامل مع PDF للوكيل:

1. `agents.defaults.pdfModel`
2. الرجوع إلى `agents.defaults.imageModel`
3. الرجوع إلى النموذج الافتراضي/نموذج الجلسة المحلول الخاص بالوكيل
4. إذا كان موفرو PDF الأصليون مدعومين بالمصادقة، فافضّلهم قبل مرشحي الرجوع العام إلى الصور

إذا تعذر حل أي نموذج صالح للاستخدام، فلن تُعرَض أداة `pdf`.

ملاحظات التوفر:

- سلسلة الرجوع الاحتياطي واعية بالمصادقة. ولا يُعتد بأي `provider/model`
  مهيأ إلا إذا تمكن OpenClaw فعليًا من مصادقة ذلك الموفّر للوكيل.
- موفرو PDF الأصليون حاليًا هما **Anthropic** و**Google**.
- إذا كان موفّر الجلسة/الافتراضي المحلول يمتلك بالفعل نموذج رؤية/PDF مهيأ،
  فإن أداة PDF تعيد استخدامه قبل الرجوع إلى موفّرين آخرين مدعومين بالمصادقة.

## مرجع الإدخال

<ParamField path="pdf" type="string">
مسار أو URL لملف PDF واحد.
</ParamField>

<ParamField path="pdfs" type="string[]">
عدة مسارات أو URLs لملفات PDF، حتى 10 ملفات إجمالًا.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
مطالبة التحليل.
</ParamField>

<ParamField path="pages" type="string">
عامل تصفية للصفحات مثل `1-5` أو `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
تجاوز اختياري للنموذج بصيغة `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
حد الحجم لكل PDF بالميغابايت. يكون الافتراضي `agents.defaults.pdfMaxBytesMb` أو `10`.
</ParamField>

ملاحظات الإدخال:

- يُدمج `pdf` و`pdfs` وتزال التكرارات منهما قبل التحميل.
- إذا لم يُقدَّم أي إدخال PDF، تعيد الأداة خطأ.
- يُحلَّل `pages` بوصفه أرقام صفحات تبدأ من 1، مع إزالة التكرارات، والفرز، والتقييد بحد الصفحات الأقصى المهيأ.
- يكون `maxBytesMb` افتراضيًا هو `agents.defaults.pdfMaxBytesMb` أو `10`.

## مراجع PDF المدعومة

- مسار ملف محلي (بما في ذلك توسيع `~`)
- رابط `file://`
- رابط `http://` و`https://`

ملاحظات المراجع:

- تُرفض مخططات URI الأخرى (مثل `ftp://`) مع `unsupported_pdf_reference`.
- في وضع sandbox، تُرفض روابط `http(s)` البعيدة.
- عند تمكين سياسة الملفات المقصورة على مساحة العمل، تُرفض مسارات الملفات المحلية خارج الجذور المسموح بها.

## أوضاع التنفيذ

### وضع الموفّر الأصلي

يُستخدم الوضع الأصلي للمزوّد `anthropic` و`google`.
وترسل الأداة بايتات PDF الخام مباشرة إلى APIs الخاصة بالموفّر.

حدود الوضع الأصلي:

- `pages` غير مدعوم. وإذا تم ضبطه، تعيد الأداة خطأ.
- إدخال ملفات PDF المتعددة مدعوم؛ حيث يُرسَل كل PDF بوصفه كتلة مستند أصلية /
  جزء PDF مضمن قبل المطالبة.

### وضع الرجوع الاحتياطي إلى الاستخراج

يُستخدم وضع الرجوع الاحتياطي بالنسبة إلى الموفّرين غير الأصليين.

التدفق:

1. استخراج النص من الصفحات المحددة (حتى `agents.defaults.pdfMaxPages`، والافتراضي `20`).
2. إذا كان طول النص المستخرج أقل من `200` حرف، تُحوَّل الصفحات المحددة إلى صور PNG وتُضمَّن.
3. يُرسَل المحتوى المستخرج مع المطالبة إلى النموذج المحدد.

تفاصيل الرجوع الاحتياطي:

- يستخدم استخراج صور الصفحات ميزانية بكسلات قدرها `4,000,000`.
- إذا كان النموذج الهدف لا يدعم إدخال الصور ولم يكن هناك نص قابل للاستخراج، تعيد الأداة خطأ.
- إذا نجح استخراج النص لكن استخراج الصور يتطلب الرؤية على نموذج
  نصي فقط، فإن OpenClaw يسقط الصور المحوّلة ويواصل باستخدام
  النص المستخرج.
- يتطلب الرجوع الاحتياطي إلى الاستخراج الحزمة `pdfjs-dist` ‏(و`@napi-rs/canvas` لتحويل الصور).

## التهيئة

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

راجع [Configuration Reference](/ar/gateway/configuration-reference) للاطلاع على تفاصيل الحقول الكاملة.

## تفاصيل الإخراج

تعيد الأداة النص في `content[0].text` والبيانات الوصفية المنظمة في `details`.

حقول `details` الشائعة:

- `model`: مرجع النموذج المحلول (`provider/model`)
- `native`: ‏`true` لوضع الموفّر الأصلي، و`false` لوضع الرجوع الاحتياطي
- `attempts`: محاولات الرجوع الاحتياطي التي فشلت قبل النجاح

حقول المسار:

- إدخال PDF مفرد: `details.pdf`
- إدخال ملفات PDF متعددة: `details.pdfs[]` مع إدخالات `pdf`
- بيانات وصفية لإعادة كتابة مسار sandbox ‏(عند الاقتضاء): `rewrittenFrom`

## سلوك الأخطاء

- غياب إدخال PDF: يرمي `pdf required: provide a path or URL to a PDF document`
- عدد كبير جدًا من ملفات PDF: يعيد خطأ منظمًا في `details.error = "too_many_pdfs"`
- مخطط مرجع غير مدعوم: يعيد `details.error = "unsupported_pdf_reference"`
- الوضع الأصلي مع `pages`: يرمي خطأ واضحًا `pages is not supported with native PDF providers`

## أمثلة

PDF واحد:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

عدة ملفات PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

نموذج رجوع احتياطي مع تصفية الصفحات:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## ذو صلة

- [Tools Overview](/ar/tools) — جميع أدوات الوكيل المتاحة
- [Configuration Reference](/ar/gateway/config-agents#agent-defaults) — إعدادا pdfMaxBytesMb وpdfMaxPages

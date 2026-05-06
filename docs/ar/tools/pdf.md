---
read_when:
    - تريد تحليل ملفات PDF من الوكلاء
    - تحتاج إلى المعلمات والحدود الدقيقة لأداة PDF
    - أنت تعمل على تصحيح أخطاء وضع PDF الأصلي مقابل مسار الرجوع الاحتياطي للاستخراج
summary: حلّل مستند PDF واحدًا أو أكثر باستخدام دعم المزوّد الأصلي والرجوع الاحتياطي إلى الاستخراج
title: أداة PDF
x-i18n:
    generated_at: "2026-05-06T08:18:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` يحلل مستندا واحدا أو أكثر من مستندات PDF ويعيد النص.

السلوك السريع:

- وضع المزوّد الأصلي لمزوّدي نماذج Anthropic وGoogle.
- وضع الاستخراج الاحتياطي للمزوّدين الآخرين (استخراج النص أولا، ثم صور الصفحات عند الحاجة).
- يدعم إدخالا واحدا (`pdf`) أو متعدد الإدخالات (`pdfs`)، بحد أقصى 10 ملفات PDF لكل استدعاء.

## التوفر

لا تُسجَّل الأداة إلا عندما يتمكن OpenClaw من حل إعداد نموذج قادر على PDF للوكيل:

1. `agents.defaults.pdfModel`
2. الرجوع احتياطيا إلى `agents.defaults.imageModel`
3. الرجوع احتياطيا إلى نموذج الجلسة/النموذج الافتراضي المحلول للوكيل
4. إذا كان مزوّدو PDF الأصليون مدعومين بالمصادقة، ففضّلهم قبل مرشحي الرجوع الاحتياطي العام للصور

إذا لم يمكن حل أي نموذج قابل للاستخدام، فلن تُعرض أداة `pdf`.

ملاحظات التوفر:

- سلسلة الرجوع الاحتياطي واعية بالمصادقة. لا يُحتسب `provider/model` مضبوط إلا إذا
  استطاع OpenClaw فعليا مصادقة ذلك المزوّد للوكيل.
- مزوّدو PDF الأصليون حاليا هم **Anthropic** و**Google**.
- إذا كان مزوّد الجلسة/المزوّد الافتراضي المحلول لديه بالفعل نموذج رؤية/PDF
  مضبوط، فتعيد أداة PDF استخدامه قبل الرجوع احتياطيا إلى مزوّدين آخرين
  مدعومين بالمصادقة.

## مرجع الإدخال

<ParamField path="pdf" type="string">
مسار PDF واحد أو URL واحد.
</ParamField>

<ParamField path="pdfs" type="string[]">
مسارات PDF أو URLs متعددة، حتى 10 إجمالا.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
مطالبة التحليل.
</ParamField>

<ParamField path="pages" type="string">
مرشح صفحات مثل `1-5` أو `1,3,7-9`.
</ParamField>

<ParamField path="model" type="string">
تجاوز اختياري للنموذج بصيغة `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
حد الحجم لكل PDF بالميغابايت. يكون افتراضيا `agents.defaults.pdfMaxBytesMb` أو `10`.
</ParamField>

ملاحظات الإدخال:

- يتم دمج `pdf` و`pdfs` وإزالة التكرارات منهما قبل التحميل.
- إذا لم يُقدَّم أي إدخال PDF، تعيد الأداة خطأ.
- يتم تحليل `pages` كأرقام صفحات تبدأ من 1، مع إزالة التكرارات والفرز والتقييد إلى الحد الأقصى المضبوط للصفحات.
- يكون `maxBytesMb` افتراضيا `agents.defaults.pdfMaxBytesMb` أو `10`.

## مراجع PDF المدعومة

- مسار ملف محلي (بما في ذلك توسيع `~`)
- URL من نوع `file://`
- URL من نوع `http://` و`https://`
- مراجع واردة يديرها OpenClaw مثل `media://inbound/<id>`

ملاحظات المراجع:

- تُرفض مخططات URI الأخرى (مثل `ftp://`) مع `unsupported_pdf_reference`.
- في وضع sandbox، تُرفض URLs البعيدة `http(s)`.
- عند تفعيل سياسة الملفات الخاصة بمساحة العمل فقط، تُرفض مسارات الملفات المحلية خارج الجذور المسموح بها.
- يُسمح بالمراجع الواردة المُدارة والمسارات المعاد تشغيلها ضمن مخزن وسائط OpenClaw الواردة مع سياسة الملفات الخاصة بمساحة العمل فقط.

## أوضاع التنفيذ

### وضع المزوّد الأصلي

يُستخدم الوضع الأصلي للمزوّدين `anthropic` و`google`.
ترسل الأداة بايتات PDF الخام مباشرة إلى APIs المزوّدين.

حدود الوضع الأصلي:

- `pages` غير مدعوم. إذا تم تعيينه، تعيد الأداة خطأ.
- إدخال ملفات PDF متعددة مدعوم؛ يُرسل كل PDF ككتلة مستند أصلية /
  جزء PDF مضمّن قبل المطالبة.

### وضع الاستخراج الاحتياطي

يُستخدم الوضع الاحتياطي للمزوّدين غير الأصليين.

التدفق:

1. استخراج النص من الصفحات المحددة (حتى `agents.defaults.pdfMaxPages`، افتراضيا `20`).
2. إذا كان طول النص المستخرج أقل من `200` حرف، تُعرض الصفحات المحددة إلى صور PNG وتُضمّن.
3. إرسال المحتوى المستخرج مع المطالبة إلى النموذج المحدد.

تفاصيل الرجوع الاحتياطي:

- يستخدم استخراج صور الصفحات ميزانية بكسلات قدرها `4,000,000`.
- إذا كان النموذج الهدف لا يدعم إدخال الصور ولا يوجد نص قابل للاستخراج، تعيد الأداة خطأ.
- إذا نجح استخراج النص لكن استخراج الصور كان سيتطلب رؤية على نموذج
  نصي فقط، يسقط OpenClaw الصور المعروضة ويتابع باستخدام
  النص المستخرج.
- يستخدم الاستخراج الاحتياطي Plugin المضمّن `document-extract`. يملك Plugin
  ‏`pdfjs-dist`؛ ولا يُستخدم `@napi-rs/canvas` إلا عندما يكون الرجوع الاحتياطي
  لعرض الصور متاحا.

## الإعداد

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

راجع [مرجع الإعداد](/ar/gateway/configuration-reference) للتفاصيل الكاملة للحقول.

## تفاصيل الإخراج

تعيد الأداة نصا في `content[0].text` وبيانات وصفية منظمة في `details`.

حقول `details` الشائعة:

- `model`: مرجع النموذج المحلول (`provider/model`)
- `native`: ‏`true` لوضع المزوّد الأصلي، و`false` للرجوع الاحتياطي
- `attempts`: محاولات الرجوع الاحتياطي التي فشلت قبل النجاح

حقول المسار:

- إدخال PDF واحد: `details.pdf`
- إدخالات PDF متعددة: `details.pdfs[]` مع مدخلات `pdf`
- بيانات وصفية لإعادة كتابة مسار sandbox (عند الانطباق): `rewrittenFrom`

## سلوك الأخطاء

- إدخال PDF مفقود: يطرح `pdf required: provide a path or URL to a PDF document`
- عدد ملفات PDF زائد: يعيد خطأ منظما في `details.error = "too_many_pdfs"`
- مخطط مرجع غير مدعوم: يعيد `details.error = "unsupported_pdf_reference"`
- الوضع الأصلي مع `pages`: يطرح خطأ واضحا `pages is not supported with native PDF providers`

## أمثلة

ملف PDF واحد:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

ملفات PDF متعددة:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

نموذج احتياطي بمرشح صفحات:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## ذات صلة

- [نظرة عامة على الأدوات](/ar/tools) - كل أدوات الوكيل المتاحة
- [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults) - إعداد pdfMaxBytesMb وpdfMaxPages

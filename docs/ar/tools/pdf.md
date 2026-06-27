---
read_when:
    - تريد تحليل ملفات PDF من الوكلاء
    - تحتاج إلى معلمات أداة PDF وحدودها الدقيقة
    - أنت تقوم بتصحيح وضع PDF الأصلي مقابل آلية الرجوع إلى الاستخراج
summary: حلّل مستند PDF واحدًا أو أكثر باستخدام دعم المزوّد الأصلي وخيار احتياطي للاستخراج
title: أداة PDF
x-i18n:
    generated_at: "2026-06-27T18:44:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` يحلل مستند PDF واحدًا أو أكثر ويعيد النص.

السلوك السريع:

- وضع المزوّد الأصلي لمزوّدي النماذج Anthropic وGoogle.
- وضع الرجوع إلى الاستخراج للمزوّدين الآخرين (استخراج النص أولًا، ثم صور الصفحات عند الحاجة).
- يدعم إدخالًا منفردًا (`pdf`) أو متعددًا (`pdfs`)، بحد أقصى 10 ملفات PDF لكل استدعاء.

## التوفّر

لا تُسجَّل الأداة إلا عندما يتمكّن OpenClaw من حل إعداد نموذج قادر على PDF للوكيل:

1. `agents.defaults.pdfModel`
2. الرجوع إلى `agents.defaults.imageModel`
3. الرجوع إلى نموذج الجلسة/النموذج الافتراضي المحلول للوكيل
4. إذا كانت مزوّدات PDF الأصلية مدعومة بالمصادقة، فتفضَّل قبل مرشحي الرجوع العام إلى الصور

إذا تعذّر حل أي نموذج قابل للاستخدام، فلن تُعرَض أداة `pdf`.

ملاحظات التوفّر:

- سلسلة الرجوع مدركة للمصادقة. لا يُحتسب `provider/model` مكوَّن إلا إذا كان
  OpenClaw يستطيع فعلًا مصادقة ذلك المزوّد للوكيل.
- مزوّدا PDF الأصليان حاليًا هما **Anthropic** و**Google**.
- إذا كان مزوّد الجلسة/المزوّد الافتراضي المحلول لديه بالفعل نموذج رؤية/PDF
  مكوَّن، تعيد أداة PDF استخدامه قبل الرجوع إلى مزوّدين آخرين مدعومين بالمصادقة.

## مرجع الإدخال

<ParamField path="pdf" type="string">
مسار PDF واحد أو URL واحد.
</ParamField>

<ParamField path="pdfs" type="string[]">
مسارات PDF أو URLs متعددة، حتى 10 إجمالًا.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
موجّه التحليل.
</ParamField>

<ParamField path="pages" type="string">
مرشح صفحات مثل `1-5` أو `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
كلمة مرور ملفات PDF المشفرة في وضع الرجوع إلى الاستخراج.
</ParamField>

<ParamField path="model" type="string">
تجاوز اختياري للنموذج بصيغة `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
حد الحجم لكل PDF بالميغابايت. يُضبط افتراضيًا على `agents.defaults.pdfMaxBytesMb` أو `10`.
</ParamField>

ملاحظات الإدخال:

- يُدمج `pdf` و`pdfs` وتُزال التكرارات قبل التحميل.
- إذا لم يُقدَّم أي إدخال PDF، تُرجع الأداة خطأ.
- يُفسَّر `pages` كأرقام صفحات تبدأ من 1، مع إزالة التكرارات والفرز والتقييد بالحد الأقصى المكوَّن للصفحات.
- ينطبق `password` على كل ملف PDF في الطلب ولا يستخدمه إلا وضع الرجوع إلى الاستخراج.
- يُضبط `maxBytesMb` افتراضيًا على `agents.defaults.pdfMaxBytesMb` أو `10`.

## مراجع PDF المدعومة

- مسار ملف محلي (بما في ذلك توسيع `~`)
- URL بنمط `file://`
- URL بنمط `http://` و`https://`
- مراجع واردة مُدارة بواسطة OpenClaw مثل `media://inbound/<id>`

ملاحظات المراجع:

- تُرفض مخططات URI الأخرى (مثلًا `ftp://`) مع `unsupported_pdf_reference`.
- في وضع sandbox، تُرفض URLs البعيدة عبر `http(s)`.
- عند تفعيل سياسة الملفات الخاصة بمساحة العمل فقط، تُرفض مسارات الملفات المحلية خارج الجذور المسموح بها.
- يُسمح بالمراجع الواردة المُدارة والمسارات المُعادة تحت مخزن الوسائط الواردة في OpenClaw مع سياسة الملفات الخاصة بمساحة العمل فقط.

## أوضاع التنفيذ

### وضع المزوّد الأصلي

يُستخدم الوضع الأصلي للمزوّدين `anthropic` و`google`.
ترسل الأداة بايتات PDF الخام مباشرة إلى APIs المزوّدين.

حدود الوضع الأصلي:

- `pages` غير مدعوم. إذا ضُبط، تُرجع الأداة خطأ.
- `password` غير مدعوم. استخدم نموذجًا غير أصلي لتحليل ملفات PDF المشفرة.
- إدخال PDF متعدد مدعوم؛ يُرسل كل PDF ككتلة مستند أصلية /
  جزء PDF مضمن قبل الموجّه.

### وضع الرجوع إلى الاستخراج

يُستخدم وضع الرجوع للمزوّدين غير الأصليين.

التدفق:

1. استخراج النص من الصفحات المحددة (حتى `agents.defaults.pdfMaxPages`، الافتراضي `20`).
2. إذا كان طول النص المستخرج أقل من `200` حرف، تُعرض الصفحات المحددة كصور PNG وتُضمَّن.
3. إرسال المحتوى المستخرج مع الموجّه إلى النموذج المحدد.

تفاصيل الرجوع:

- يستخدم استخراج صور الصفحات ميزانية بكسلات قدرها `4,000,000`.
- يمكن فتح ملفات PDF المشفرة باستخدام معامل المستوى الأعلى `password`.
- إذا كان النموذج المستهدف لا يدعم إدخال الصور ولا يوجد نص قابل للاستخراج، تُرجع الأداة خطأ.
- إذا نجح استخراج النص لكن استخراج الصور سيتطلب رؤية على نموذج
  نصي فقط، يتجاهل OpenClaw الصور المعروضة ويتابع باستخدام
  النص المستخرج.
- يستخدم الرجوع إلى الاستخراج Plugin `document-extract` المضمّن. يمتلك هذا Plugin
  `clawpdf`، الذي يوفر استخراج النص وعرض الصور عبر PDFium
  WebAssembly.

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

راجع [مرجع الإعداد](/ar/gateway/configuration-reference) لتفاصيل الحقول الكاملة.

## تفاصيل الإخراج

تُرجع الأداة النص في `content[0].text` والبيانات الوصفية المنظمة في `details`.

حقول `details` الشائعة:

- `model`: مرجع النموذج المحلول (`provider/model`)
- `native`: `true` لوضع المزوّد الأصلي، و`false` للرجوع
- `attempts`: محاولات الرجوع التي فشلت قبل النجاح

حقول المسار:

- إدخال PDF واحد: `details.pdf`
- إدخالات PDF متعددة: `details.pdfs[]` مع مدخلات `pdf`
- بيانات وصفية لإعادة كتابة مسار sandbox (عند الانطباق): `rewrittenFrom`

## سلوك الأخطاء

- إدخال PDF مفقود: يرمي `pdf required: provide a path or URL to a PDF document`
- عدد ملفات PDF كبير جدًا: يُرجع خطأ منظمًا في `details.error = "too_many_pdfs"`
- مخطط مرجع غير مدعوم: يُرجع `details.error = "unsupported_pdf_reference"`
- الوضع الأصلي مع `pages`: يرمي خطأ واضحًا `pages is not supported with native PDF providers`

## أمثلة

PDF واحد:

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

نموذج رجوع مع مرشح صفحات:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF مشفر مع الرجوع إلى الاستخراج:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) - كل أدوات الوكيل المتاحة
- [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults) - إعداد pdfMaxBytesMb وpdfMaxPages

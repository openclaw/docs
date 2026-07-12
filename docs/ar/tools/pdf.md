---
read_when:
    - تريد تحليل ملفات PDF بواسطة الوكلاء
    - تحتاج إلى معلمات أداة PDF وحدودها الدقيقة
    - أنت تصحّح أخطاء وضع PDF الأصلي مقارنةً بالرجوع الاحتياطي إلى الاستخراج
summary: حلّل مستند PDF واحدًا أو أكثر باستخدام الدعم الأصلي لمزوّد الخدمة، مع الاستخراج كخيار احتياطي
title: أداة PDF
x-i18n:
    generated_at: "2026-07-12T06:37:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` يحلّل مستند PDF واحدًا أو أكثر ويُرجع نصًا. ويستخدم إدخال المستندات الأصلي في نماذج Anthropic وGoogle، ويلجأ إلى استخراج النصوص/الصور مع جميع المزوّدين الآخرين.

## التوفّر

لا تُسجَّل الأداة إلا عندما يتمكن OpenClaw من تحديد نموذج يدعم PDF للوكيل. ترتيب التحديد:

1. `agents.defaults.pdfModel` (النموذج الأساسي/البدائل المحددة صراحةً)
2. `agents.defaults.imageModel` (النموذج الأساسي/البدائل المحددة صراحةً)
3. نموذج الجلسة/النموذج الافتراضي المحدد للوكيل، إذا كان مزوّده يدعم إدخال PDF الأصلي (Anthropic وGoogle) أو لديه بالفعل نموذج رؤية مُهيّأ
4. المزوّدون المكتشفون تلقائيًا والقادرون على معالجة الصور/الرؤية ولديهم مصادقة صالحة، مع تفضيل المزوّدين الذين يدعمون PDF الأصلي أولًا

تُفحص مصادقة كل نموذج بديل مرشح قبل استخدامه، لذلك لا يُعتدّ بنموذج `provider/model` مُهيّأ إلا إذا تمكن OpenClaw من مصادقة ذلك المزوّد للوكيل. وإذا تعذّر تحديد أي نموذج صالح للاستخدام، فلن تُتاح أداة `pdf`.

## مرجع الإدخال

<ParamField path="pdf" type="string">
مسار ملف PDF واحد أو عنوان URL له.
</ParamField>

<ParamField path="pdfs" type="string[]">
مسارات أو عناوين URL لعدة ملفات PDF، بحد أقصى إجمالي قدره 10.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
موجّه التحليل.
</ParamField>

<ParamField path="pages" type="string">
مرشّح صفحات مثل `1-5` أو `1,3,7-9`. غير مدعوم في وضع المزوّد الأصلي.
</ParamField>

<ParamField path="password" type="string">
كلمة مرور ملفات PDF المشفّرة. تنطبق على كل ملف PDF في الطلب، ولا تُستخدم إلا في وضع الاستخراج الاحتياطي.
</ParamField>

<ParamField path="model" type="string">
تجاوز اختياري للنموذج بصيغة `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
الحد الأقصى لحجم كل ملف PDF بالميغابايت. القيمة الافتراضية هي `agents.defaults.pdfMaxBytesMb`، أو `10` إذا لم تُضبط.
</ParamField>

ملاحظات:

- تُدمج `pdf` و`pdfs` وتُزال التكرارات قبل التحميل؛ ويجب توفير واحدة منهما على الأقل.
- تُحلّل `pages` بوصفها أرقام صفحات تبدأ من 1، ثم تُزال التكرارات وتُرتّب وتُقيّد بحد `agents.defaults.pdfMaxPages` (القيمة الافتراضية `20`). يؤدي النطاق الذي لا يطابق أي صفحات ضمن الحدود إلى خطأ قبل استدعاء النموذج.

## مراجع PDF المدعومة

- مسار ملف محلي (بما في ذلك توسيع `~`)
- عنوان URL من نوع `file://`
- عنوان URL من نوع `http://` أو `https://`
- المراجع الواردة التي يديرها OpenClaw، مثل `media://inbound/<id>`

تُرجع مخططات URI الأخرى (مثل `ftp://`) القيمة `details.error = "unsupported_pdf_reference"`. وتُرفض عناوين URL البعيدة من نوع `http(s)` عند تشغيل الأداة داخل بيئة معزولة. وعند تفعيل سياسة الملفات المقصورة على مساحة العمل، تُرفض المسارات المحلية الواقعة خارج الجذور المسموح بها؛ بينما تظل المراجع الواردة المُدارة والمسارات المعاد تشغيلها ضمن مخزن الوسائط الواردة في OpenClaw مسموحًا بها.

## أوضاع التنفيذ

### وضع المزوّد الأصلي

يُستخدم مع المزوّدين `anthropic` و`google` (وهما المزوّدان الوحيدان اللذان يعلنان حاليًا دعم مستندات PDF الأصلية). تُرسل بايتات PDF الخام مباشرةً إلى واجهة API الخاصة بالمزوّد باعتبارها مستندًا أصليًا/جزء PDF مضمّنًا لكل ملف.

القيود:

- `pages` غير مدعومة؛ وإذا ضُبطت، ترمي الأداة الخطأ `pages is not supported with native PDF providers`.
- `password` غير مدعومة؛ وإذا ضُبطت، ترمي الأداة الخطأ `password is not supported with native PDF providers`. استخدم نموذجًا غير أصلي لملفات PDF المشفّرة.

### وضع الاستخراج الاحتياطي

يُستخدم مع جميع المزوّدين الآخرين.

1. استخراج النص من الصفحات المحددة (حتى `agents.defaults.pdfMaxPages`، والقيمة الافتراضية `20`) عبر Plugin `document-extract` المضمّن، الذي يستخدم حزمة `clawpdf` ‏(PDFium WebAssembly) لاستخراج النصوص والصور.
2. إذا كان النص المستخرج أقصر من `200` حرف، تُصيَّر الصفحات نفسها إلى صور PNG. تبلغ ميزانية التصيير الإجمالية `4,000,000` بكسل، وهي مشتركة بين جميع الصفحات التي تحتاج إلى صور (وتُخصّص تناسبيًا لكل صفحة متبقية، وليس لكل صفحة على حدة)، لذلك تتخطى الصفحات النصية التي تحتوي بالفعل على نص كافٍ عملية التصيير بالكامل.
3. إرسال النص المستخرج (وأي صور مُصيَّرة) مع الموجّه إلى النموذج المحدد.

التفاصيل:

- تُفتح ملفات PDF المشفّرة باستخدام المَعلم `password` ذي المستوى الأعلى.
- إذا كان النموذج لا يدعم إدخال الصور ولا يوجد نص قابل للاستخراج، تُرجع الأداة خطأ.
- إذا فشل تصيير الصور، يتجاهل OpenClaw الصور ويتابع باستخدام النص المستخرج.
- إذا كان النموذج المستهدف نصيًا فقط وأنتج الاستخراج صورًا، يتجاهل OpenClaw الصور ويرسل النص فقط.

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

| المفتاح                         | القيمة الافتراضية | المعنى                                                                                                  |
| ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | غير مضبوط         | نماذج PDF الأساسية/البديلة المحددة صراحةً؛ ويلجأ إلى `imageModel`، ثم إلى نموذج الجلسة.                |
| `agents.defaults.pdfMaxBytesMb` | `10`              | الحد الأقصى لحجم كل ملف PDF بالميغابايت.                                                               |
| `agents.defaults.pdfMaxPages`   | `20`              | الحد الأقصى لعدد الصفحات التي تُعالج لكل ملف PDF.                                                      |

راجع [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults) للاطلاع على التفاصيل الكاملة للحقول.

## تفاصيل الإخراج

تُرجع الأداة النص في `content[0].text` والبيانات الوصفية المنظّمة في `details`.

حقول `details` الشائعة:

- `model`: مرجع النموذج المحدد (`provider/model`)
- `native`: القيمة `true` لوضع المزوّد الأصلي، و`false` للوضع الاحتياطي
- `attempts`: محاولات البدائل التي فشلت قبل النجاح

حقول المسارات:

- إدخال ملف PDF واحد: `details.pdf`
- إدخال عدة ملفات PDF: ‏`details.pdfs[]` مع إدخالات `pdf`
- البيانات الوصفية لإعادة كتابة المسار في البيئة المعزولة (عند انطباق ذلك): `rewrittenFrom`

## سلوك الأخطاء

| الحالة                            | النتيجة                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| عدم وجود إدخال PDF                | يرمي `pdf required: provide a path or URL to a PDF document`   |
| أكثر من 10 ملفات PDF              | `details.error = "too_many_pdfs"`                              |
| مخطط مرجع غير مدعوم               | `details.error = "unsupported_pdf_reference"`                  |
| استخدام `pages` مع مزوّد أصلي     | يرمي `pages is not supported with native PDF providers`        |
| استخدام `password` مع مزوّد أصلي  | يرمي `password is not supported with native PDF providers`     |

## أمثلة

ملف PDF واحد:

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

نموذج احتياطي مع ترشيح الصفحات:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

ملف PDF مشفّر مع الاستخراج الاحتياطي:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## ذو صلة

- [نظرة عامة على الأدوات](/ar/tools) - جميع أدوات الوكيل المتاحة
- [مرجع الإعداد](/ar/gateway/config-agents#agent-defaults) - إعدادا `pdfMaxBytesMb` و`pdfMaxPages`

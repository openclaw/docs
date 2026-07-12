---
read_when:
    - تريد استخدام Gemini لإجراء البحث على الويب
    - تحتاج إلى `GEMINI_API_KEY` أو `models.providers.google.apiKey`
    - تريد الاستناد إلى بحث Google
summary: بحث Gemini على الويب مع الإسناد إلى بحث Google
title: بحث Gemini
x-i18n:
    generated_at: "2026-07-12T06:35:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

يدعم OpenClaw نماذج Gemini مع ميزة مدمجة
[للإسناد إلى بحث Google](https://ai.google.dev/gemini-api/docs/grounding)،
والتي تُرجع إجابات مُولَّدة بالذكاء الاصطناعي ومدعومة بنتائج مباشرة من بحث Google مع
استشهادات.

## الحصول على مفتاح API

<Steps>
  <Step title="إنشاء مفتاح">
    انتقل إلى [Google AI Studio](https://aistudio.google.com/apikey) وأنشئ
    مفتاح API.
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `GEMINI_API_KEY` في بيئة Gateway، أو أعد استخدام
    `models.providers.google.apiKey`، أو اضبط مفتاحًا مخصصًا للبحث على الويب عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## الإعداد

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // اختياري إذا كان GEMINI_API_KEY أو models.providers.google.apiKey معيّنًا
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // اختياري؛ يعود إلى models.providers.google.baseUrl عند عدم تعيينه
            model: "gemini-2.5-flash", // القيمة الافتراضية
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**أسبقية بيانات الاعتماد:** يستخدم بحث Gemini على الويب
`plugins.entries.google.config.webSearch.apiKey` أولًا، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. وبالنسبة إلى عناوين URL الأساسية، تكون الأولوية لعنوان
`plugins.entries.google.config.webSearch.baseUrl` المخصص قبل
`models.providers.google.baseUrl`.

عند تثبيت Gateway، ضع مفاتيح البيئة في `~/.openclaw/.env`.

## آلية العمل

بخلاف موفري البحث التقليديين الذين يُرجعون قائمة من الروابط والمقتطفات،
يستخدم Gemini الإسناد إلى بحث Google لإنتاج إجابات مُولَّدة بالذكاء الاصطناعي مع
استشهادات مضمنة. تتضمن النتائج كلًا من الإجابة المُولَّدة وعناوين URL
للمصادر.

- تُحوَّل عناوين URL للاستشهادات الناتجة عن إسناد Gemini تلقائيًا من عناوين URL
  لإعادة التوجيه في Google إلى عناوين URL مباشرة عبر طلب HEAD من خلال مسار الجلب
  المحمي من SSRF في OpenClaw (اتباع عمليات إعادة التوجيه والتحقق من http/https).
- يستخدم حل عمليات إعادة التوجيه إعدادات SSRF الافتراضية الصارمة، ولذلك تُحظر عمليات
  إعادة التوجيه إلى أهداف خاصة أو داخلية.

## المعلمات المدعومة

يدعم بحث Gemini المعلمات `query` و`freshness` و`date_after` و`date_before`.

تُقبل `count` للتوافق المشترك مع `web_search`، لكن إسناد Gemini
يظل يُرجع إجابة مُولَّدة واحدة مع استشهادات بدلًا من قائمة تضم N من
النتائج.

تقبل `freshness` القيم `day` و`week` و`month` و`year`، والاختصارات المشتركة
`pd` و`pw` و`pm` و`py`. تضيف `day`/`pd` تعليمة حداثة إلى استعلام Gemini
بدلًا من نطاق صارم مدته 24 ساعة. أما `week` و`month` و`year` والنطاقات الصريحة
`date_after`/`date_before` فتعيّن `timeRangeFilter` لإسناد بحث Google
في Gemini. لا تُدعم `country` و`language` و`domain_filter`.

## اختيار النموذج

النموذج الافتراضي هو `gemini-2.5-flash` (سريع وفعّال من حيث التكلفة). يمكن استخدام أي نموذج
Gemini يدعم الإسناد عبر
`plugins.entries.google.config.webSearch.model`.

## تجاوزات عنوان URL الأساسي

عيّن `plugins.entries.google.config.webSearch.baseUrl` عندما يجب توجيه بحث Gemini
على الويب عبر وكيل للمشغّل أو نقطة نهاية مخصصة متوافقة مع Gemini. إذا لم يكن
مُعيّنًا، يعيد بحث Gemini على الويب استخدام `models.providers.google.baseUrl`. تُطبَّع القيمة البسيطة
`https://generativelanguage.googleapis.com` إلى
`https://generativelanguage.googleapis.com/v1beta`؛ وتُحفظ مسارات الوكيل المخصصة
كما قُدّمت بعد إزالة الشرطات المائلة اللاحقة.

## ذو صلة

- [نظرة عامة على البحث على الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظّمة مع مقتطفات
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظّمة + استخراج المحتوى

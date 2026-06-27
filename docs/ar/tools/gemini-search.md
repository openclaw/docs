---
read_when:
    - تريد استخدام Gemini من أجل web_search
    - تحتاج إلى GEMINI_API_KEY أو models.providers.google.apiKey
    - تريد تأسيسًا عبر بحث Google
summary: بحث الويب من Gemini مع التأسيس عبر Google Search
title: بحث Gemini
x-i18n:
    generated_at: "2026-06-27T18:42:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

يدعم OpenClaw نماذج Gemini مع
[الإسناد إلى Google Search](https://ai.google.dev/gemini-api/docs/grounding)
المدمج، الذي يعيد إجابات مركّبة بالذكاء الاصطناعي ومدعومة بنتائج Google Search
المباشرة مع استشهادات.

## الحصول على مفتاح API

<Steps>
  <Step title="Create a key">
    انتقل إلى [Google AI Studio](https://aistudio.google.com/apikey) وأنشئ
    مفتاح API.
  </Step>
  <Step title="Store the key">
    اضبط `GEMINI_API_KEY` في بيئة Gateway، أو أعد استخدام
    `models.providers.google.apiKey`، أو اضبط مفتاحًا مخصصًا لبحث الويب عبر:

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
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

**أولوية بيانات الاعتماد:** يستخدم بحث الويب في Gemini
`plugins.entries.google.config.webSearch.apiKey` أولًا، ثم `GEMINI_API_KEY`،
ثم `models.providers.google.apiKey`. بالنسبة إلى عناوين URL الأساسية، تكون الأولوية
لـ `plugins.entries.google.config.webSearch.baseUrl` المخصص قبل
`models.providers.google.baseUrl`.

لتثبيت Gateway، ضع مفاتيح البيئة في `~/.openclaw/.env`.

## كيف يعمل

بخلاف مزودي البحث التقليديين الذين يعيدون قائمة من الروابط والمقتطفات،
يستخدم Gemini الإسناد إلى Google Search لإنتاج إجابات مركّبة بالذكاء الاصطناعي مع
استشهادات مضمنة. تتضمن النتائج كلًا من الإجابة المركّبة وعناوين URL للمصادر.

- تُحل عناوين URL للاستشهادات من إسناد Gemini تلقائيًا من عناوين URL لإعادة التوجيه من Google
  إلى عناوين URL مباشرة.
- يستخدم حل إعادة التوجيه مسار حارس SSRF (HEAD + فحوص إعادة التوجيه +
  التحقق من http/https) قبل إرجاع عنوان URL النهائي للاستشهاد.
- يستخدم حل إعادة التوجيه إعدادات SSRF الافتراضية الصارمة، لذلك تُحظر عمليات إعادة التوجيه إلى
  الأهداف الخاصة/الداخلية.

## المعلمات المدعومة

يدعم بحث Gemini `query` و`freshness` و`date_after` و`date_before`.

يُقبل `count` للتوافق المشترك مع `web_search`، لكن إسناد Gemini
لا يزال يعيد إجابة مركّبة واحدة مع استشهادات بدلًا من قائمة
نتائج بعدد N.

يقبل `freshness` القيم `day` و`week` و`month` و`year`، والاختصارات المشتركة
`pd` و`pw` و`pm` و`py`. تضيف `day`/`pd` تعليمة حداثة إلى استعلام Gemini
بدلًا من نطاق صارم مدته 24 ساعة. تضبط `week` و`month` و`year` ونطاقات
`date_after`/`date_before` الصريحة
`timeRangeFilter` الخاص بإسناد Gemini إلى Google Search. لا تُدعم
`country` و`language` و`domain_filter`.

## اختيار النموذج

النموذج الافتراضي هو `gemini-2.5-flash` (سريع وفعال من حيث التكلفة). يمكن استخدام أي نموذج Gemini
يدعم الإسناد عبر
`plugins.entries.google.config.webSearch.model`.

## تجاوزات عنوان URL الأساسي

اضبط `plugins.entries.google.config.webSearch.baseUrl` عندما يجب أن يمر بحث الويب في Gemini
عبر وكيل للمشغّل أو نقطة نهاية مخصصة متوافقة مع Gemini. إذا
لم يُضبط ذلك، يعيد بحث الويب في Gemini استخدام `models.providers.google.baseUrl`. تُطبّع قيمة
`https://generativelanguage.googleapis.com` العادية إلى
`https://generativelanguage.googleapis.com/v1beta`؛ وتُحفظ مسارات الوكيل المخصصة
كما قُدمت بعد إزالة الشرطات المائلة اللاحقة.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- كل المزودين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج مهيكلة مع مقتطفات
- [Perplexity Search](/ar/tools/perplexity-search) -- نتائج مهيكلة + استخراج المحتوى

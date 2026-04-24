---
read_when:
    - تريد استخدام Brave Search لـ web_search
    - تحتاج إلى BRAVE_API_KEY أو تفاصيل الخطة
summary: إعداد Brave Search API لـ web_search
title: بحث Brave
x-i18n:
    generated_at: "2026-04-24T08:07:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

يدعم OpenClaw خدمة Brave Search API كمزوّد `web_search`.

## احصل على مفتاح API

1. أنشئ حسابًا في Brave Search API على [https://brave.com/search/api/](https://brave.com/search/api/)
2. من لوحة التحكم، اختر خطة **Search** وولّد مفتاح API.
3. خزّن المفتاح في التهيئة أو اضبط `BRAVE_API_KEY` في بيئة Gateway.

## مثال على التهيئة

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // أو "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

تعيش الآن إعدادات بحث Brave الخاصة بالمزوّد تحت `plugins.entries.brave.config.webSearch.*`.
وما تزال `tools.web.search.apiKey` القديمة تُحمَّل عبر غلاف التوافق، لكنها لم تعد مسار التهيئة القانوني.

يتحكم `webSearch.mode` في وسيلة نقل Brave:

- `web` ‏(الافتراضي): بحث ويب Brave العادي مع العناوين، وعناوين URL، والمقتطفات
- `llm-context`: واجهة Brave LLM Context API مع أجزاء نصية مستخرجة مسبقًا ومصادر من أجل الإسناد

## معلمات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المطلوب إرجاعها (1–10).
</ParamField>

<ParamField path="country" type="string">
رمز بلد ISO مكوّن من حرفين (مثل `US` أو `DE`).
</ParamField>

<ParamField path="language" type="string">
رمز لغة ISO 639-1 لنتائج البحث (مثل `en` أو `de` أو `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
رمز لغة البحث الخاص بـ Brave ‏(مثل `en` أو `en-gb` أو `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
رمز لغة ISO لعناصر واجهة المستخدم.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح الزمن — `day` تعني 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

**أمثلة:**

```javascript
// بحث خاص ببلد ولغة محددين
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// نتائج حديثة (خلال الأسبوع الماضي)
await web_search({
  query: "AI news",
  freshness: "week",
});

// بحث ضمن نطاق تاريخي
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## ملاحظات

- يستخدم OpenClaw خطة **Search** الخاصة بـ Brave. وإذا كانت لديك اشتراك قديم (مثل الخطة المجانية الأصلية مع 2,000 استعلام/شهر)، فما يزال صالحًا لكنه لا يتضمن الميزات الأحدث مثل LLM Context أو حدود المعدل الأعلى.
- تتضمن كل خطة من Brave **رصيدًا مجانيًا بقيمة \$5/شهريًا** ‏(يتجدد). وتكلفة خطة Search هي \$5 لكل 1,000 طلب، لذلك يغطي الرصيد 1,000 استعلام/شهر. اضبط حد الاستخدام لديك في لوحة Brave لتجنب الرسوم غير المتوقعة. راجع [بوابة Brave API](https://brave.com/search/api/) للاطلاع على الخطط الحالية.
- تتضمن خطة Search نقطة نهاية LLM Context وحقوق استدلال AI. أما تخزين النتائج لتدريب النماذج أو ضبطها فيتطلب خطة ذات حقوق تخزين صريحة. راجع [شروط الخدمة](https://api-dashboard.search.brave.com/terms-of-service) الخاصة بـ Brave.
- يعيد وضع `llm-context` إدخالات مصادر مؤسَّسة بدلًا من شكل مقتطفات البحث على الويب العادي.
- لا يدعم وضع `llm-context` المعلمات `ui_lang` أو `freshness` أو `date_after` أو `date_before`.
- يجب أن تتضمن `ui_lang` علامة فرعية للمنطقة مثل `en-US`.
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للتهيئة عبر `cacheTtlMinutes`).

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظّمة مع ترشيح حسب النطاق
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى

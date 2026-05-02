---
read_when:
    - تريد استخدام Brave Search لـ web_search
    - تحتاج إلى BRAVE_API_KEY أو تفاصيل الخطة
summary: إعداد Brave Search API لـ web_search
title: بحث Brave
x-i18n:
    generated_at: "2026-05-02T07:43:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06cfef368f01d0af91ddb4e8adc13b7699019cbf662783b88c573049bfb77e18
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

يدعم OpenClaw واجهة Brave Search API بصفتها مزوّد `web_search`.

## الحصول على مفتاح API

1. أنشئ حساب Brave Search API على [https://brave.com/search/api/](https://brave.com/search/api/)
2. في لوحة التحكم، اختر خطة **Search** وأنشئ مفتاح API.
3. خزّن المفتاح في التهيئة أو عيّن `BRAVE_API_KEY` في بيئة Gateway.

## مثال على التهيئة

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

توجد الآن إعدادات بحث Brave الخاصة بالمزوّد ضمن `plugins.entries.brave.config.webSearch.*`.
ما يزال `tools.web.search.apiKey` القديم يُحمّل عبر طبقة التوافق، لكنه لم يعد مسار التهيئة الرسمي.

يتحكم `webSearch.mode` في نقل Brave:

- `web` (الافتراضي): بحث ويب Brave العادي مع العناوين وعناوين URL والمقتطفات
- `llm-context`: واجهة Brave LLM Context API مع مقاطع نصية ومصادر مستخرجة مسبقًا للإسناد

## معلمات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المراد إرجاعها (1–10).
</ParamField>

<ParamField path="country" type="string">
رمز بلد ISO مكوّن من حرفين (مثل `US` و`DE`).
</ParamField>

<ParamField path="language" type="string">
رمز لغة ISO 639-1 لنتائج البحث (مثل `en` و`de` و`fr`).
</ParamField>

<ParamField path="search_lang" type="string">
رمز لغة بحث Brave (مثل `en` و`en-gb` و`zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
رمز لغة ISO لعناصر واجهة المستخدم.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح الوقت — `day` يعني 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

**أمثلة:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## ملاحظات

- يستخدم OpenClaw خطة Brave **Search**. إذا كان لديك اشتراك قديم (مثل خطة Free الأصلية التي تتضمن 2,000 استعلام/شهر)، فسيظل صالحًا لكنه لا يتضمن ميزات أحدث مثل LLM Context أو حدود معدلات أعلى.
- تتضمن كل خطة Brave **رصيدًا مجانيًا قدره \$5/شهر** (يتجدد). تبلغ تكلفة خطة Search مقدار \$5 لكل 1,000 طلب، لذا يغطي الرصيد 1,000 استعلام/شهر. عيّن حد استخدامك في لوحة تحكم Brave لتجنب الرسوم غير المتوقعة. راجع [بوابة Brave API](https://brave.com/search/api/) للاطلاع على الخطط الحالية.
- تتضمن خطة Search نقطة نهاية LLM Context وحقوق استدلال الذكاء الاصطناعي. يتطلب تخزين النتائج لتدريب النماذج أو ضبطها خطة تتضمن حقوق تخزين صريحة. راجع [شروط خدمة](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- يعيد وضع `llm-context` إدخالات مصادر مسندة بدلًا من شكل مقتطف بحث الويب العادي.
- يدعم وضع `llm-context` النطاقات `freshness` والمحدودة بـ `date_after` + `date_before`. ولا يدعم `ui_lang`؛ يُرفض `date_before` دون `date_after` لأن Brave يتطلب أن تتضمن نطاقات الحداثة المخصصة تاريخي بدء وانتهاء.
- يجب أن يتضمن `ui_lang` وسمًا فرعيًا للمنطقة مثل `en-US`.
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للتهيئة عبر `cacheTtlMinutes`).
- فعّل علم التشخيصات `brave.http` لتسجيل عناوين URL/معلمات الاستعلام لطلبات Brave، وحالة/توقيت الاستجابة، وأحداث إصابة/إخفاق/كتابة ذاكرة التخزين المؤقت للبحث أثناء استكشاف المشكلات وإصلاحها. لا يسجل العلم مطلقًا مفتاح API أو أجسام الاستجابة، لكن استعلامات البحث قد تكون حساسة.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظمة مع تصفية حسب النطاقات
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى

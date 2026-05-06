---
read_when:
    - تريد استخدام Brave Search لـ web_search
    - تحتاج إلى BRAVE_API_KEY أو تفاصيل الخطة
summary: إعداد Brave Search API لـ web_search
title: بحث Brave
x-i18n:
    generated_at: "2026-05-06T08:15:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw يدعم Brave Search API كمزود `web_search`.

## الحصول على مفتاح API

1. أنشئ حساب Brave Search API على [https://brave.com/search/api/](https://brave.com/search/api/)
2. في لوحة التحكم، اختر خطة **Search** وأنشئ مفتاح API.
3. خزّن المفتاح في الإعدادات أو اضبط `BRAVE_API_KEY` في بيئة Gateway.

## مثال الإعدادات

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

إعدادات بحث Brave الخاصة بالمزود أصبحت الآن ضمن `plugins.entries.brave.config.webSearch.*`.
لا يزال `tools.web.search.apiKey` القديم يُحمّل عبر طبقة التوافق، لكنه لم يعد مسار الإعدادات المعتمد.

يتحكم `webSearch.mode` في نقل Brave:

- `web` (الافتراضي): بحث ويب Brave عادي مع عناوين وروابط URL ومقتطفات
- `llm-context`: Brave LLM Context API مع مقاطع نصية ومصادر مستخرجة مسبقًا للتأصيل

يمكن أن يشير `webSearch.baseUrl` بطلبات Brave إلى وكيل موثوق متوافق مع Brave
أو gateway. يضيف OpenClaw المسار `/res/v1/web/search` أو `/res/v1/llm/context` إلى
عنوان URL الأساسي المضبوط، ويحافظ على عنوان URL الأساسي في مفتاح التخزين المؤقت. يجب أن تستخدم
نقاط النهاية العامة `https://`؛ ولا يُقبل `http://` إلا لمضيفي local loopback الموثوقين
أو مضيفي وكلاء الشبكات الخاصة.

## معاملات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المراد إرجاعها (1–10).
</ParamField>

<ParamField path="country" type="string">
رمز البلد وفق ISO من حرفين (مثل `US` و`DE`).
</ParamField>

<ParamField path="language" type="string">
رمز لغة ISO 639-1 لنتائج البحث (مثل `en` و`de` و`fr`).
</ParamField>

<ParamField path="search_lang" type="string">
رمز لغة البحث في Brave (مثل `en` و`en-gb` و`zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
رمز لغة ISO لعناصر واجهة المستخدم.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح الوقت — `day` تعني 24 ساعة.
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

- يستخدم OpenClaw خطة **Search** من Brave. إذا كان لديك اشتراك قديم (مثل الخطة Free الأصلية مع 2,000 استعلام/شهر)، فسيظل صالحًا لكنه لا يتضمن ميزات أحدث مثل LLM Context أو حدود معدلات أعلى.
- تتضمن كل خطة من Brave **رصيدًا مجانيًا قدره \$5/شهر** (يتجدد). تبلغ تكلفة خطة Search ‏\$5 لكل 1,000 طلب، لذا يغطي الرصيد 1,000 استعلام/شهر. اضبط حد الاستخدام في لوحة تحكم Brave لتجنب الرسوم غير المتوقعة. راجع [بوابة Brave API](https://brave.com/search/api/) للاطلاع على الخطط الحالية.
- تتضمن خطة Search نقطة نهاية LLM Context وحقوق استدلال الذكاء الاصطناعي. يتطلب تخزين النتائج لتدريب النماذج أو ضبطها خطة ذات حقوق تخزين صريحة. راجع [شروط خدمة](https://api-dashboard.search.brave.com/terms-of-service) Brave.
- يعيد وضع `llm-context` إدخالات مصادر مؤصلة بدلًا من شكل مقتطفات بحث الويب العادي.
- يدعم وضع `llm-context` النطاقات `freshness` والنطاقات المحددة بـ `date_after` + `date_before`. ولا يدعم `ui_lang`؛ ويتم رفض `date_before` بدون `date_after` لأن Brave يتطلب أن تتضمن نطاقات الحداثة المخصصة تاريخي بداية ونهاية.
- يجب أن يتضمن `ui_lang` وسمًا فرعيًا للمنطقة مثل `en-US`.
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للضبط عبر `cacheTtlMinutes`).
- تُضمّن قيم `webSearch.baseUrl` المخصصة في هوية ذاكرة التخزين المؤقت لـ Brave، بحيث
  لا تتصادم الاستجابات الخاصة بالوكيل.
- فعّل علم التشخيصات `brave.http` لتسجيل عناوين URL/معاملات الاستعلام لطلبات Brave، وحالة الاستجابة/توقيتها، وأحداث إصابة/فوات/كتابة ذاكرة التخزين المؤقت للبحث أثناء استكشاف المشكلات وإصلاحها. لا يسجل العلم مفتاح API أو أجسام الاستجابات مطلقًا، لكن استعلامات البحث قد تكون حساسة.

## ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزودين والاكتشاف التلقائي
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظمة مع ترشيح النطاقات
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى

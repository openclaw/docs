---
read_when:
    - تريد استخدام Brave Search من أجل web_search
    - تحتاج إلى `BRAVE_API_KEY` أو تفاصيل الخطة
summary: إعداد واجهة Brave Search API لأداة web_search
title: بحث Brave
x-i18n:
    generated_at: "2026-07-12T06:40:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

يدعم OpenClaw واجهة Brave Search API بوصفها مزوّدًا لـ `web_search`.

## الحصول على مفتاح API

1. أنشئ حساب Brave Search API على [https://brave.com/search/api/](https://brave.com/search/api/)
2. في لوحة التحكم، اختر خطة **Search** وأنشئ مفتاح API.
3. خزّن المفتاح في الإعدادات أو عيّن `BRAVE_API_KEY` في بيئة Gateway.

## مثال على الإعدادات

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // أو "llm-context"
            baseUrl: "https://api.search.brave.com", // تجاوز اختياري لعنوان URL الأساسي/عنوان الوكيل
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

توجد إعدادات بحث Brave الخاصة بالمزوّد ضمن `plugins.entries.brave.config.webSearch.*`؛ وهذا هو مسار الإعدادات المعتمد. لا يزال كل من `tools.web.search.apiKey` المشترك في المستوى الأعلى و`tools.web.search.brave.*` المقيّد بالنطاق يُحمّلان من خلال دمج توافق، لكن ينبغي للإعدادات الجديدة استخدام المسار المقيّد بنطاق Plugin أعلاه.

يتحكم `webSearch.mode` في آلية نقل Brave:

- `web` (الافتراضي): بحث Brave عادي على الويب يتضمن العناوين وعناوين URL والمقتطفات
- `llm-context`: واجهة Brave LLM Context API مع مقاطع نصية مستخرجة مسبقًا ومصادر للاستناد إليها

يمكن أن يوجّه `webSearch.baseUrl` طلبات Brave إلى وكيل موثوق متوافق مع Brave
أو Gateway. يُلحق OpenClaw المسار `/res/v1/web/search` أو `/res/v1/llm/context`
بعنوان URL الأساسي المُعدّ، ويُبقي عنوان URL الأساسي ضمن مفتاح ذاكرة التخزين المؤقت. يجب أن
تستخدم نقاط النهاية العامة `https://`؛ ولا يُقبل `http://` إلا لمضيفي وكلاء local loopback
الموثوقين أو الموجودين على شبكة خاصة.

## معاملات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المطلوب إرجاعها (1–10).
</ParamField>

<ParamField path="country" type="string">
رمز البلد المكوّن من حرفين وفق معيار ISO (مثل `US` و`DE`).
</ParamField>

<ParamField path="language" type="string">
رمز اللغة وفق ISO 639-1 لنتائج البحث (مثل `en` و`de` و`fr`).
</ParamField>

<ParamField path="search_lang" type="string">
رمز لغة البحث في Brave (مثل `en` و`en-gb` و`zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
رمز لغة ISO لعناصر واجهة المستخدم.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح زمني — تمثّل `day` مدة 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

**أمثلة:**

```javascript
// بحث خاص بالبلد واللغة
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// النتائج الحديثة (الأسبوع الماضي)
await web_search({
  query: "AI news",
  freshness: "week",
});

// البحث ضمن نطاق زمني
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## ملاحظات

- يستخدم OpenClaw خطة **Search** من Brave. إذا كان لديك اشتراك قديم (مثل خطة Free الأصلية التي تتيح 2,000 استعلام شهريًا)، فسيظل صالحًا، لكنه لا يتضمن الميزات الأحدث مثل LLM Context أو حدود المعدل الأعلى.
- تتضمن كل خطة من Brave **رصيدًا مجانيًا بقيمة \$5 شهريًا** (يتجدد). تبلغ تكلفة خطة Search مقدار \$5 لكل 1,000 طلب، لذا يغطي الرصيد 1,000 استعلام شهريًا. عيّن حد الاستخدام في لوحة تحكم Brave لتجنب الرسوم غير المتوقعة. راجع [بوابة Brave API](https://brave.com/search/api/) للاطلاع على الخطط الحالية.
- تتضمن خطة Search نقطة نهاية LLM Context وحقوق استدلال الذكاء الاصطناعي. يتطلب تخزين النتائج لتدريب النماذج أو ضبطها خطة تتضمن حقوق تخزين صريحة. راجع [شروط الخدمة](https://api-dashboard.search.brave.com/terms-of-service) لدى Brave.
- يعيد وضع `llm-context` إدخالات مصادر مستندة إلى مراجع بدلًا من بنية مقتطفات بحث الويب المعتادة.
- يدعم وضع `llm-context` الخيار `freshness` والنطاقات المحدودة التي تجمع بين `date_after` و`date_before`. ولا يدعم `ui_lang`؛ ويُرفض `date_before` من دون `date_after` لأن Brave يشترط أن تتضمن نطاقات الحداثة المخصصة تاريخي البداية والنهاية.
- يجب أن يتضمن `ui_lang` وسمًا فرعيًا للمنطقة مثل `en-US`.
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (ويمكن ضبطها عبر `cacheTtlMinutes`).
- تُضمّن قيم `webSearch.baseUrl` المخصصة في هوية ذاكرة التخزين المؤقت لـ Brave، بحيث
  لا تتعارض الاستجابات الخاصة بالوكيل.
- فعّل علامة التشخيص `brave.http` لتسجيل عناوين URL لمعاملات طلبات Brave/معاملات الاستعلام، وحالة الاستجابة/توقيتها، وأحداث إصابة/فقدان/كتابة ذاكرة التخزين المؤقت للبحث أثناء استكشاف الأخطاء وإصلاحها. لا تسجّل العلامة مطلقًا مفتاح API أو نصوص الاستجابة، لكن استعلامات البحث قد تكون حساسة.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظّمة مع تصفية النطاقات
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى

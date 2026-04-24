---
read_when:
    - تريد استخدام Brave Search مع `web_search`
    - تحتاج إلى `BRAVE_API_KEY` أو تفاصيل الخطة
summary: إعداد Brave Search API لـ `web_search`
title: بحث Brave (المسار القديم)
x-i18n:
    generated_at: "2026-04-24T07:29:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

يدعم OpenClaw واجهة Brave Search API كمزوّد لـ `web_search`.

## الحصول على مفتاح API

1. أنشئ حساب Brave Search API على [https://brave.com/search/api/](https://brave.com/search/api/)
2. في لوحة التحكم، اختر خطة **Search** وأنشئ مفتاح API.
3. خزّن المفتاح في الإعدادات أو اضبط `BRAVE_API_KEY` في بيئة Gateway.

## مثال على الإعداد

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
لا يزال `tools.web.search.apiKey` يُحمَّل عبر طبقة التوافق، لكنه لم يعد مسار الإعداد الأساسي.

يتحكم `webSearch.mode` في آلية النقل الخاصة بـ Brave:

- `web` (الافتراضي): بحث ويب عادي من Brave مع العناوين وعناوين URL والمقتطفات
- `llm-context`: واجهة Brave LLM Context API مع مقاطع نصية مستخرجة مسبقًا ومصادر لدعم الاستناد

## معلمات الأداة

| المعلمة | الوصف |
| ------------- | ------------------------------------------------------------------- |
| `query` | استعلام البحث (مطلوب) |
| `count` | عدد النتائج المطلوب إرجاعها (من 1 إلى 10، الافتراضي: 5) |
| `country` | رمز بلد ISO مكوّن من حرفين (مثل `"US"` و`"DE"`) |
| `language` | رمز لغة ISO 639-1 لنتائج البحث (مثل `"en"` و`"de"` و`"fr"`) |
| `search_lang` | رمز لغة البحث في Brave (مثل `en` و`en-gb` و`zh-hans`) |
| `ui_lang` | رمز لغة ISO لعناصر واجهة المستخدم |
| `freshness` | عامل تصفية زمني: `day` (24 ساعة)، أو `week`، أو `month`، أو `year` |
| `date_after` | النتائج المنشورة بعد هذا التاريخ فقط (YYYY-MM-DD) |
| `date_before` | النتائج المنشورة قبل هذا التاريخ فقط (YYYY-MM-DD) |

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

- يستخدم OpenClaw خطة Brave **Search**. إذا كانت لديك اشتراك قديم (مثل الخطة المجانية الأصلية التي تتضمن 2,000 استعلام شهريًا)، فسيظل صالحًا، لكنه لا يتضمن الميزات الأحدث مثل LLM Context أو حدود المعدّل الأعلى.
- تتضمن كل خطة Brave **رصيدًا مجانيًا بقيمة \$5 شهريًا** (يتجدد). تبلغ تكلفة خطة Search مقدار \$5 لكل 1,000 طلب، لذا يغطي الرصيد 1,000 استعلام شهريًا. اضبط حد الاستخدام في لوحة تحكم Brave لتجنب الرسوم غير المتوقعة. راجع [بوابة Brave API](https://brave.com/search/api/) للاطلاع على الخطط الحالية.
- تتضمن خطة Search نقطة نهاية LLM Context وحقوق استدلال الذكاء الاصطناعي. يتطلب تخزين النتائج لتدريب النماذج أو ضبطها خطة تتضمن حقوق تخزين صريحة. راجع [شروط الخدمة](https://api-dashboard.search.brave.com/terms-of-service) الخاصة بـ Brave.
- يعيد وضع `llm-context` إدخالات مصادر مستندة بدلًا من بنية مقتطفات البحث على الويب المعتادة.
- لا يدعم وضع `llm-context` القيم `ui_lang` أو `freshness` أو `date_after` أو `date_before`.
- يجب أن تتضمن `ui_lang` علامة فرعية للمنطقة مثل `en-US`.
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (ويمكن ضبطها عبر `cacheTtlMinutes`).

راجع [أدوات الويب](/ar/tools/web) للاطلاع على إعداد `web_search` الكامل.

## ذو صلة

- [بحث Brave](/ar/tools/brave-search)

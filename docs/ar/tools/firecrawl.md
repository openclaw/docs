---
read_when:
    - تريد استخراج ويب مدعومًا من Firecrawl
    - تحتاج إلى مفتاح API لـ Firecrawl
    - تريد Firecrawl كمزوّد `web_search`
    - تريد استخراجًا مقاومًا للبوتات لـ `web_fetch`
summary: بحث Firecrawl, وscrape, وfallback لـ web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-04-24T08:08:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 15
---

يمكن لـ OpenClaw استخدام **Firecrawl** بثلاث طرق:

- كمزوّد `web_search`
- كأدوات Plugin صريحة: `firecrawl_search` و`firecrawl_scrape`
- كمستخرج fallback لـ `web_fetch`

إنها خدمة استضافة للاستخراج/البحث تدعم تجاوز البوتات والتخزين المؤقت،
مما يساعد مع المواقع الثقيلة بالـ JS أو الصفحات التي تحظر طلبات HTTP العادية.

## احصل على مفتاح API

1. أنشئ حساب Firecrawl وولّد مفتاح API.
2. خزّنه في التهيئة أو اضبط `FIRECRAWL_API_KEY` في بيئة gateway.

## هيّئ بحث Firecrawl

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يؤدي اختيار Firecrawl أثناء onboarding أو عبر `openclaw configure --section web` إلى تفعيل Plugin Firecrawl المضمّن تلقائيًا.
- يدعم `web_search` مع Firecrawl المعلمتين `query` و`count`.
- بالنسبة إلى عناصر التحكم الخاصة بـ Firecrawl مثل `sources` أو `categories` أو scrape للنتائج، استخدم `firecrawl_search`.
- يجب أن تبقى تجاوزات `baseUrl` على `https://api.firecrawl.dev`.
- `FIRECRAWL_BASE_URL` هو fallback البيئي المشترك لعناوين base URLs الخاصة ببحث Firecrawl وscrape.

## هيّئ scrape في Firecrawl + fallback لـ web_fetch

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

ملاحظات:

- لا تعمل محاولات fallback الخاصة بـ Firecrawl إلا عندما يكون مفتاح API متاحًا (`plugins.entries.firecrawl.config.webFetch.apiKey` أو `FIRECRAWL_API_KEY`).
- يتحكم `maxAgeMs` في عمر النتائج المخزنة مؤقتًا المسموح به (بالمللي ثانية). الافتراضي هو يومان.
- تُرحَّل تهيئة `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.
- تُقيَّد تجاوزات Firecrawl scrape/base URL على `https://api.firecrawl.dev`.

تعيد `firecrawl_scrape` استخدام إعدادات ومتغيرات البيئة نفسها في `plugins.entries.firecrawl.config.webFetch.*`.

## أدوات Plugin الخاصة بـ Firecrawl

### `firecrawl_search`

استخدم هذا عندما تريد عناصر تحكم بحث خاصة بـ Firecrawl بدلًا من `web_search` العام.

المعلمات الأساسية:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

استخدم هذا للصفحات الثقيلة بالـ JS أو المحمية ضد البوتات حيث يكون `web_fetch` العادي ضعيفًا.

المعلمات الأساسية:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## Stealth / تجاوز البوتات

يكشف Firecrawl عن معلمة **proxy mode** لتجاوز البوتات (`basic` أو `stealth` أو `auto`).
يستخدم OpenClaw دائمًا `proxy: "auto"` بالإضافة إلى `storeInCache: true` لطلبات Firecrawl.
إذا تم حذف `proxy`، يستخدم Firecrawl افتراضيًا `auto`. ويقوم `auto` بإعادة المحاولة باستخدام stealth proxies إذا فشلت محاولة أساسية، ما قد يستهلك أرصدة أكثر
من scrape الأساسي فقط.

## كيف يستخدم `web_fetch` خدمة Firecrawl

ترتيب الاستخراج في `web_fetch`:

1. Readability ‏(محلي)
2. Firecrawl ‏(إذا كان محددًا أو تم اكتشافه تلقائيًا كمزوّد web-fetch fallback النشط)
3. تنظيف HTML أساسي ‏(آخر fallback)

مقبض الاختيار هو `tools.web.fetch.provider`. إذا حذفته، يقوم OpenClaw
باكتشاف أول مزوّد web-fetch جاهز تلقائيًا من بيانات الاعتماد المتاحة.
اليوم، المزوّد المضمّن هو Firecrawl.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Web Fetch](/ar/tools/web-fetch) -- أداة `web_fetch` مع fallback من Firecrawl
- [Tavily](/ar/tools/tavily) -- أدوات البحث والاستخراج

---
read_when:
    - تريد استخراجًا من الويب مدعومًا بـ Firecrawl
    - تحتاج إلى مفتاح API لـ Firecrawl
    - تريد استخدام Firecrawl كمزوّد web_search
    - تريد استخراجًا مقاومًا للروبوتات لـ web_fetch
summary: البحث والكشط عبر Firecrawl، والرجوع الاحتياطي إلى web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T07:44:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام **Firecrawl** بثلاث طرق:

- بصفته موفر `web_search`
- كأدوات Plugin صريحة: `firecrawl_search` و`firecrawl_scrape`
- كمستخرج احتياطي لـ `web_fetch`

إنه خدمة مستضافة للاستخراج/البحث تدعم تجاوز البوتات والتخزين المؤقت،
ما يساعد مع المواقع كثيفة JS أو الصفحات التي تحظر عمليات الجلب العادية عبر HTTP.

## الحصول على مفتاح API

1. أنشئ حساب Firecrawl وولّد مفتاح API.
2. خزّنه في الإعدادات أو عيّن `FIRECRAWL_API_KEY` في بيئة Gateway.

## تكوين بحث Firecrawl

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

- يؤدي اختيار Firecrawl في الإعداد الأولي أو `openclaw configure --section web` إلى تفعيل Plugin Firecrawl المضمّن تلقائيًا.
- يدعم `web_search` مع Firecrawl المعلمتين `query` و`count`.
- لعناصر التحكم الخاصة بـ Firecrawl مثل `sources` أو `categories` أو استخراج النتائج، استخدم `firecrawl_search`.
- تكون القيمة الافتراضية لـ `baseUrl` هي Firecrawl المستضاف على `https://api.firecrawl.dev`. لا يُسمح بالتجاوزات ذاتية الاستضافة إلا لنقاط النهاية الخاصة/الداخلية؛ ولا يُقبل HTTP إلا لتلك الأهداف الخاصة.
- `FIRECRAWL_BASE_URL` هو بديل البيئة المشترك لعناوين URL الأساسية لبحث Firecrawl والاستخراج.

## تكوين استخراج Firecrawl + احتياطي web_fetch

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

- لا تُشغَّل محاولات احتياطي Firecrawl إلا عند توفر مفتاح API (`plugins.entries.firecrawl.config.webFetch.apiKey` أو `FIRECRAWL_API_KEY`).
- يتحكم `maxAgeMs` في مدى قِدم النتائج المخزنة مؤقتًا المسموح به (بالمللي ثانية). القيمة الافتراضية هي يومان.
- يتم ترحيل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.
- تتبع تجاوزات عنوان URL الأساسي/الاستخراج في Firecrawl قاعدة الاستضافة/الخصوصية نفسها مثل البحث: تستخدم حركة المرور العامة المستضافة `https://api.firecrawl.dev`؛ ويجب أن تشير التجاوزات ذاتية الاستضافة إلى نقاط نهاية خاصة/داخلية.
- يرفض `firecrawl_scrape` عناوين URL المستهدفة الواضحة الخاصة، وloopback، والبيانات الوصفية، وغير HTTP(S) قبل تمريرها إلى Firecrawl، بما يطابق عقد سلامة الهدف في `web_fetch` لاستدعاءات استخراج Firecrawl الصريحة.

يعيد `firecrawl_scrape` استخدام إعدادات `plugins.entries.firecrawl.config.webFetch.*` نفسها ومتغيرات البيئة نفسها.

### Firecrawl ذاتي الاستضافة

عيّن `plugins.entries.firecrawl.config.webSearch.baseUrl`،
أو `plugins.entries.firecrawl.config.webFetch.baseUrl`، أو `FIRECRAWL_BASE_URL`
عند تشغيل Firecrawl بنفسك. يقبل OpenClaw ‏`http://` فقط لأهداف loopback
أو الشبكة الخاصة أو `.local` أو `.internal` أو `.localhost`. تُرفض المضيفات
العامة المخصصة حتى لا تُرسل مفاتيح Firecrawl API إلى نقاط نهاية عشوائية
عن طريق الخطأ.

## أدوات Plugin في Firecrawl

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

استخدم هذا للصفحات كثيفة JS أو المحمية من البوتات حيث يكون `web_fetch` العادي ضعيفًا.

المعلمات الأساسية:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## التخفي / تجاوز البوتات

يعرض Firecrawl معلمة **وضع proxy** لتجاوز البوتات (`basic` أو `stealth` أو `auto`).
يستخدم OpenClaw دائمًا `proxy: "auto"` بالإضافة إلى `storeInCache: true` لطلبات Firecrawl.
إذا تم حذف proxy، يستخدم Firecrawl القيمة الافتراضية `auto`. يعيد `auto` المحاولة باستخدام وكلاء التخفي إذا فشلت محاولة أساسية، ما قد يستخدم رصيدًا أكثر
من الاستخراج الأساسي فقط.

## كيف يستخدم `web_fetch` Firecrawl

ترتيب استخراج `web_fetch`:

1. Readability (محلي)
2. Firecrawl (إذا تم اختياره أو اكتشافه تلقائيًا بصفته احتياطي جلب الويب النشط)
3. تنظيف HTML الأساسي (آخر احتياطي)

مفتاح الاختيار هو `tools.web.fetch.provider`. إذا حذفته، يكتشف OpenClaw
تلقائيًا أول موفر جاهز لجلب الويب من بيانات الاعتماد المتاحة.
حاليًا، الموفر المضمّن هو Firecrawl.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفرين والاكتشاف التلقائي
- [جلب الويب](/ar/tools/web-fetch) -- أداة web_fetch مع احتياطي Firecrawl
- [Tavily](/ar/tools/tavily) -- أدوات البحث + الاستخراج

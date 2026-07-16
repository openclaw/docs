---
read_when:
    - تريد استخراج محتوى الويب المدعوم من Firecrawl
    - تريد بحث Firecrawl بلا مفتاح (مجاني) أو `web_fetch` بلا مفتاح
    - تحتاج إلى مفتاح Firecrawl API للبحث أو للحصول على حدود استخدام أعلى
    - تريد استخدام Firecrawl كموفّر لـ web_search
    - تريد استخراجًا متجاوزًا لآليات مكافحة الروبوتات لـ web_fetch
summary: بحث Firecrawl واستخراج المحتوى والرجوع الاحتياطي إلى web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-07-16T14:59:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام **Firecrawl** بثلاث طرق:

- بصفته موفّر `web_search`
- بصفته أدوات Plugin صريحة: `firecrawl_search` و`firecrawl_scrape`
- بصفته مستخرِجًا احتياطيًا لـ `web_fetch`

إنه خدمة مستضافة للاستخراج والبحث تدعم تجاوز تدابير مكافحة الروبوتات والتخزين المؤقت، مما يفيد مع المواقع التي تعتمد بكثافة على JavaScript أو الصفحات التي تحظر عمليات الجلب العادية عبر HTTP.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## الوصول دون مفتاح ومفاتيح API

يسجّل Firecrawl موفّرَي `web_search`:

- **بحث Firecrawl** (`firecrawl`) — يستخدم واجهة API المستضافة `/v2/search` مع مفتاحك؛
  ويُكتشف تلقائيًا عند وجود مفتاح.
- **بحث Firecrawl (مجاني)** (`firecrawl-free`) — يستخدم الفئة الابتدائية المستضافة
  التي لا تتطلب مفتاحًا. وهو **متاح بالاشتراك الصريح فقط** ولا يُحدَّد تلقائيًا مطلقًا، لأن
  تحديده يرسل استعلامات البحث إلى الفئة المجانية من Firecrawl.

كما أن خيار Firecrawl الاحتياطي `web_fetch` المحدد صراحةً لا يتطلب مفتاحًا. أما أداتا
`firecrawl_search` و`firecrawl_scrape` الصريحتان فتتطلبان مفتاح API. أضف
`FIRECRAWL_API_KEY` إلى بيئة Gateway أو اضبطه للحصول على حدود أعلى.

## ضبط بحث Firecrawl

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

- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو في `openclaw configure --section web` إلى تمكين Plugin ‏Firecrawl المثبّت تلقائيًا.
- اختر **بحث Firecrawl (مجاني)** أثناء الإعداد الأولي (أو عيّن `provider: "firecrawl-free"`) للتشغيل دون مفتاح API. يرسل موفّر **بحث Firecrawl** المعتمد على المفتاح `plugins.entries.firecrawl.config.webSearch.apiKey` أو `FIRECRAWL_API_KEY`.
- يدعم `web_search` مع Firecrawl كلًا من `query` و`count`.
- لاستخدام عناصر تحكم خاصة بـ Firecrawl مثل `sources` أو `categories` أو استخراج محتوى النتائج، استخدم `firecrawl_search`.
- تكون القيمة الافتراضية لـ `baseUrl` هي Firecrawl المستضاف على `https://api.firecrawl.dev`. لا يُسمح بالتجاوزات ذاتية الاستضافة إلا لنقاط النهاية الخاصة أو الداخلية؛ ولا يُقبل HTTP إلا لتلك الأهداف الخاصة.
- يمثّل `FIRECRAWL_BASE_URL` متغير البيئة الاحتياطي المشترك لعناوين URL الأساسية للبحث والاستخراج في Firecrawl.
- تكون مهلة طلبات بحث Firecrawl افتراضيًا 30 ثانية؛ وتتجاوزها معلمة `timeoutSeconds` في `firecrawl_search` لكل استدعاء.

## ضبط خيار Firecrawl الاحتياطي لـ web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- يعمل خيار Firecrawl الاحتياطي `web_fetch` المحدد صراحةً دون مفتاح API. عند ضبطه، يرسل OpenClaw ‏`plugins.entries.firecrawl.config.webFetch.apiKey` أو `FIRECRAWL_API_KEY` للحصول على حدود أعلى.
- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو في `openclaw configure --section web` إلى تمكين Plugin وتحديد Firecrawl لـ `web_fetch` ما لم يكن موفّر جلب آخر مضبوطًا بالفعل.
- يتطلب `firecrawl_scrape` مفتاح API.
- يتحكم `maxAgeMs` في أقصى عمر للنتائج المخزنة مؤقتًا (بالمللي ثانية). القيمة الافتراضية هي 172,800,000 مللي ثانية (يومان).
- تكون القيمة الافتراضية لـ `onlyMainContent` هي `true`؛ وتكون القيمة الافتراضية لـ `timeoutSeconds` هي 60.
- يرحّل `openclaw doctor --fix` تلقائيًا إعدادات `tools.web.fetch.firecrawl.*` و`tools.web.search.firecrawl.*` القديمة.
- تتبع تجاوزات عناوين URL للاستخراج والأساس في Firecrawl قاعدة الاستضافة/الخصوصية نفسها المتبعة في البحث: تستخدم الحركة العامة المستضافة `https://api.firecrawl.dev`؛ ويجب أن تُحل التجاوزات ذاتية الاستضافة إلى نقاط نهاية خاصة أو داخلية.
- يرفض `firecrawl_scrape` عناوين URL الواضحة التي تشير إلى أهداف خاصة أو استرجاعية أو خاصة بالبيانات الوصفية أو غير مستندة إلى HTTP(S) قبل تمريرها إلى Firecrawl، بما يتوافق مع عقد سلامة الأهداف في `web_fetch` لاستدعاءات استخراج Firecrawl الصريحة.

يعيد `firecrawl_scrape` استخدام إعدادات ومتغيرات البيئة نفسها الخاصة بـ `plugins.entries.firecrawl.config.webFetch.*`، بما في ذلك مفتاح API المطلوب.

### Firecrawl ذاتي الاستضافة

عيّن `plugins.entries.firecrawl.config.webSearch.baseUrl` أو `plugins.entries.firecrawl.config.webFetch.baseUrl` أو `FIRECRAWL_BASE_URL` عند تشغيل Firecrawl بنفسك. لا يقبل OpenClaw ‏`http://` إلا لأهداف الاسترجاع أو الشبكة الخاصة أو `.local` أو `.internal` أو `.localhost`. تُرفض المضيفات العامة المخصصة لمنع إرسال مفاتيح API الخاصة بـ Firecrawl إلى نقاط نهاية عشوائية عن طريق الخطأ.

## أدوات Plugin ‏Firecrawl

### `firecrawl_search`

استخدم هذه الأداة عند الحاجة إلى عناصر تحكم البحث الخاصة بـ Firecrawl بدلًا من `web_search` العام. تتطلب مفتاح API.

المعلمات:

- `query`
- `count` (1-100)
- `sources`
- `categories`
- `includeDomains` / `excludeDomains` (أسماء المضيفين فقط؛ لا يمكن استخدامهما معًا)
- `tbs` (مرشح زمني، مثل `qdr:d` و`qdr:w` و`sbd:1`)
- `location` و`country` (الاستهداف الجغرافي)
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

استخدم هذه الأداة للصفحات التي تعتمد بكثافة على JavaScript أو المحمية من الروبوتات عندما يكون `web_fetch` العادي ضعيفًا.

المعلمات:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## التخفي وتجاوز تدابير مكافحة الروبوتات

تكون القيمة الافتراضية لـ `firecrawl_scrape` وخيار Firecrawl الاحتياطي في `web_fetch` هي `proxy: "auto"` مع `storeInCache: true` ما لم يتجاوز المستدعي هاتين المعلمتين. لا يحتوي `firecrawl_search` وموفّر Firecrawl في `web_search` على عناصر تحكم `proxy`/`storeInCache`؛ إذ لا ينطبق وضع الوكيل المتخفي إلا على طلبات الاستخراج والجلب.

يتحكم وضع `proxy` في Firecrawl في تجاوز تدابير مكافحة الروبوتات (`basic` أو `stealth` أو `auto`). يعيد `auto` المحاولة باستخدام وكلاء متخفين إذا فشلت المحاولة الأساسية، وقد يستهلك ذلك أرصدة أكثر من الاستخراج الأساسي فقط.

## كيفية استخدام `web_fetch` لـ Firecrawl

ترتيب الاستخراج في `web_fetch`:

1. Readability (محلي)
2. موفّر الجلب المضبوط، مثل Firecrawl (عند تحديده، أو اكتشافه تلقائيًا من بيانات الاعتماد المضبوطة)
3. تنظيف HTML الأساسي (الخيار الاحتياطي الأخير)

عنصر التحكم في التحديد هو `tools.web.fetch.provider`. إذا أُغفل، يكتشف OpenClaw تلقائيًا أول موفّر جاهز لجلب الويب من بيانات الاعتماد المتاحة. ويوفّر Plugin ‏Firecrawl الرسمي هذا الخيار الاحتياطي.

## ذو صلة

- [نظرة عامة على البحث في الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [جلب الويب](/ar/tools/web-fetch) -- أداة web_fetch مع خيار Firecrawl الاحتياطي
- [Tavily](/ar/tools/tavily) -- أدوات البحث والاستخراج

---
read_when:
    - تريد استخراج محتوى الويب باستخدام Firecrawl
    - تريد استخدام `web_fetch` من Firecrawl من دون مفتاح
    - تحتاج إلى مفتاح Firecrawl API للبحث أو للحصول على حدود استخدام أعلى
    - تريد استخدام Firecrawl كمزوّد لـ web_search
    - تريد استخراج المحتوى المحمي من الروبوتات باستخدام web_fetch
summary: البحث والاستخراج عبر Firecrawl، والرجوع الاحتياطي إلى `web_fetch`
title: Firecrawl
x-i18n:
    generated_at: "2026-07-12T06:41:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام **Firecrawl** بثلاث طرق:

- بوصفه موفّر `web_search`
- بوصفه أدوات Plugin صريحة: `firecrawl_search` و`firecrawl_scrape`
- بوصفه مستخرجًا احتياطيًا لـ `web_fetch`

إنه خدمة مستضافة للاستخراج والبحث تدعم تجاوز آليات منع الروبوتات والتخزين المؤقت، مما يساعد مع المواقع التي تعتمد بكثافة على JavaScript أو الصفحات التي تحظر عمليات الجلب العادية عبر HTTP.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## استخدام web_fetch من دون مفتاح ومفاتيح API

يدعم الخيار الاحتياطي المستضاف لـ Firecrawl في `web_fetch`، عند اختياره صراحةً، وصولًا مبدئيًا من دون مفتاح API. أضف `FIRECRAWL_API_KEY` إلى بيئة Gateway أو اضبطه عندما تحتاج إلى حدود استخدام أعلى. يتطلب كل من `web_search` عبر Firecrawl و`firecrawl_scrape` مفتاح API.

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

- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو عبر `openclaw configure --section web` إلى تمكين Plugin المثبّت لـ Firecrawl تلقائيًا.
- يدعم `web_search` مع Firecrawl المعلمتين `query` و`count`.
- لعناصر التحكم الخاصة بـ Firecrawl مثل `sources` أو`categories` أو استخراج نتائج البحث، استخدم `firecrawl_search`.
- القيمة الافتراضية لـ `baseUrl` هي خدمة Firecrawl المستضافة على `https://api.firecrawl.dev`. لا يُسمح بالتجاوزات المستضافة ذاتيًا إلا لنقاط النهاية الخاصة/الداخلية؛ ولا يُقبل HTTP إلا لتلك الوجهات الخاصة.
- يُعد `FIRECRAWL_BASE_URL` متغير البيئة الاحتياطي المشترك لعناوين URL الأساسية للبحث والاستخراج عبر Firecrawl.
- تستخدم طلبات بحث Firecrawl افتراضيًا مهلة قدرها 30 ثانية؛ وتتجاوزها معلمة `timeoutSeconds` الخاصة بـ `firecrawl_search` لكل استدعاء.

## ضبط الخيار الاحتياطي لـ Firecrawl في web_fetch

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // الاختيار الصريح يمكّن الخيار الاحتياطي دون مفتاح
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

- يعمل الخيار الاحتياطي لـ Firecrawl في `web_fetch` عند اختياره صراحةً من دون مفتاح API. وعند الضبط، يرسل OpenClaw القيمة `plugins.entries.firecrawl.config.webFetch.apiKey` أو `FIRECRAWL_API_KEY` للحصول على حدود استخدام أعلى.
- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو عبر `openclaw configure --section web` إلى تمكين Plugin واختيار Firecrawl لـ `web_fetch`، ما لم يكن موفّر جلب آخر مضبوطًا بالفعل.
- يتطلب `firecrawl_scrape` مفتاح API.
- يتحكم `maxAgeMs` في الحد الأقصى لعمر النتائج المخزنة مؤقتًا (بالمللي ثانية). القيمة الافتراضية هي 172,800,000 مللي ثانية (يومان).
- القيمة الافتراضية لـ `onlyMainContent` هي `true`، ولـ `timeoutSeconds` هي 60.
- ينقل `openclaw doctor --fix` تلقائيًا إعدادات `tools.web.fetch.firecrawl.*` و`tools.web.search.firecrawl.*` القديمة.
- تتبع تجاوزات عناوين URL الأساسية والاستخراج في Firecrawl قاعدة الاستضافة/الخصوصية نفسها التي يتبعها البحث: تستخدم الحركة العامة المستضافة `https://api.firecrawl.dev`، ويجب أن تُحل التجاوزات المستضافة ذاتيًا إلى نقاط نهاية خاصة/داخلية.
- يرفض `firecrawl_scrape` عناوين URL المستهدفة التي تكون بوضوح خاصة أو استرجاعية أو خاصة بالبيانات الوصفية أو لا تستخدم HTTP(S)، قبل تمريرها إلى Firecrawl، بما يتوافق مع عقد أمان الوجهة الخاص بـ `web_fetch` لاستدعاءات الاستخراج الصريحة عبر Firecrawl.

يعيد `firecrawl_scrape` استخدام إعدادات `plugins.entries.firecrawl.config.webFetch.*` ومتغيرات البيئة نفسها، بما في ذلك مفتاح API المطلوب.

### Firecrawl المستضاف ذاتيًا

عيّن `plugins.entries.firecrawl.config.webSearch.baseUrl` أو `plugins.entries.firecrawl.config.webFetch.baseUrl` أو `FIRECRAWL_BASE_URL` عند تشغيل Firecrawl بنفسك. لا يقبل OpenClaw بروتوكول `http://` إلا لوجهات local loopback أو الشبكة الخاصة أو `.local` أو `.internal` أو `.localhost`. تُرفض المضيفات العامة المخصصة حتى لا تُرسل مفاتيح API الخاصة بـ Firecrawl إلى نقاط نهاية عشوائية عن طريق الخطأ.

## أدوات Plugin الخاصة بـ Firecrawl

### `firecrawl_search`

استخدم هذه الأداة عندما تريد عناصر تحكم خاصة ببحث Firecrawl بدلًا من `web_search` العام.

المعلمات:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

استخدم هذه الأداة للصفحات التي تعتمد بكثافة على JavaScript أو المحمية من الروبوتات، حيث يكون أداء `web_fetch` العادي ضعيفًا.

المعلمات:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## التخفي / تجاوز آليات منع الروبوتات

يستخدم `firecrawl_scrape` والخيار الاحتياطي لـ Firecrawl في `web_fetch` افتراضيًا `proxy: "auto"` مع `storeInCache: true`، ما لم يتجاوز المستدعي هاتين المعلمتين. لا يوفر `firecrawl_search` ولا موفّر Firecrawl لـ `web_search` عناصر تحكم `proxy`/`storeInCache`؛ إذ لا ينطبق وضع وكيل التخفي إلا على طلبات الاستخراج/الجلب.

يتحكم وضع `proxy` في Firecrawl في تجاوز آليات منع الروبوتات (`basic` أو `stealth` أو `auto`). يعيد `auto` المحاولة باستخدام وكلاء التخفي إذا فشلت المحاولة الأساسية، وقد يستهلك ذلك أرصدة أكثر من الاستخراج الذي يستخدم الوضع الأساسي فقط.

## كيفية استخدام `web_fetch` لـ Firecrawl

ترتيب الاستخراج في `web_fetch`:

1. Readability (محلي)
2. موفّر الجلب المضبوط، مثل Firecrawl (عند اختياره، أو اكتشافه تلقائيًا من بيانات الاعتماد المضبوطة)
3. تنظيف HTML الأساسي (الخيار الاحتياطي الأخير)

خيار التحديد هو `tools.web.fetch.provider`. إذا حذفته، يكتشف OpenClaw تلقائيًا أول موفّر جاهز لجلب الويب استنادًا إلى بيانات الاعتماد المتاحة. يوفّر Plugin الرسمي لـ Firecrawl هذا الخيار الاحتياطي.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [جلب الويب](/ar/tools/web-fetch) -- أداة `web_fetch` مع خيار Firecrawl الاحتياطي
- [Tavily](/ar/tools/tavily) -- أدوات البحث والاستخراج

---
read_when:
    - تريد استخراج الويب المدعوم بـ Firecrawl
    - تريد استخدام Firecrawl web_fetch بلا مفتاح
    - تحتاج إلى مفتاح API من Firecrawl للبحث أو للحصول على حدود أعلى
    - تريد Firecrawl كموفّر web_search
    - تريد استخراجًا مضادًا للبوتات لـ web_fetch
summary: بحث Firecrawl وكشطه واحتياطي web_fetch
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T18:42:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

يمكن لـ OpenClaw استخدام **Firecrawl** بثلاث طرق:

- بوصفه موفّر `web_search`
- كأدوات Plugin صريحة: `firecrawl_search` و`firecrawl_scrape`
- كمستخرج احتياطي لـ `web_fetch`

إنه خدمة مستضافة للاستخراج/البحث تدعم التحايل على البوتات والتخزين المؤقت،
وهذا يساعد مع المواقع كثيفة JavaScript أو الصفحات التي تحظر جلب HTTP العادي.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## web_fetch بلا مفتاح ومفاتيح API

يدعم احتياطي `web_fetch` المستضاف من Firecrawl والمحدد صراحة وصولًا أوليًا
من دون مفتاح API. أضف `FIRECRAWL_API_KEY` في بيئة gateway
أو اضبطه عندما تحتاج إلى حدود أعلى. يتطلب Firecrawl `web_search` و
`firecrawl_scrape` مفتاح API.

## إعداد بحث Firecrawl

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

- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو عبر `openclaw configure --section web` إلى تمكين Plugin Firecrawl المثبّت تلقائيًا.
- يدعم `web_search` مع Firecrawl المعاملين `query` و`count`.
- لعناصر تحكم Firecrawl الخاصة مثل `sources` أو `categories` أو كشط النتائج، استخدم `firecrawl_search`.
- القيمة الافتراضية لـ `baseUrl` هي Firecrawl المستضاف عند `https://api.firecrawl.dev`. لا يُسمح بتجاوزات الاستضافة الذاتية إلا لنقاط النهاية الخاصة/الداخلية؛ ولا يُقبل HTTP إلا لهذه الأهداف الخاصة.
- `FIRECRAWL_BASE_URL` هو احتياطي البيئة المشترك لعناوين URL الأساسية للبحث والكشط في Firecrawl.

## إعداد احتياطي Firecrawl لـ web_fetch

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

- يعمل احتياطي `web_fetch` من Firecrawl والمحدد صراحة من دون مفتاح API. عند ضبطه، يرسل OpenClaw القيمة `plugins.entries.firecrawl.config.webFetch.apiKey` أو `FIRECRAWL_API_KEY` للحصول على حدود أعلى.
- يؤدي اختيار Firecrawl أثناء الإعداد الأولي أو عبر `openclaw configure --section web` إلى تمكين Plugin واختيار Firecrawl لـ `web_fetch` ما لم يكن موفّر جلب آخر مضبوطًا بالفعل.
- يتطلب `firecrawl_scrape` مفتاح API.
- يتحكم `maxAgeMs` في مدى قِدم النتائج المخزنة مؤقتًا المسموح به (بالملي ثانية). القيمة الافتراضية يومان.
- تتم ترحيل إعدادات `tools.web.fetch.firecrawl.*` القديمة تلقائيًا بواسطة `openclaw doctor --fix`.
- تتبع تجاوزات عنوان URL الأساسي/الكشط في Firecrawl قاعدة الاستضافة/الخصوصية نفسها المتبعة في البحث: يستخدم المرور العام المستضاف `https://api.firecrawl.dev`؛ ويجب أن تتحلل تجاوزات الاستضافة الذاتية إلى نقاط نهاية خاصة/داخلية.
- يرفض `firecrawl_scrape` عناوين URL الهدف الخاصة وذات loopback والبيانات الوصفية وغير HTTP(S) الواضحة قبل تمريرها إلى Firecrawl، بما يطابق عقد سلامة الهدف في `web_fetch` لاستدعاءات كشط Firecrawl الصريحة.

يعيد `firecrawl_scrape` استخدام إعدادات ومتغيرات البيئة نفسها في `plugins.entries.firecrawl.config.webFetch.*`، بما في ذلك مفتاح API المطلوب.

### Firecrawl مستضاف ذاتيًا

اضبط `plugins.entries.firecrawl.config.webSearch.baseUrl`،
أو `plugins.entries.firecrawl.config.webFetch.baseUrl`، أو `FIRECRAWL_BASE_URL`
عندما تشغّل Firecrawl بنفسك. يقبل OpenClaw استخدام `http://` فقط لأهداف loopback،
أو الشبكات الخاصة، أو `.local`، أو `.internal`، أو `.localhost`. تُرفض المضيفات
العامة المخصصة حتى لا تُرسل مفاتيح API الخاصة بـ Firecrawl إلى نقاط نهاية عشوائية
عن طريق الخطأ.

## أدوات Plugin Firecrawl

### `firecrawl_search`

استخدم هذا عندما تريد عناصر تحكم بحث خاصة بـ Firecrawl بدلًا من `web_search` العام.

المعاملات الأساسية:

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

استخدم هذا للصفحات كثيفة JavaScript أو المحمية من البوتات حيث يكون `web_fetch` العادي ضعيفًا.

المعاملات الأساسية:

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## التخفي / التحايل على البوتات

يعرض Firecrawl معامل **وضع الوكيل** للتحايل على البوتات (`basic` أو `stealth` أو `auto`).
يستخدم OpenClaw دائمًا `proxy: "auto"` مع `storeInCache: true` لطلبات Firecrawl.
إذا حُذف الوكيل، يستخدم Firecrawl القيمة الافتراضية `auto`. يعيد `auto` المحاولة باستخدام وكلاء التخفي إذا فشلت محاولة أساسية، وقد يستهلك ذلك أرصدة أكثر
من الكشط الأساسي فقط.

## كيف يستخدم `web_fetch` Firecrawl

ترتيب الاستخراج في `web_fetch`:

1. Readability (محلي)
2. Firecrawl (عند تحديده، أو اكتشافه تلقائيًا من بيانات الاعتماد المضبوطة)
3. تنظيف HTML الأساسي (آخر احتياطي)

مفتاح الاختيار هو `tools.web.fetch.provider`. إذا حذفته، يكتشف OpenClaw
تلقائيًا أول موفّر جاهز لجلب الويب من بيانات الاعتماد المتاحة.
يوفر Plugin Firecrawl الرسمي ذلك الاحتياطي.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [جلب الويب](/ar/tools/web-fetch) -- أداة web_fetch مع احتياطي Firecrawl
- [Tavily](/ar/tools/tavily) -- أدوات البحث + الاستخراج

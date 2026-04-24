---
read_when:
    - تريد استخدام Perplexity Search للبحث على الويب
    - تحتاج إلى إعداد `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
summary: واجهة Perplexity Search API وتوافق Sonar/OpenRouter مع `web_search`
title: بحث Perplexity (المسار القديم)
x-i18n:
    generated_at: "2026-04-24T07:51:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# واجهة Perplexity Search API

يدعم OpenClaw واجهة Perplexity Search API كمزوّد لـ `web_search`.
وهي تعيد نتائج مهيكلة تحتوي على الحقول `title` و`url` و`snippet`.

ومن أجل التوافق، يدعم OpenClaw أيضًا إعدادات Perplexity Sonar/OpenRouter القديمة.
إذا كنت تستخدم `OPENROUTER_API_KEY`، أو مفتاحًا من نوع `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`، أو تضبط `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`، فإن المزوّد ينتقل إلى مسار chat-completions ويعيد إجابات مُركبة بالذكاء الاصطناعي مع استشهادات بدلًا من نتائج Search API المهيكلة.

## الحصول على مفتاح Perplexity API

1. أنشئ حساب Perplexity على [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. أنشئ مفتاح API في لوحة التحكم
3. خزّن المفتاح في التكوين أو اضبط `PERPLEXITY_API_KEY` في بيئة Gateway.

## توافق OpenRouter

إذا كنت تستخدم OpenRouter بالفعل من أجل Perplexity Sonar، فأبقِ `provider: "perplexity"` واضبط `OPENROUTER_API_KEY` في بيئة Gateway، أو خزّن مفتاحًا من نوع `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`.

عناصر تحكم توافق اختيارية:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## أمثلة التكوين

### واجهة Perplexity Search API الأصلية

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### توافق OpenRouter / Sonar

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## مكان ضبط المفتاح

**عبر التكوين:** شغّل `openclaw configure --section web`. وسيخزّن المفتاح في
`~/.openclaw/openclaw.json` تحت `plugins.entries.perplexity.config.webSearch.apiKey`.
كما يقبل هذا الحقل كائنات SecretRef.

**عبر البيئة:** اضبط `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
في بيئة عملية Gateway. وبالنسبة إلى تثبيت Gateway، ضعه في
`~/.openclaw/.env` (أو في بيئة الخدمة لديك). راجع [متغيرات env](/ar/help/faq#env-vars-and-env-loading).

إذا كان `provider: "perplexity"` مكوّنًا وكانت SecretRef الخاصة بمفتاح Perplexity غير محللة من دون احتياط env، فإن بدء التشغيل/إعادة التحميل يفشل سريعًا.

## معاملات الأداة

تنطبق هذه المعاملات على مسار Perplexity Search API الأصلي.

| المعامل              | الوصف                                                |
| -------------------- | ---------------------------------------------------- |
| `query`              | استعلام البحث (مطلوب)                                |
| `count`              | عدد النتائج المطلوب إرجاعها (1-10، الافتراضي: 5)     |
| `country`            | رمز بلد ISO من حرفين (مثل "US" أو "DE")              |
| `language`           | رمز لغة ISO 639-1 (مثل "en" أو "de" أو "fr")         |
| `freshness`          | مرشح الوقت: `day` ‏(24 ساعة)، أو `week` أو `month` أو `year` |
| `date_after`         | النتائج المنشورة بعد هذا التاريخ فقط (YYYY-MM-DD)    |
| `date_before`        | النتائج المنشورة قبل هذا التاريخ فقط (YYYY-MM-DD)    |
| `domain_filter`      | مصفوفة قائمة سماح/منع للنطاقات (حتى 20)             |
| `max_tokens`         | ميزانية المحتوى الإجمالية (الافتراضي: 25000، الحد الأقصى: 1000000) |
| `max_tokens_per_page`| حد الرموز المميزة لكل صفحة (الافتراضي: 2048)         |

بالنسبة إلى مسار التوافق القديم Sonar/OpenRouter:

- يتم قبول `query` و`count` و`freshness`
- يكون `count` للتوافق فقط هناك؛ إذ تبقى الاستجابة عبارة عن إجابة مركبة واحدة
  مع استشهادات بدلًا من قائمة من N نتائج
- تؤدي المرشحات الخاصة بـ Search API فقط مثل `country` و`language` و`date_after`،
  و`date_before`، و`domain_filter`، و`max_tokens`، و`max_tokens_per_page`
  إلى أخطاء صريحة

**أمثلة:**

```javascript
// بحث خاص ببلد ولغة
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// نتائج حديثة (الأسبوع الماضي)
await web_search({
  query: "AI news",
  freshness: "week",
});

// بحث ضمن نطاق تاريخ
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// تصفية النطاقات (قائمة سماح)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// تصفية النطاقات (قائمة منع - بادئة -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// استخراج محتوى أكثر
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### قواعد تصفية النطاقات

- الحد الأقصى 20 نطاقًا لكل مرشح
- لا يمكن خلط قائمة السماح وقائمة المنع في الطلب نفسه
- استخدم البادئة `-` لإدخالات قائمة المنع (مثل `["-reddit.com"]`)

## ملاحظات

- تعيد Perplexity Search API نتائج بحث ويب مهيكلة (`title` و`url` و`snippet`)
- يؤدي OpenRouter أو ضبط `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` صراحةً إلى إعادة Perplexity إلى Sonar chat completions من أجل التوافق
- يعيد توافق Sonar/OpenRouter إجابة مركبة واحدة مع استشهادات، وليس صفوف نتائج مهيكلة
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (وقابلة للتكوين عبر `cacheTtlMinutes`)

راجع [أدوات الويب](/ar/tools/web) للحصول على تكوين `web_search` الكامل.
وراجع [توثيق Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) لمزيد من التفاصيل.

## ذو صلة

- [بحث Perplexity](/ar/tools/perplexity-search)
- [البحث على الويب](/ar/tools/web)

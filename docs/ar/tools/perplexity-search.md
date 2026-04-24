---
read_when:
    - تريد استخدام Perplexity Search للبحث على الويب
    - تحتاج إلى إعداد `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
summary: واجهة Perplexity Search API وتوافق Sonar/OpenRouter لـ `web_search`
title: بحث Perplexity
x-i18n:
    generated_at: "2026-04-24T08:10:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

يدعم OpenClaw خدمة Perplexity Search API كمزوّد `web_search`.
وهي تعيد نتائج منظّمة تتضمن الحقول `title` و`url` و`snippet`.

ولأغراض التوافق، يدعم OpenClaw أيضًا إعدادات Perplexity Sonar/OpenRouter القديمة.
إذا كنت تستخدم `OPENROUTER_API_KEY`، أو مفتاح `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`، أو تضبط `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`، فإن المزوّد ينتقل إلى مسار chat-completions ويعيد إجابات مركّبة بواسطة AI مع استشهادات بدلًا من نتائج Search API المنظّمة.

## الحصول على مفتاح Perplexity API

1. أنشئ حساب Perplexity على [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. ولّد مفتاح API من لوحة التحكم
3. خزّن المفتاح في التهيئة أو اضبط `PERPLEXITY_API_KEY` في بيئة Gateway.

## توافق OpenRouter

إذا كنت تستخدم OpenRouter بالفعل من أجل Perplexity Sonar، فاحتفظ بـ `provider: "perplexity"` واضبط `OPENROUTER_API_KEY` في بيئة Gateway، أو خزّن مفتاح `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`.

عناصر تحكم توافقية اختيارية:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## أمثلة التهيئة

### Perplexity Search API الأصلية

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

## أين تضبط المفتاح

**عبر التهيئة:** شغّل `openclaw configure --section web`. ويخزّن المفتاح في
`~/.openclaw/openclaw.json` تحت `plugins.entries.perplexity.config.webSearch.apiKey`.
كما يقبل هذا الحقل أيضًا كائنات SecretRef.

**عبر البيئة:** اضبط `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
في بيئة عملية Gateway. في تثبيت gateway، ضعه في
`~/.openclaw/.env` ‏(أو بيئة خدمتك). راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

إذا تم ضبط `provider: "perplexity"` وكان SecretRef الخاص بمفتاح Perplexity غير محلول من دون fallback بيئي، فإن بدء التشغيل/إعادة التحميل يفشل سريعًا.

## معلمات الأداة

تنطبق هذه المعلمات على مسار Perplexity Search API الأصلي.

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المطلوب إرجاعها (1–10).
</ParamField>

<ParamField path="country" type="string">
رمز بلد ISO مكوّن من حرفين (مثل `US` أو `DE`).
</ParamField>

<ParamField path="language" type="string">
رمز لغة ISO 639-1 ‏(مثل `en` أو `de` أو `fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح زمني — `day` تعني 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
مصفوفة قائمة سماح/قائمة حظر للنطاقات (بحد أقصى 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
الميزانية الإجمالية للمحتوى (الحد الأقصى 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
حد tokens لكل صفحة.
</ParamField>

بالنسبة إلى مسار التوافق القديم Sonar/OpenRouter:

- تُقبل `query` و`count` و`freshness`
- تكون `count` للتوافق فقط هناك؛ وتبقى الاستجابة إجابة واحدة مركّبة
  مع استشهادات بدلًا من قائمة من N نتائج
- تُرجع المرشحات الخاصة بـ Search API فقط مثل `country` و`language` و`date_after`,
  و`date_before` و`domain_filter` و`max_tokens` و`max_tokens_per_page`
  أخطاء صريحة

**أمثلة:**

```javascript
// بحث خاص ببلد ولغة محددين
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// نتائج حديثة (خلال الأسبوع الماضي)
await web_search({
  query: "AI news",
  freshness: "week",
});

// بحث ضمن نطاق تاريخي
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ترشيح حسب النطاق (قائمة سماح)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// ترشيح حسب النطاق (قائمة حظر - أضف البادئة -)
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

### قواعد ترشيح النطاق

- الحد الأقصى 20 نطاقًا لكل مرشح
- لا يمكن خلط قائمة سماح وقائمة حظر في الطلب نفسه
- استخدم البادئة `-` لإدخالات قائمة الحظر (مثل `["-reddit.com"]`)

## ملاحظات

- تعيد Perplexity Search API نتائج بحث ويب منظّمة (`title`, `url`, `snippet`)
- يؤدي OpenRouter أو `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` الصريح إلى إعادة Perplexity إلى Sonar chat completions من أجل التوافق
- يعيد توافق Sonar/OpenRouter إجابة واحدة مركّبة مع استشهادات، وليس صفوف نتائج منظّمة
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للتهيئة عبر `cacheTtlMinutes`)

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [توثيق Perplexity Search API](https://docs.perplexity.ai/docs/search/quickstart) -- التوثيق الرسمي لـ Perplexity
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع مرشحات البلد/اللغة
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى

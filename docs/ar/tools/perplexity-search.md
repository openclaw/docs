---
read_when:
    - تريد استخدام Perplexity Search للبحث على الويب
    - تحتاج إلى إعداد PERPLEXITY_API_KEY أو OPENROUTER_API_KEY
summary: توافق Perplexity Search API وSonar/OpenRouter مع web_search
title: بحث Perplexity
x-i18n:
    generated_at: "2026-06-27T18:44:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ef003238bc38dd3d92b98654598cba05fb1c324d8ca766a683cf1defe5bd435
    source_path: tools/perplexity-search.md
    workflow: 16
---

يدعم OpenClaw واجهة Perplexity Search API كموفّر `web_search`.
وتُرجع نتائج منظمة تحتوي على حقول `title` و`url` و`snippet`.

لأغراض التوافق، يدعم OpenClaw أيضًا إعدادات Perplexity Sonar/OpenRouter القديمة.
إذا كنت تستخدم `OPENROUTER_API_KEY`، أو مفتاحًا بصيغة `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`، أو تضبط `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`، فسيتحوّل الموفّر إلى مسار إكمالات المحادثة ويُرجع إجابات مصاغة بالذكاء الاصطناعي مع استشهادات بدلًا من نتائج Search API المنظمة.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## الحصول على مفتاح Perplexity API

1. أنشئ حساب Perplexity على [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. أنشئ مفتاح API في لوحة التحكم
3. خزّن المفتاح في الإعدادات أو اضبط `PERPLEXITY_API_KEY` في بيئة Gateway.

## التوافق مع OpenRouter

إذا كنت تستخدم OpenRouter بالفعل مع Perplexity Sonar، فأبقِ `provider: "perplexity"` واضبط `OPENROUTER_API_KEY` في بيئة Gateway، أو خزّن مفتاحًا بصيغة `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`.

عناصر تحكم اختيارية للتوافق:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## أمثلة الإعدادات

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

### التوافق مع OpenRouter / Sonar

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

**عبر الإعدادات:** شغّل `openclaw configure --section web`. سيخزّن المفتاح في
`~/.openclaw/openclaw.json` ضمن `plugins.entries.perplexity.config.webSearch.apiKey`.
يقبل هذا الحقل أيضًا كائنات SecretRef.

**عبر البيئة:** اضبط `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
في بيئة عملية Gateway. بالنسبة إلى تثبيت Gateway، ضعه في
`~/.openclaw/.env` (أو بيئة خدمتك). راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

إذا كان `provider: "perplexity"` مضبوطًا وكان SecretRef الخاص بمفتاح Perplexity غير محلول ولا يوجد بديل من البيئة، فسيفشل بدء التشغيل/إعادة التحميل بسرعة.

## معاملات الأداة

تنطبق هذه المعاملات على مسار Perplexity Search API الأصلي.

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المراد إرجاعها (1-10).
</ParamField>

<ParamField path="country" type="string">
رمز بلد ISO من حرفين (مثل `US` و`DE`).
</ParamField>

<ParamField path="language" type="string">
رمز لغة ISO 639-1 (مثل `en` و`de` و`fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح زمني - `day` تعني 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
مصفوفة قائمة سماح/حظر للنطاقات (الحد الأقصى 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
إجمالي ميزانية المحتوى (الحد الأقصى 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
حد الرموز لكل صفحة.
</ParamField>

بالنسبة إلى مسار التوافق القديم Sonar/OpenRouter:

- يتم قبول `query` و`count` و`freshness`
- `count` مخصص للتوافق فقط هناك؛ تظل الاستجابة إجابة واحدة مصاغة
  مع استشهادات بدلًا من قائمة نتائج بعدد N
- المرشحات الخاصة بـ Search API فقط مثل `country` و`language` و`date_after`
  و`date_before` و`domain_filter` و`max_tokens` و`max_tokens_per_page`
  تُرجع أخطاء صريحة

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

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### قواعد مرشح النطاقات

- الحد الأقصى 20 نطاقًا لكل مرشح
- لا يمكن مزج قائمة السماح وقائمة الحظر في الطلب نفسه
- استخدم البادئة `-` لإدخالات قائمة الحظر (مثل `["-reddit.com"]`)

## ملاحظات

- تُرجع Perplexity Search API نتائج بحث ويب منظمة (`title` و`url` و`snippet`)
- يؤدي OpenRouter أو الضبط الصريح لـ `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` إلى إعادة Perplexity إلى إكمالات محادثة Sonar لأغراض التوافق
- يُرجع توافق Sonar/OpenRouter إجابة واحدة مصاغة مع استشهادات، وليس صفوف نتائج منظمة
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابل للضبط عبر `cacheTtlMinutes`)

## ذو صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على بحث الويب" href="/ar/tools/web" icon="globe">
    جميع الموفّرين وقواعد الاكتشاف التلقائي.
  </Card>
  <Card title="بحث Brave" href="/ar/tools/brave-search" icon="shield">
    نتائج منظمة مع مرشحات البلد واللغة.
  </Card>
  <Card title="بحث Exa" href="/ar/tools/exa-search" icon="magnifying-glass">
    بحث عصبي مع استخراج المحتوى.
  </Card>
  <Card title="وثائق Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    دليل البدء السريع والمرجع الرسميان لـ Perplexity Search API.
  </Card>
</CardGroup>

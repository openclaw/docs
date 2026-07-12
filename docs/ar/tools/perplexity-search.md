---
read_when:
    - تريد استخدام Perplexity Search للبحث على الويب
    - تحتاج إلى إعداد `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY`
summary: واجهة برمجة تطبيقات Perplexity Search والتوافق مع Sonar/OpenRouter لأداة web_search
title: بحث Perplexity
x-i18n:
    generated_at: "2026-07-12T06:42:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

يدعم OpenClaw واجهة Perplexity Search API بوصفها مزودًا لـ `web_search`. وتُرجع نتائج منظَّمة تتضمن الحقول `title` و`url` و`snippet`.

لأغراض التوافق، يدعم OpenClaw أيضًا إعدادات Perplexity Sonar/OpenRouter القديمة. إذا استخدمت `OPENROUTER_API_KEY`، أو مفتاحًا يبدأ بـ `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`، أو عيّنت `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`، فسيتحول المزود إلى مسار إكمالات المحادثة ويُرجع إجابات مولَّدة بالذكاء الاصطناعي مع استشهادات بدلًا من نتائج Search API المنظَّمة.

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## الحصول على مفتاح Perplexity API

1. أنشئ حساب Perplexity على [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api).
2. أنشئ مفتاح API في لوحة التحكم.
3. خزّن المفتاح في الإعدادات أو عيّن `PERPLEXITY_API_KEY` في بيئة Gateway.

## التوافق مع OpenRouter

إذا كنت تستخدم OpenRouter بالفعل مع Perplexity Sonar، فأبقِ `provider: "perplexity"` وعيّن `OPENROUTER_API_KEY` في بيئة Gateway، أو خزّن مفتاحًا يبدأ بـ `sk-or-...` في `plugins.entries.perplexity.config.webSearch.apiKey`.

عناصر التحكم الاختيارية في التوافق:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## أمثلة على الإعدادات

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

## مكان تعيين المفتاح

**عبر الإعدادات:** شغّل `openclaw configure --section web`. يؤدي ذلك إلى تخزين المفتاح في `~/.openclaw/openclaw.json` ضمن `plugins.entries.perplexity.config.webSearch.apiKey`. يقبل هذا الحقل أيضًا كائنات SecretRef.

**عبر البيئة:** عيّن `PERPLEXITY_API_KEY` أو `OPENROUTER_API_KEY` في بيئة عملية Gateway. عند تثبيت Gateway، ضعه في `~/.openclaw/.env` (أو في بيئة خدمتك). راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

إذا كان `provider: "perplexity"` مهيّأً وتعذر حل SecretRef الخاص بمفتاح Perplexity من دون قيمة احتياطية من البيئة، فسيفشل بدء التشغيل/إعادة التحميل فورًا.

## معاملات الأداة

تنطبق هذه المعاملات على مسار Perplexity Search API الأصلي.

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المطلوب إرجاعها (1-10).
</ParamField>

<ParamField path="country" type="string">
رمز البلد وفق ISO والمكوّن من حرفين (مثل `US` و`DE`).
</ParamField>

<ParamField path="language" type="string">
رمز اللغة وفق ISO 639-1 (مثل `en` و`de` و`fr`).
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
مرشح زمني؛ تمثل `day` مدة 24 ساعة.
</ParamField>

<ParamField path="date_after" type="string">
النتائج المنشورة بعد هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج المنشورة قبل هذا التاريخ فقط (`YYYY-MM-DD`).
</ParamField>

<ParamField path="domain_filter" type="string[]">
مصفوفة قائمة السماح/الحظر للنطاقات (بحد أقصى 20).
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
إجمالي ميزانية المحتوى (بحد أقصى 1000000).
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
حد الرموز لكل صفحة.
</ParamField>

بالنسبة إلى مسار التوافق القديم مع Sonar/OpenRouter:

- تُقبل `query` و`count` و`freshness`.
- تُستخدم `count` لأغراض التوافق فقط في هذا المسار؛ إذ تظل الاستجابة إجابة واحدة مولَّدة مع استشهادات، وليست قائمة من N من النتائج.
- تُرجع المرشحات الخاصة بواجهة Search API فقط (`country` و`language` و`date_after` و`date_before` و`domain_filter` و`max_tokens` و`max_tokens_per_page`) أخطاء صريحة.

**أمثلة:**

```javascript
// بحث خاص ببلد ولغة
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

// بحث ضمن نطاق زمني
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// تصفية النطاقات (قائمة السماح)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// تصفية النطاقات (قائمة الحظر - استخدم السابقة -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// استخراج محتوى إضافي
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### قواعد مرشح النطاقات

- الحد الأقصى 20 نطاقًا لكل مرشح.
- لا يمكن الجمع بين إدخالات قائمة السماح وقائمة الحظر في الطلب نفسه.
- استخدم السابقة `-` لإدخالات قائمة الحظر (مثل `["-reddit.com"]`).

## ملاحظات

- تُرجع Perplexity Search API نتائج بحث ويب منظَّمة (`title` و`url` و`snippet`).
- يؤدي استخدام OpenRouter، أو تعيين `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` صراحةً، إلى إعادة Perplexity إلى إكمالات محادثة Sonar لأغراض التوافق.
- يُرجع التوافق مع Sonar/OpenRouter إجابة واحدة مولَّدة مع استشهادات، وليس صفوف نتائج منظَّمة.
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (يمكن ضبطها عبر `cacheTtlMinutes`).

## موضوعات ذات صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على بحث الويب" href="/ar/tools/web" icon="globe">
    جميع المزودين وقواعد الاكتشاف التلقائي.
  </Card>
  <Card title="بحث Brave" href="/ar/tools/brave-search" icon="shield">
    نتائج منظَّمة مع مرشحات البلد واللغة.
  </Card>
  <Card title="بحث Exa" href="/ar/tools/exa-search" icon="magnifying-glass">
    بحث عصبي مع استخراج المحتوى.
  </Card>
  <Card title="وثائق Perplexity Search API" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    دليل البدء السريع والمرجع الرسميان لواجهة Perplexity Search API.
  </Card>
</CardGroup>

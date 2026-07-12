---
read_when:
    - تريد استخدام Exa لإجراء web_search
    - تحتاج إلى `EXA_API_KEY`
    - تريد بحثًا عصبيًا أو استخراجًا للمحتوى
summary: بحث Exa AI — بحث عصبي وبالكلمات المفتاحية مع استخراج المحتوى
title: بحث Exa
x-i18n:
    generated_at: "2026-07-12T06:41:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

يُعد [Exa AI](https://exa.ai/) مزوّدًا لـ `web_search` يوفّر أوضاع البحث العصبي، وبالكلمات المفتاحية، والهجين، بالإضافة إلى استخراج المحتوى المدمج (المقتطفات البارزة، والنصوص، والملخصات).

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## الحصول على مفتاح API

<Steps>
  <Step title="إنشاء حساب">
    سجّل في [exa.ai](https://exa.ai/) وأنشئ مفتاح API من لوحة التحكم الخاصة بك.
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `EXA_API_KEY` في بيئة Gateway، أو اضبطه باستخدام:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## الإعداد

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // اختياري إذا كان EXA_API_KEY معيّنًا
            baseUrl: "https://api.exa.ai", // اختياري؛ يضيف OpenClaw المسار /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**بديل متغير البيئة:** عيّن `EXA_API_KEY` في بيئة Gateway. عند تثبيت Gateway، ضعه في `~/.openclaw/.env`. راجع [متغيرات البيئة](/ar/help/faq#env-vars-and-env-loading).

## تجاوز عنوان URL الأساسي

عيّن `plugins.entries.exa.config.webSearch.baseUrl` لتوجيه طلبات بحث Exa عبر وكيل متوافق أو نقطة نهاية بديلة. يطبّع OpenClaw المضيفات المجرّدة بإضافة `https://` في بدايتها، ويضيف `/search` ما لم يكن المسار ينتهي به بالفعل. تُعد نقطة النهاية النهائية جزءًا من مفتاح ذاكرة التخزين المؤقت للبحث، لذلك لا تُشارك النتائج بين نقاط النهاية المختلفة مطلقًا.

## معاملات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number" default="5">
عدد النتائج المطلوب إرجاعها (من 1 إلى 100، وفقًا لحدود نوع البحث في Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
وضع البحث.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
عامل تصفية زمني. لا يمكن دمجه مع `date_after`/`date_before`.
</ParamField>

<ParamField path="date_after" type="string">
النتائج اللاحقة لهذا التاريخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج السابقة لهذا التاريخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
خيارات استخراج المحتوى (انظر أدناه).
</ParamField>

### استخراج المحتوى

مرّر كائن `contents` للتحكم في المحتوى المستخرج ضمن النتائج:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // النص الكامل للصفحة
    highlights: { numSentences: 3 }, // الجمل الرئيسية
    summary: true, // ملخص مولّد بالذكاء الاصطناعي
  },
});
```

| خيار المحتوى   | النوع                                                                  | الوصف                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج النص الكامل للصفحة   |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج الجمل الرئيسية       |
| `summary`       | `boolean \| { query }`                                                | ملخص مولّد بالذكاء الاصطناعي |

إذا حُذف `contents`، تستخدم Exa القيمة الافتراضية `{ highlights: true }` كي تتضمن النتائج مقتطفات من الجمل الرئيسية. تُستمد أوصاف النتائج أولًا من المقتطفات البارزة، ثم من الملخص، ثم من النص الكامل، بحسب أول ما يتوفر منها. تحتفظ النتائج أيضًا بحقلَي `highlightScores` و`summary` الخام من استجابة Exa API عند توفرهما.

### أوضاع البحث

| الوضع            | الوصف                                  |
| ---------------- | -------------------------------------- |
| `auto`           | تختار Exa أفضل وضع (الافتراضي)        |
| `neural`         | بحث دلالي قائم على المعنى              |
| `fast`           | بحث سريع بالكلمات المفتاحية           |
| `deep`           | بحث عميق وشامل                         |
| `deep-reasoning` | بحث عميق مع الاستدلال                  |
| `instant`        | أسرع النتائج                           |

## ملاحظات

- يقبل `count` قيمة تصل إلى 100، وفقًا لحدود نوع البحث في Exa.
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا. اضبط الإعداد المشترك `tools.web.search.cacheTtlMinutes` (بالدقائق) و`tools.web.search.timeoutSeconds` (القيمة الافتراضية 30 ثانية) لتغيير مدة التخزين المؤقت ومهلة الطلب لجميع مزوّدي `web_search`، بما في ذلك Exa.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع عوامل تصفية للبلد واللغة
- [Perplexity Search](/ar/tools/perplexity-search) -- نتائج منظّمة مع تصفية حسب النطاق

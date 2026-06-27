---
read_when:
    - تريد استخدام Exa من أجل web_search
    - تحتاج إلى EXA_API_KEY
    - تريد بحثًا عصبيًا أو استخراج المحتوى
summary: بحث Exa AI -- بحث عصبي وبحث بالكلمات المفتاحية مع استخراج المحتوى
title: بحث Exa
x-i18n:
    generated_at: "2026-06-27T18:40:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw يدعم [Exa AI](https://exa.ai/) بصفته موفّر `web_search`. يوفّر Exa
أوضاع بحث عصبية وبالكلمات المفتاحية وهجينة مع استخراج محتوى مدمج
(المقتطفات المميزة، النص، الملخصات).

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## الحصول على مفتاح API

<Steps>
  <Step title="أنشئ حسابًا">
    سجّل في [exa.ai](https://exa.ai/) وأنشئ مفتاح API من لوحة التحكم
    الخاصة بك.
  </Step>
  <Step title="خزّن المفتاح">
    عيّن `EXA_API_KEY` في بيئة Gateway، أو اضبطه عبر:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**بديل البيئة:** عيّن `EXA_API_KEY` في بيئة Gateway.
لتثبيت Gateway، ضعه في `~/.openclaw/.env`.

## تجاوز عنوان URL الأساسي

عيّن `plugins.entries.exa.config.webSearch.baseUrl` عندما ينبغي أن تمر طلبات بحث Exa
عبر وكيل متوافق أو نقطة نهاية Exa بديلة. يطبّع OpenClaw أسماء المضيفين المجردة
بإضافة `https://` في بدايتها ويضيف `/search` ما لم يكن المسار ينتهي بها بالفعل.
تُدرج نقطة النهاية المحلولة في مفتاح ذاكرة التخزين المؤقت للبحث، لذلك لا تتم مشاركة
النتائج من نقاط نهاية Exa المختلفة.

## معلمات الأداة

<ParamField path="query" type="string" required>
استعلام البحث.
</ParamField>

<ParamField path="count" type="number">
النتائج المطلوب إرجاعها (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
وضع البحث.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
عامل تصفية الوقت.
</ParamField>

<ParamField path="date_after" type="string">
النتائج بعد هذا التاريخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
النتائج قبل هذا التاريخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
خيارات استخراج المحتوى (انظر أدناه).
</ParamField>

### استخراج المحتوى

يمكن أن يعيد Exa محتوى مستخرجًا إلى جانب نتائج البحث. مرّر كائن `contents`
للتفعيل:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| خيار المحتوى | النوع                                                                 | الوصف                  |
| ------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`        | `boolean \| { maxCharacters }`                                        | استخراج نص الصفحة كاملًا |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج الجمل الرئيسية |
| `summary`     | `boolean \| { query }`                                                | ملخص مولّد بالذكاء الاصطناعي |

### أوضاع البحث

| الوضع            | الوصف                              |
| ---------------- | ---------------------------------- |
| `auto`           | يختار Exa أفضل وضع (الافتراضي)     |
| `neural`         | بحث دلالي/قائم على المعنى          |
| `fast`           | بحث سريع بالكلمات المفتاحية        |
| `deep`           | بحث عميق وشامل                     |
| `deep-reasoning` | بحث عميق مع استدلال                |
| `instant`        | أسرع النتائج                       |

## ملاحظات

- إذا لم يُقدَّم خيار `contents`، يستخدم Exa افتراضيًا `{ highlights: true }`
  بحيث تتضمن النتائج مقتطفات من الجمل الرئيسية
- تحافظ النتائج على حقلي `highlightScores` و`summary` من استجابة Exa API
  عند توفرهما
- تُستخلص أوصاف النتائج من المقتطفات المميزة أولًا، ثم الملخص، ثم
  النص الكامل — أيّها كان متاحًا
- لا يمكن دمج `freshness` مع `date_after`/`date_before` — استخدم وضعًا واحدًا
  لعامل تصفية الوقت
- يمكن إرجاع ما يصل إلى 100 نتيجة لكل استعلام (رهناً بحدود نوع البحث في Exa)
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للضبط عبر
  `cacheTtlMinutes`)
- Exa هو تكامل API رسمي باستجابات JSON منظمة

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- كل الموفّرين والاكتشاف التلقائي
- [بحث Brave](/ar/tools/brave-search) -- نتائج منظمة مع عوامل تصفية البلد/اللغة
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظمة مع تصفية النطاقات

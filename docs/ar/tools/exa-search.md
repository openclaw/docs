---
read_when:
    - تريد استخدام Exa لـ web_search
    - تحتاج إلى EXA_API_KEY
    - تريد بحثًا عصبيًا أو استخراجًا للمحتوى
summary: بحث Exa AI -- بحث عصبي وبحث بالكلمات المفتاحية مع استخراج المحتوى
title: بحث Exa
x-i18n:
    generated_at: "2026-04-24T08:08:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

يدعم OpenClaw خدمة [Exa AI](https://exa.ai/) كمزوّد `web_search`. وتوفّر Exa
أوضاع بحث عصبية، وبالكلمات المفتاحية، وهجينة، مع استخراج محتوى مدمج
(إبرازات، ونص، وملخصات).

## احصل على مفتاح API

<Steps>
  <Step title="إنشاء حساب">
    سجّل في [exa.ai](https://exa.ai/) وولّد مفتاح API من
    لوحة التحكم الخاصة بك.
  </Step>
  <Step title="تخزين المفتاح">
    اضبط `EXA_API_KEY` في بيئة Gateway، أو هيّئه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## التهيئة

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // اختياري إذا كان EXA_API_KEY مضبوطًا
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

**بديل بيئي:** اضبط `EXA_API_KEY` في بيئة Gateway.
في تثبيت gateway، ضعه في `~/.openclaw/.env`.

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
مرشح الوقت.
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

يمكن لـ Exa إرجاع محتوى مستخرج إلى جانب نتائج البحث. مرّر كائن `contents`
للتفعيل:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // نص الصفحة الكامل
    highlights: { numSentences: 3 }, // الجمل الأساسية
    summary: true, // ملخص AI
  },
});
```

| خيار `contents` | النوع                                                                 | الوصف                 |
| --------------- | --------------------------------------------------------------------- | --------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج نص الصفحة الكامل |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج الجمل الأساسية |
| `summary`       | `boolean \| { query }`                                                | ملخص مولّد بواسطة AI   |

### أوضاع البحث

| الوضع            | الوصف                              |
| ---------------- | ---------------------------------- |
| `auto`           | تختار Exa أفضل وضع (الافتراضي)    |
| `neural`         | بحث دلالي/قائم على المعنى          |
| `fast`           | بحث سريع بالكلمات المفتاحية        |
| `deep`           | بحث عميق شامل                      |
| `deep-reasoning` | بحث عميق مع استدلال                |
| `instant`        | أسرع النتائج                       |

## ملاحظات

- إذا لم يُقدَّم أي خيار `contents`، تستخدم Exa افتراضيًا `{ highlights: true }`
  بحيث تتضمن النتائج مقتطفات من الجمل الأساسية
- تحافظ النتائج على حقلي `highlightScores` و`summary` من استجابة API الخاصة بـ Exa
  عند توفرهما
- تُحل أوصاف النتائج من الإبرازات أولًا، ثم الملخص، ثم
  النص الكامل — أيّها متاح
- لا يمكن جمع `freshness` مع `date_after`/`date_before` — استخدم
  وضع ترشيح زمني واحد
- يمكن إرجاع ما يصل إلى 100 نتيجة لكل استعلام (مع مراعاة حدود نوع بحث Exa)
- تُخزَّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للتهيئة عبر
  `cacheTtlMinutes`)
- Exa تكامل API رسمي مع استجابات JSON منظَّمة

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظّمة مع مرشحات البلد/اللغة
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظّمة مع ترشيح حسب النطاق

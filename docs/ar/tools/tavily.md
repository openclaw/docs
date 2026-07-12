---
read_when:
    - تريد بحثًا على الويب مدعومًا من Tavily
    - تحتاج إلى مفتاح Tavily API
    - تريد استخدام Tavily كمزوّد لخدمة web_search
    - تريد استخراج المحتوى من عناوين URL
summary: أدوات البحث والاستخراج في Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T06:44:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) هي واجهة API للبحث مصممة لتطبيقات الذكاء الاصطناعي. يتيحها OpenClaw بطريقتين:

- بصفتها موفّر `web_search` لأداة البحث العامة
- بصفتها أدوات Plugin صريحة: `tavily_search` و`tavily_extract`

تُرجع Tavily نتائج منظّمة ومحسّنة لاستخدام النماذج اللغوية الكبيرة، مع عمق بحث قابل للضبط، وتصفية حسب الموضوع، ومرشحات للنطاقات، وملخصات إجابات مولّدة بالذكاء الاصطناعي، واستخراج المحتوى من عناوين URL (بما في ذلك الصفحات المعروضة باستخدام JavaScript).

| الخاصية       | القيمة                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------- |
| معرّف Plugin  | `tavily`                                                                                            |
| الحزمة        | `@openclaw/tavily-plugin`                                                                           |
| المصادقة      | متغير البيئة `TAVILY_API_KEY` أو إعداد `apiKey`                                                     |
| عنوان URL الأساسي | `https://api.tavily.com` (الافتراضي)؛ متغير البيئة `TAVILY_BASE_URL` أو إعداد `baseUrl` لتجاوزه |
| المُهل الزمنية | 30 ثانية للبحث، و60 ثانية للاستخراج (افتراضيًا)                                                     |
| الأدوات       | `tavily_search`، `tavily_extract`                                                                    |

## بدء الاستخدام

<Steps>
  <Step title="تثبيت Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="الحصول على مفتاح API">
    أنشئ حساب Tavily على [tavily.com](https://tavily.com)، ثم أنشئ مفتاح API في لوحة المعلومات.
  </Step>
  <Step title="تهيئة Plugin والموفّر">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // اختياري إذا كان TAVILY_API_KEY مضبوطًا
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="التحقق من تشغيل البحث">
    شغّل `web_search` من أي وكيل، أو استدعِ `tavily_search` مباشرةً.
  </Step>
</Steps>

<Tip>
يؤدي اختيار Tavily أثناء الإعداد الأولي أو عبر `openclaw configure --section web` إلى تثبيت Plugin الرسمي لـ Tavily وتمكينه عند الحاجة.
</Tip>

## مرجع الأدوات

### `tavily_search`

استخدم هذه الأداة عندما تريد عناصر تحكم خاصة ببحث Tavily بدلًا من `web_search` العام.

| المعامل           | النوع         | القيود / القيمة الافتراضية              | الوصف                                              |
| ----------------- | ------------- | ---------------------------------------- | -------------------------------------------------- |
| `query`           | سلسلة نصية    | مطلوب                                    | سلسلة استعلام البحث.                               |
| `search_depth`    | تعداد         | `basic` (افتراضي)، `advanced`            | الخيار `advanced` أبطأ لكنه أعلى صلة.              |
| `topic`           | تعداد         | `general` (افتراضي)، `news`، `finance`   | التصفية حسب فئة الموضوع.                           |
| `max_results`     | عدد صحيح      | 1-20، الافتراضي `5`                      | عدد النتائج.                                       |
| `include_answer`  | قيمة منطقية   | الافتراضي `false`                        | تضمين ملخص إجابة مولّد بالذكاء الاصطناعي من Tavily. |
| `time_range`      | تعداد         | `day`، `week`، `month`، `year`           | تصفية النتائج حسب حداثتها.                         |
| `include_domains` | مصفوفة سلاسل  | (لا شيء)                                 | تضمين النتائج من هذه النطاقات فقط.                 |
| `exclude_domains` | مصفوفة سلاسل  | (لا شيء)                                 | استبعاد النتائج من هذه النطاقات.                   |

المفاضلة بين مستويات عمق البحث:

| العمق       | السرعة | الصلة       | الأنسب لـ                                  |
| ----------- | ------ | ----------- | ------------------------------------------ |
| `basic`     | أسرع   | عالية       | الاستعلامات العامة متعددة الأغراض (افتراضيًا). |
| `advanced`  | أبطأ   | الأعلى      | البحث الدقيق والتحقق من الحقائق.           |

### `tavily_extract`

استخدم هذه الأداة لاستخراج محتوى منقّح من عنوان URL واحد أو أكثر. تتعامل مع الصفحات المعروضة باستخدام JavaScript، وتدعم تقسيم المحتوى الموجّه بالاستعلام للاستخراج المستهدف.

| المعامل             | النوع         | القيود / القيمة الافتراضية       | الوصف                                                         |
| ------------------- | ------------- | --------------------------------- | ------------------------------------------------------------- |
| `urls`              | مصفوفة سلاسل  | مطلوب، 1-20                       | عناوين URL المطلوب استخراج المحتوى منها.                      |
| `query`             | سلسلة نصية    | (اختياري)                         | إعادة ترتيب المقاطع المستخرجة وفق صلتها بهذا الاستعلام.       |
| `extract_depth`     | تعداد         | `basic` (افتراضي)، `advanced`     | استخدم `advanced` للصفحات كثيفة JS أو تطبيقات SPA أو الجداول الديناميكية. |
| `chunks_per_source` | عدد صحيح      | 1-5؛ **يتطلب `query`**            | عدد المقاطع المُعادة لكل عنوان URL. يحدث خطأ إذا ضُبط من دون `query`. |
| `include_images`    | قيمة منطقية   | الافتراضي `false`                 | تضمين عناوين URL للصور في النتائج.                            |

المفاضلة بين مستويات عمق الاستخراج:

| العمق       | وقت الاستخدام                                      |
| ----------- | -------------------------------------------------- |
| `basic`     | الصفحات البسيطة. جرّب هذا الخيار أولًا.            |
| `advanced`  | تطبيقات SPA المعروضة عبر JS والمحتوى والجداول الديناميكية. |

<Tip>
قسّم القوائم الكبيرة من عناوين URL إلى عدة استدعاءات لـ `tavily_extract` (بحد أقصى 20 لكل طلب). استخدم `query` مع `chunks_per_source` للحصول على المحتوى ذي الصلة فقط بدلًا من الصفحات الكاملة.
</Tip>

## اختيار الأداة المناسبة

| الحاجة                                       | الأداة             |
| -------------------------------------------- | ------------------ |
| بحث سريع في الويب دون خيارات خاصة            | `web_search`       |
| بحث مع العمق والموضوع وإجابات الذكاء الاصطناعي | `tavily_search`    |
| استخراج المحتوى من عناوين URL محددة          | `tavily_extract`   |

<Note>
تدعم أداة `web_search` العامة عند استخدام Tavily موفّرًا المعاملين `query` و`count` (حتى 20 نتيجة). لعناصر التحكم الخاصة بـ Tavily (`search_depth`، و`topic`، و`include_answer`، ومرشحات النطاقات، والنطاق الزمني)، استخدم `tavily_search` بدلًا منها.
</Note>

## التهيئة المتقدمة

<AccordionGroup>
  <Accordion title="ترتيب البحث عن مفتاح API">
    يبحث عميل Tavily عن مفتاح API بالترتيب التالي:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (بعد حله عبر SecretRefs).
    2. `TAVILY_API_KEY` من بيئة Gateway.

    تُصدر كل من `tavily_search` و`tavily_extract` خطأ إعداد إذا لم يكن أي منهما موجودًا.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    تجاوز `plugins.entries.tavily.config.webSearch.baseUrl`، أو اضبط `TAVILY_BASE_URL`، إذا كنت تمرّر Tavily عبر وكيل وسيط. تكون للتهيئة أولوية على متغير البيئة. القيمة الافتراضية هي `https://api.tavily.com`.
  </Accordion>

  <Accordion title="يتطلب `chunks_per_source` المعامل `query`">
    يرفض `tavily_extract` الاستدعاءات التي تمرّر `chunks_per_source` من دون `query`. ترتّب Tavily المقاطع حسب صلتها بالاستعلام، ولذلك لا معنى لهذا المعامل من دونه.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على البحث في الويب" href="/ar/tools/web" icon="magnifying-glass">
    جميع الموفّرين وقواعد الاكتشاف التلقائي.
  </Card>
  <Card title="Firecrawl" href="/ar/tools/firecrawl" icon="fire">
    البحث وجلب المحتوى مع استخراجه.
  </Card>
  <Card title="بحث Exa" href="/ar/tools/exa-search" icon="binoculars">
    بحث عصبي مع استخراج المحتوى.
  </Card>
  <Card title="التهيئة" href="/ar/gateway/configuration" icon="gear">
    مخطط التهيئة الكامل لإدخالات Plugin وتوجيه الأدوات.
  </Card>
</CardGroup>

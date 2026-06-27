---
read_when:
    - تريد بحثًا على الويب مدعومًا بـ Tavily
    - تحتاج إلى مفتاح API من Tavily
    - تريد استخدام Tavily كموفّر web_search
    - تريد استخراج المحتوى من عناوين URL
summary: أدوات البحث والاستخراج في Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:46:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) هي واجهة API للبحث مصممة لتطبيقات الذكاء الاصطناعي. يتيحها OpenClaw بطريقتين:

- بصفتها مزود `web_search` لأداة البحث العامة
- بصفتها أدوات Plugin صريحة: `tavily_search` و`tavily_extract`

تعيد Tavily نتائج منظمة محسنة لاستهلاك LLM مع عمق بحث قابل للضبط، وتصفية حسب الموضوع، ومرشحات نطاقات، وملخصات إجابات مولدة بالذكاء الاصطناعي، واستخراج محتوى من عناوين URL (بما في ذلك الصفحات المعروضة بواسطة JavaScript).

| الخاصية  | القيمة                               |
| --------- | ----------------------------------- |
| معرف Plugin | `tavily`                            |
| الحزمة   | `@openclaw/tavily-plugin`           |
| المصادقة      | `TAVILY_API_KEY` أو الإعداد `apiKey` |
| عنوان URL الأساسي  | `https://api.tavily.com` (افتراضي)  |
| الأدوات     | `tavily_search`, `tavily_extract`   |

## البدء

<Steps>
  <Step title="ثبّت Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="احصل على مفتاح API">
    أنشئ حساب Tavily على [tavily.com](https://tavily.com)، ثم أنشئ مفتاح API في لوحة التحكم.
  </Step>
  <Step title="اضبط Plugin والمزود">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
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
  <Step title="تحقق من تشغيل البحث">
    شغّل `web_search` من أي وكيل، أو استدعِ `tavily_search` مباشرة.
  </Step>
</Steps>

<Tip>
اختيار Tavily أثناء الإعداد الأولي أو عبر `openclaw configure --section web` يثبّت ويمكّن Plugin الرسمي الخاص بـ Tavily عند الحاجة.
</Tip>

## مرجع الأدوات

### `tavily_search`

استخدم هذا عندما تريد عناصر تحكم بحث خاصة بـ Tavily بدلا من `web_search` العام.

| المعامل         | النوع         | القيود / الافتراضي                  | الوصف                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | مطلوب                               | سلسلة استعلام البحث. اجعلها أقل من 400 حرف. |
| `search_depth`    | enum         | `basic` (افتراضي), `advanced`          | `advanced` أبطأ لكنه أعلى صلة.      |
| `topic`           | enum         | `general` (افتراضي), `news`, `finance` | التصفية حسب عائلة الموضوع.                         |
| `max_results`     | integer      | 1-20                                   | عدد النتائج.                              |
| `include_answer`  | boolean      | الافتراضي `false`                        | تضمين ملخص إجابة مولد بالذكاء الاصطناعي من Tavily.   |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | تصفية النتائج حسب الحداثة.                      |
| `include_domains` | string array | (لا شيء)                                 | تضمين النتائج من هذه النطاقات فقط.        |
| `exclude_domains` | string array | (لا شيء)                                 | استبعاد النتائج من هذه النطاقات.             |

المفاضلة في عمق البحث:

| العمق      | السرعة  | الصلة | الأنسب لـ                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | أسرع | عالية      | الاستعلامات العامة الغرض (افتراضي).   |
| `advanced` | أبطأ | الأعلى   | البحث الدقيق وتقصي الحقائق. |

### `tavily_extract`

استخدم هذا لاستخراج محتوى نظيف من عنوان URL واحد أو أكثر. يتعامل مع الصفحات المعروضة بواسطة JavaScript ويدعم تقسيم المحتوى الموجه بالاستعلام للاستخراج المستهدف.

| المعامل           | النوع         | القيود / الافتراضي         | الوصف                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | مطلوب، 1-20                | عناوين URL المراد استخراج المحتوى منها.                               |
| `query`             | string       | (اختياري)                    | إعادة ترتيب المقاطع المستخرجة حسب صلتها بهذا الاستعلام.         |
| `extract_depth`     | enum         | `basic` (افتراضي), `advanced` | استخدم `advanced` للصفحات كثيرة الاعتماد على JS، أو تطبيقات SPA، أو الجداول الديناميكية. |
| `chunks_per_source` | integer      | 1-5؛ **يتطلب `query`**     | المقاطع المعادة لكل عنوان URL. يسبب خطأ إذا ضُبط بدون `query`.     |
| `include_images`    | boolean      | الافتراضي `false`               | تضمين عناوين URL للصور في النتائج.                              |

المفاضلة في عمق الاستخراج:

| العمق      | متى تستخدمه                                |
| ---------- | ------------------------------------------ |
| `basic`    | الصفحات البسيطة. جرّب هذا أولا.              |
| `advanced` | تطبيقات SPA المعروضة بواسطة JS، والمحتوى الديناميكي، والجداول. |

<Tip>
قسّم قوائم عناوين URL الأكبر إلى عدة استدعاءات `tavily_extract` (بحد أقصى 20 لكل طلب). استخدم `query` مع `chunks_per_source` للحصول على المحتوى ذي الصلة فقط بدلا من الصفحات الكاملة.
</Tip>

## اختيار الأداة المناسبة

| الحاجة                                 | الأداة             |
| ------------------------------------ | ---------------- |
| بحث ويب سريع، بدون خيارات خاصة | `web_search`     |
| بحث بعمق وموضوع وإجابات ذكاء اصطناعي | `tavily_search`  |
| استخراج محتوى من عناوين URL محددة   | `tavily_extract` |

<Note>
أداة `web_search` العامة مع Tavily كمزود تدعم `query` و`count` (حتى 20 نتيجة). لعناصر التحكم الخاصة بـ Tavily (`search_depth` و`topic` و`include_answer` ومرشحات النطاقات والنطاق الزمني)، استخدم `tavily_search` بدلا منها.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="ترتيب حل مفتاح API">
    يبحث عميل Tavily عن مفتاح API الخاص به بهذا الترتيب:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (يُحل عبر SecretRefs).
    2. `TAVILY_API_KEY` من بيئة Gateway.

    يرفع `tavily_extract` خطأ إعداد إذا لم يكن أي منهما موجودا.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    تجاوز `plugins.entries.tavily.config.webSearch.baseUrl` إذا كنت تضع Tavily خلف وكيل. الافتراضي هو `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` يتطلب `query`">
    يرفض `tavily_extract` الاستدعاءات التي تمرر `chunks_per_source` بدون `query`. ترتب Tavily المقاطع حسب صلتها بالاستعلام، لذلك لا معنى للمعامل بدونه.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على بحث الويب" href="/ar/tools/web" icon="magnifying-glass">
    جميع المزودين وقواعد الاكتشاف التلقائي.
  </Card>
  <Card title="Firecrawl" href="/ar/tools/firecrawl" icon="fire">
    البحث بالإضافة إلى الكشط مع استخراج المحتوى.
  </Card>
  <Card title="Exa Search" href="/ar/tools/exa-search" icon="binoculars">
    بحث عصبي مع استخراج المحتوى.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مخطط الإعداد الكامل لإدخالات Plugin وتوجيه الأدوات.
  </Card>
</CardGroup>

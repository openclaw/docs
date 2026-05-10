---
read_when:
    - تريد بحثًا على الويب مدعومًا بـ Tavily
    - تحتاج إلى مفتاح API لـ Tavily
    - تريد استخدام Tavily كمزوّد web_search
    - تريد استخراج المحتوى من عناوين URL
summary: أدوات البحث والاستخراج في Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-10T20:06:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) هي واجهة API للبحث مصممة لتطبيقات الذكاء الاصطناعي. يتيحها OpenClaw بطريقتين:

- بصفتها مزود `web_search` لأداة البحث العامة
- بصفتها أدوات Plugin صريحة: `tavily_search` و`tavily_extract`

ترجع Tavily نتائج مهيكلة محسنة لاستهلاك نماذج LLM مع عمق بحث قابل للضبط، وتصفية حسب الموضوع، ومرشحات نطاقات، وملخصات إجابات مولدة بالذكاء الاصطناعي، واستخراج محتوى من عناوين URL (بما في ذلك الصفحات المعروضة عبر JavaScript).

| الخاصية      | القيمة                               |
| ------------- | ----------------------------------- |
| معرف Plugin     | `tavily`                            |
| المصادقة          | `TAVILY_API_KEY` أو config `apiKey` |
| عنوان URL الأساسي      | `https://api.tavily.com` (الافتراضي)  |
| الأدوات المضمنة | `tavily_search`, `tavily_extract`   |

## البدء

<Steps>
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
    شغل `web_search` من أي وكيل، أو استدع `tavily_search` مباشرة.
  </Step>
</Steps>

<Tip>
اختيار Tavily أثناء الإعداد الأولي أو عبر `openclaw configure --section web` يمكّن Tavily Plugin المضمن تلقائيا.
</Tip>

## مرجع الأدوات

### `tavily_search`

استخدم هذا عندما تريد عناصر تحكم بحث خاصة بـ Tavily بدلا من `web_search` العامة.

| المعامل         | النوع         | القيود / الافتراضي                  | الوصف                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | مطلوب                               | سلسلة استعلام البحث. أبقها أقل من 400 حرف. |
| `search_depth`    | enum         | `basic` (الافتراضي), `advanced`          | `advanced` أبطأ لكنها أعلى صلة.      |
| `topic`           | enum         | `general` (الافتراضي), `news`, `finance` | التصفية حسب عائلة الموضوع.                         |
| `max_results`     | integer      | 1-20                                   | عدد النتائج.                              |
| `include_answer`  | boolean      | الافتراضي `false`                        | تضمين ملخص إجابة مولد بالذكاء الاصطناعي من Tavily.   |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | تصفية النتائج حسب الحداثة.                      |
| `include_domains` | string array | (لا شيء)                                 | تضمين النتائج من هذه النطاقات فقط.        |
| `exclude_domains` | string array | (لا شيء)                                 | استبعاد النتائج من هذه النطاقات.             |

مفاضلة عمق البحث:

| العمق      | السرعة  | الصلة | الأنسب لـ                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | أسرع | عالية      | الاستعلامات العامة (الافتراضي).   |
| `advanced` | أبطأ | الأعلى   | البحث الدقيق وتقصي الحقائق. |

### `tavily_extract`

استخدم هذا لاستخراج محتوى نظيف من عنوان URL واحد أو أكثر. يتعامل مع الصفحات المعروضة عبر JavaScript ويدعم التقسيم المركز على الاستعلام للاستخراج الموجه.

| المعامل           | النوع         | القيود / الافتراضي         | الوصف                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | مطلوب، 1-20                | عناوين URL لاستخراج المحتوى منها.                               |
| `query`             | string       | (اختياري)                    | إعادة ترتيب الأجزاء المستخرجة حسب صلتها بهذا الاستعلام.         |
| `extract_depth`     | enum         | `basic` (الافتراضي), `advanced` | استخدم `advanced` للصفحات الكثيفة بـ JS أو تطبيقات SPA أو الجداول الديناميكية. |
| `chunks_per_source` | integer      | 1-5; **يتطلب `query`**     | الأجزاء المرجعة لكل عنوان URL. يحدث خطأ إذا ضبط دون `query`.     |
| `include_images`    | boolean      | الافتراضي `false`               | تضمين عناوين URL للصور في النتائج.                              |

مفاضلة عمق الاستخراج:

| العمق      | متى تستخدمه                                |
| ---------- | ------------------------------------------ |
| `basic`    | الصفحات البسيطة. جرب هذا أولا.              |
| `advanced` | تطبيقات SPA المعروضة عبر JS، والمحتوى الديناميكي، والجداول. |

<Tip>
قسّم قوائم عناوين URL الأكبر إلى عدة استدعاءات `tavily_extract` (الحد الأقصى 20 لكل طلب). استخدم `query` مع `chunks_per_source` للحصول على المحتوى ذي الصلة فقط بدلا من الصفحات الكاملة.
</Tip>

## اختيار الأداة المناسبة

| الحاجة                                 | الأداة             |
| ------------------------------------ | ---------------- |
| بحث ويب سريع، بلا خيارات خاصة | `web_search`     |
| بحث مع العمق والموضوع وإجابات الذكاء الاصطناعي | `tavily_search`  |
| استخراج محتوى من عناوين URL محددة   | `tavily_extract` |

<Note>
تدعم أداة `web_search` العامة مع Tavily كمزود `query` و`count` (حتى 20 نتيجة). لعناصر التحكم الخاصة بـ Tavily (`search_depth`، و`topic`، و`include_answer`، ومرشحات النطاقات، والنطاق الزمني)، استخدم `tavily_search` بدلا من ذلك.
</Note>

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="ترتيب تحديد مفتاح API">
    يبحث عميل Tavily عن مفتاح API الخاص به بهذا الترتيب:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (يتم حله عبر SecretRefs).
    2. `TAVILY_API_KEY` من بيئة Gateway.

    يرفع `tavily_extract` خطأ إعداد إذا لم يكن أي منهما موجودا.

  </Accordion>

  <Accordion title="عنوان URL أساسي مخصص">
    تجاوز `plugins.entries.tavily.config.webSearch.baseUrl` إذا كنت تمرر Tavily عبر وكيل. الافتراضي هو `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` يتطلب `query`">
    يرفض `tavily_extract` الاستدعاءات التي تمرر `chunks_per_source` دون `query`. ترتب Tavily الأجزاء حسب صلتها بالاستعلام، لذلك لا يكون للمعامل معنى بدونه.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="نظرة عامة على Web Search" href="/ar/tools/web" icon="magnifying-glass">
    جميع المزودين وقواعد الاكتشاف التلقائي.
  </Card>
  <Card title="Firecrawl" href="/ar/tools/firecrawl" icon="fire">
    بحث مع كشط واستخراج محتوى.
  </Card>
  <Card title="Exa Search" href="/ar/tools/exa-search" icon="binoculars">
    بحث عصبي مع استخراج محتوى.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مخطط الإعداد الكامل لإدخالات Plugin وتوجيه الأدوات.
  </Card>
</CardGroup>

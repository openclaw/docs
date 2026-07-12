---
read_when:
    - تريد البحث على الويب من دون مفتاح API
    - أنت تريد واجهة برمجة تطبيقات البحث المدفوعة من Parallel
    - تريد مقتطفات مكثفة ومرتبة حسب كفاءتها في سياق النماذج اللغوية الكبيرة
summary: البحث المتوازي -- مقتطفات كثيفة محسّنة للنماذج اللغوية الكبيرة من مصادر الويب
title: البحث المتوازي
x-i18n:
    generated_at: "2026-07-12T06:42:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

يوفر Plugin ‏Parallel موفّري `web_search` من [Parallel](https://parallel.ai/)، ويعيد كلاهما مقتطفات مرتبة ومحسّنة لنماذج LLM من فهرس ويب مُنشأ لوكلاء الذكاء الاصطناعي:

| الموفّر                  | المعرّف          | المصادقة                                                                                         |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| بحث Parallel (مجاني) | `parallel-free` | لا شيء -- خدمة [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) المجانية من Parallel |
| بحث Parallel          | `parallel`      | `PARALLEL_API_KEY` -- واجهة Search API مدفوعة، مع حدود معدّل أعلى وضبط للهدف             |

اضبط `tools.web.search.provider` على `parallel-free` أو `parallel` لاختيار أحدهما صراحةً؛ فلا يُكتشف أيٌّ منهما تلقائيًا.

<Note>
  تستخدم نماذج OpenAI Responses المباشرة (`api: "openai-responses"`، والموفّر
  `openai`، وعنوان URL الأساسي الرسمي لواجهة API) بحث الويب الأصلي المستضاف من OpenAI
  تلقائيًا عندما تكون `tools.web.search.provider` غير مضبوطة أو فارغة أو تساوي `"auto"`
  أو `"openai"` -- ولذلك تتجاوز Parallel افتراضيًا. اضبط
  `tools.web.search.provider` على `parallel-free` أو `parallel` لتوجيهها
  عبر Parallel بدلًا من ذلك. راجع [نظرة عامة على بحث الويب](/ar/tools/web).
</Note>

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## مفتاح API (الموفّر المدفوع)

لا يحتاج `parallel-free` إلى مفتاح، لكن يجب مع ذلك اختياره صراحةً. يحتاج موفّر
`parallel` المدفوع إلى مفتاح API:

<Steps>
  <Step title="إنشاء حساب">
    سجّل في [platform.parallel.ai](https://platform.parallel.ai) وأنشئ
    مفتاح API من لوحة معلوماتك.
  </Step>
  <Step title="تخزين المفتاح">
    اضبط `PARALLEL_API_KEY` في بيئة Gateway، أو هيّئه عبر:

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // اختياري إذا كان PARALLEL_API_KEY مضبوطًا
            baseUrl: "https://api.parallel.ai", // اختياري؛ يضيف OpenClaw المسار /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // استخدم "parallel-free" لخدمة Search MCP المجانية، أو "parallel" للموفّر
        // المدعوم بواجهة API المدفوعة الموضّح هنا.
        provider: "parallel",
      },
    },
  },
}
```

**بديل عبر البيئة:** اضبط `PARALLEL_API_KEY` في بيئة Gateway.
لتثبيت Gateway، ضعه في `~/.openclaw/.env`.

## تجاوز عنوان URL الأساسي

ينطبق على موفّر `parallel` المدفوع فقط؛ يستخدم `parallel-free` دائمًا
`https://search.parallel.ai/mcp` ويتجاهل هذا الإعداد.

اضبط `plugins.entries.parallel.config.webSearch.baseUrl` لتوجيه الطلبات
المدفوعة عبر وكيل متوافق أو نقطة نهاية بديلة (مثل Cloudflare AI Gateway).
يطبّع OpenClaw أسماء المضيفين المجرّدة بإضافة `https://` في بدايتها، ويضيف
`/v1/search` ما لم يكن المسار ينتهي به بالفعل. تُعدّ نقطة النهاية المحسوبة
جزءًا من مفتاح ذاكرة التخزين المؤقت للبحث، لذلك لا تُشارك أبدًا النتائج الواردة
من نقاط نهاية مختلفة.

## معاملات الأداة

يعرض كلا الموفّرين بنية البحث الأصلية في Parallel كي يملأ النموذج هدفًا
بلغة طبيعية مع بضعة استعلامات قصيرة بكلمات مفتاحية -- وهي التركيبة التي
[توصي بها](https://docs.parallel.ai/search/best-practices) Parallel للحصول
على أفضل النتائج.

<ParamField path="objective" type="string" required>
وصف بلغة طبيعية للسؤال أو الهدف الأساسي (بحد أقصى 5000 محرف).
ينبغي أن يكون مكتفيًا بذاته.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
استعلامات بحث موجزة بكلمات مفتاحية، يتكوّن كل منها من 3 إلى 6 كلمات
(من 1 إلى 5 إدخالات، وبحد أقصى 200 محرف لكل إدخال). قدّم استعلامين أو
ثلاثة استعلامات متنوعة للحصول على أفضل النتائج.
</ParamField>

<ParamField path="count" type="number">
عدد النتائج المطلوب إرجاعها (من 1 إلى 40).
</ParamField>

<ParamField path="session_id" type="string">
معرّف جلسة Parallel اختياري من `sessionId` لنتيجة سابقة. مرّره في عمليات
البحث اللاحقة ضمن المهمة نفسها كي تجمع Parallel الاستدعاءات المرتبطة وتحسّن
النتائج اللاحقة. الحد الأقصى 1000 محرف مع `parallel`، بينما تحدّه خدمة
Search MCP المجانية `parallel-free` عند 100 محرف. يُحذف المعرّف الذي يتجاوز
الحد (في المدفوع)، أو يُنشأ معرّف جديد (في المجاني).
</ParamField>

<ParamField path="client_model" type="string">
معرّف اختياري للنموذج الذي يجري الاستدعاء (مثل `claude-opus-4-7` أو
`gpt-5.6-sol`)، بحد أقصى 100 محرف. يتيح ذلك لـ Parallel تخصيص الإعدادات
الافتراضية وفقًا لقدرات نموذجك. مرّر الاسم المعرّف الدقيق للنموذج النشط؛
ولا تختصره إلى اسم مستعار لعائلة النماذج.
</ParamField>

## ملاحظات

- ترتّب Parallel النتائج وتضغطها لتفيد استدلال نماذج LLM، لا لينقر عليها
  البشر؛ لذا توقّع مقتطفات كثيفة لكل نتيجة بدلًا من محتوى الصفحة الكامل.
- تعود مقتطفات النتائج ضمن مصفوفة `excerpts`، كما تُدمج في `description`
  للتوافق مع عقد `web_search` العام.
- يعيد كلا الموفّرين `session_id`؛ ويعرضه OpenClaw باسم `sessionId` في
  حمولة الأداة كي يتمكن المستدعون من تجميع عمليات البحث اللاحقة. يُستبعد
  معرّف الجلسة الذي أنشأته Parallel (أي الذي لم يقدمه المستدعي) من إدخال
  ذاكرة التخزين المؤقت، حتى لا ترثه مهام غير مرتبطة ذات استعلامات متطابقة.
- تُمرّر قيم `searchId` و`warnings` و`usage` الواردة من Parallel عند وجودها.
- يمرّر OpenClaw دائمًا عدد النتائج المحسوب إلى Parallel باسم
  `advanced_settings.max_results` مع (`parallel`)، أو يطبّق `count`
  من جهة العميل بعد استجابة Parallel ذات الحجم الثابت مع (`parallel-free`).
  تتقدّم وسيطة `count` الخاصة بالمستدعي، ثم `tools.web.search.maxResults`،
  وإلا تُستخدم القيمة الافتراضية العامة لـ `web_search` في OpenClaw وهي (5)
  -- بينما القيمة الافتراضية لواجهة API الخاصة بـ Parallel هي 10.
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (`cacheTtlMinutes`).
- ينشئ `parallel-free` قيمة `session_id` جديدة لكل استدعاء عبر مصافحة MCP
  عندما لا يقدّم المستدعي واحدة؛ بينما يتركها `parallel` غير مضبوطة في
  هذه الحالة.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
- [بحث Perplexity](/ar/tools/perplexity-search) -- نتائج منظّمة مع تصفية حسب النطاق

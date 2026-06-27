---
read_when:
    - تريد البحث على الويب دون مفتاح API
    - تحتاج إلى واجهة API البحث المدفوعة من Parallel
    - تريد مقتطفات كثيفة مرتبة بحسب كفاءة السياق لنماذج اللغة الكبيرة
summary: البحث المتوازي -- مقتطفات كثيفة محسّنة لنماذج اللغة الكبيرة من مصادر الويب
title: البحث المتوازي
x-i18n:
    generated_at: "2026-06-27T18:43:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

يوفر Plugin Parallel موفّرَي `web_search` من [Parallel](https://parallel.ai/):

- **Parallel Search (مجاني)** (`parallel-free`) -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)
  المجاني من Parallel. لا يتطلب حسابًا أو مفتاح API. اختره صراحةً عندما تريد مسار البحث المستضاف من Parallel من دون مفتاح.
- **Parallel Search** (`parallel`) -- Search API المدفوع من Parallel. يتطلب
  `PARALLEL_API_KEY` ويوفر حدود معدلات أعلى وضبطًا للهدف.

يعيد كلاهما مقتطفات مرتبة ومحسّنة لنماذج LLM من فهرس ويب مبني لوكلاء الذكاء الاصطناعي.
اضبط `tools.web.search.provider` على `parallel-free` أو `parallel` لاختيار أحدهما
صراحةً.

<Note>
  تستخدم نماذج OpenAI Responses بحث الويب الأصلي من OpenAI عندما يكون
  `tools.web.search.provider` غير مضبوط، لذلك تتجاوز موفّري Parallel.
  اضبط `tools.web.search.provider` على `parallel-free` أو `parallel` لتوجيهها
  عبر Parallel.
</Note>

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## مفتاح API (الموفّر المدفوع)

لا يتطلب `parallel-free` مفتاح API، لكنه لا يزال يجب اختياره كالموفّر
المُدار. يحتاج موفّر `parallel` المدفوع إلى مفتاح API:

<Steps>
  <Step title="إنشاء حساب">
    سجّل في [platform.parallel.ai](https://platform.parallel.ai) وأنشئ
    مفتاح API من لوحة التحكم لديك.
  </Step>
  <Step title="تخزين المفتاح">
    اضبط `PARALLEL_API_KEY` في بيئة Gateway، أو اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## الإعدادات

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**بديل البيئة:** اضبط `PARALLEL_API_KEY` في بيئة Gateway.
لتثبيت gateway، ضعه في `~/.openclaw/.env`.

## تجاوز عنوان URL الأساسي

ينطبق تجاوز عنوان URL الأساسي على موفّر `parallel` المدفوع فقط. يستخدم موفّر
`parallel-free` المجاني دائمًا `https://search.parallel.ai/mcp`.

اضبط `plugins.entries.parallel.config.webSearch.baseUrl` عندما ينبغي لطلبات Parallel
أن تمر عبر وكيل متوافق أو نقطة نهاية Parallel بديلة (على سبيل المثال،
Cloudflare AI Gateway). يطبّع OpenClaw أسماء المضيفين المجردة بإضافة
`https://` في بدايتها ويضيف `/v1/search` ما لم يكن المسار ينتهي به بالفعل.
تُضمَّن نقطة النهاية المحلولة في مفتاح ذاكرة التخزين المؤقت للبحث، لذلك لا تُشارك النتائج
من نقاط نهاية Parallel المختلفة.

## معلمات الأداة

يكشف OpenClaw شكل البحث الأصلي في Parallel حتى يتمكن النموذج من ملء كل من
الهدف باللغة الطبيعية وبعض استعلامات الكلمات المفتاحية القصيرة — وهي المزاوجة
التي [توصي بها](https://docs.parallel.ai/search/best-practices) Parallel للحصول
على أفضل النتائج.

<ParamField path="objective" type="string" required>
وصف باللغة الطبيعية للسؤال أو الهدف الأساسي (بحد أقصى 5000
حرف). يجب أن يكون مكتفيًا بذاته.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
استعلامات بحث موجزة بالكلمات المفتاحية، من 3 إلى 6 كلمات لكل منها (من 1 إلى 5 إدخالات، بحد أقصى 200 حرف
لكل منها). قدّم 2-3 استعلامات متنوعة للحصول على أفضل النتائج.
</ParamField>

<ParamField path="count" type="number">
النتائج المراد إرجاعها (1-40).
</ParamField>

<ParamField path="session_id" type="string">
معرّف جلسة Parallel اختياري (بحد أقصى 1000 حرف على `parallel`؛ يحدّ
Search MCP المجاني `parallel-free` ذلك عند 100). مرّر `sessionId` من نتيجة Parallel سابقة
في عمليات البحث اللاحقة التي تكون جزءًا من المهمة نفسها حتى تتمكن Parallel
من تجميع الاستدعاءات ذات الصلة وتحسين النتائج اللاحقة. يُسقط أي معرّف يتجاوز الحد
ويُنشأ معرّف جديد.
</ParamField>

<ParamField path="client_model" type="string">
معرّف اختياري للنموذج الذي يجري الاستدعاء (مثل `claude-opus-4-7`،
`gpt-5.5`). يتيح لـ Parallel تخصيص الإعدادات الافتراضية وفقًا
لقدرات نموذجك. مرّر slug النموذج النشط الدقيق؛ لا تختصره إلى اسم مستعار
لعائلة.
</ParamField>

## ملاحظات

- ترتّب Parallel النتائج وتضغطها بناءً على منفعة الاستدلال لنماذج LLM، وليس
  نقرات البشر؛ توقّع مقتطفات كثيفة في كل نتيجة بدلًا من
  محتوى صفحة كامل
- تعود مقتطفات النتائج كمصفوفة `excerpts` وتُضم أيضًا في
  حقل `description` للتوافق مع عقد `web_search` العام
- تعيد Parallel قيمة `session_id` في كل استجابة؛ يعرضها OpenClaw باسم
  `sessionId` في حمولة الأداة حتى يتمكن المستدعون من تجميع عمليات البحث اللاحقة
- تُمرَّر `searchId` و`warnings` و`usage` من Parallel عند
  وجودها
- يمرّر OpenClaw دائمًا عدد نتائج محلولًا إلى Parallel باسم
  `advanced_settings.max_results`. تكون الغلبة لوسيطة `count` لدى المستدعي، ثم لإعداد
  `tools.web.search.maxResults` في المستوى الأعلى، وإلا فيُستخدم الإعداد الافتراضي العام في OpenClaw
  لـ `web_search` (5). يحافظ هذا على اتساق حجم النتائج
  عند التبديل بين الموفّرين؛ أما Parallel بمفرده فإعداده الافتراضي هو 10
- تُخزّن النتائج مؤقتًا لمدة 15 دقيقة افتراضيًا (قابلة للضبط عبر
  `cacheTtlMinutes`)
- يقبل موفّر `parallel-free` المجاني المعلمات نفسها. يطبّق
  `count` من جهة العميل وينشئ `session_id` لكل استدعاء عندما لا
  يُوفَّر واحد.

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [بحث Exa](/ar/tools/exa-search) -- بحث عصبي مع استخراج المحتوى
- [Perplexity Search](/ar/tools/perplexity-search) -- نتائج منظمة مع ترشيح النطاقات

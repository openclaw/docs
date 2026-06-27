---
read_when:
    - تريد فهم الواجهة الخلفية الافتراضية للذاكرة
    - تريد تكوين مزوّدي التضمين أو البحث الهجين
summary: واجهة الذاكرة الخلفية الافتراضية المستندة إلى SQLite مع البحث بالكلمات المفتاحية والبحث المتجهي والبحث الهجين
title: محرك الذاكرة المضمّن
x-i18n:
    generated_at: "2026-06-27T17:29:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

المحرك المدمج هو خلفية الذاكرة الافتراضية. يخزّن فهرس الذاكرة في
قاعدة بيانات SQLite لكل وكيل ولا يحتاج إلى أي اعتماديات إضافية للبدء.

## ما الذي يوفّره

- **البحث بالكلمات المفتاحية** عبر فهرسة النص الكامل FTS5 (تسجيل BM25).
- **البحث المتجهي** عبر التضمينات من أي مزوّد مدعوم.
- **البحث الهجين** الذي يجمع بينهما للحصول على أفضل النتائج.
- **دعم CJK** عبر تجزئة ثلاثية للغات الصينية واليابانية والكورية.
- **تسريع sqlite-vec** لاستعلامات المتجهات داخل قاعدة البيانات (اختياري).

## البدء

بشكل افتراضي، يستخدم المحرك المدمج تضمينات OpenAI. إذا كان لديك بالفعل
`OPENAI_API_KEY` أو `models.providers.openai.apiKey` مضبوطًا، فسيعمل البحث
المتجهي من دون أي إعداد إضافي للذاكرة.

لتعيين مزوّد صراحةً:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

من دون مزوّد تضمينات، لا يتوفر إلا البحث بالكلمات المفتاحية.

لفرض تضمينات GGUF محلية، ثبّت Plugin مزوّد llama.cpp الرسمي،
ثم وجّه `local.modelPath` إلى ملف GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## مزوّدو التضمينات المدعومون

| المزوّد           | المعرّف             | ملاحظات                              |
| ----------------- | ------------------- | ------------------------------------ |
| Bedrock           | `bedrock`           | يستخدم سلسلة بيانات اعتماد AWS      |
| DeepInfra         | `deepinfra`         | الافتراضي: `BAAI/bge-m3`             |
| Gemini            | `gemini`            | يدعم الوسائط المتعددة (صورة + صوت)  |
| GitHub Copilot    | `github-copilot`    | يستخدم اشتراك Copilot                |
| محلي              | `local`             | `@openclaw/llama-cpp-provider`       |
| Mistral           | `mistral`           |                                      |
| Ollama            | `ollama`            | محلي/مستضاف ذاتيًا                   |
| OpenAI            | `openai`            | الافتراضي: `text-embedding-3-small`  |
| متوافق مع OpenAI  | `openai-compatible` | نقطة نهاية `/v1/embeddings` عامة     |
| Voyage            | `voyage`            |                                      |

عيّن `memorySearch.provider` للتبديل بعيدًا عن OpenAI.

## كيف تعمل الفهرسة

يفهرس OpenClaw الملف `MEMORY.md` وملفات `memory/*.md` في مقاطع (~400 رمز مع
تداخل 80 رمزًا) ويخزّنها في قاعدة بيانات SQLite لكل وكيل.

- **موقع الفهرس:** قاعدة بيانات الوكيل المالك في
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **صيانة التخزين:** تُقيَّد ملفات SQLite WAL الجانبية بنقاط تحقق دورية وعند
  إيقاف التشغيل.
- **مراقبة الملفات:** تؤدي التغييرات في ملفات الذاكرة إلى إعادة فهرسة مؤجلة (1.5 ثانية).
- **إعادة الفهرسة التلقائية:** عند تغيير مزوّد التضمينات أو النموذج أو إعداد
  تقسيم المقاطع، يُعاد بناء الفهرس بالكامل تلقائيًا.
- **إعادة الفهرسة عند الطلب:** `openclaw memory index --force`

<Info>
يمكنك أيضًا فهرسة ملفات Markdown خارج مساحة العمل باستخدام
`memorySearch.extraPaths`. راجع
[مرجع الإعدادات](/ar/reference/memory-config#additional-memory-paths).
</Info>

## متى تستخدمه

المحرك المدمج هو الخيار المناسب لمعظم المستخدمين:

- يعمل مباشرةً من دون اعتماديات إضافية.
- يتعامل جيدًا مع البحث بالكلمات المفتاحية والبحث المتجهي.
- يدعم جميع مزوّدي التضمينات.
- يجمع البحث الهجين بين أفضل ما في نهجي الاسترجاع.

فكّر في التبديل إلى [QMD](/ar/concepts/memory-qmd) إذا كنت تحتاج إلى إعادة ترتيب
النتائج أو توسيع الاستعلامات أو تريد فهرسة أدلة خارج مساحة العمل.

فكّر في [Honcho](/ar/concepts/memory-honcho) إذا كنت تريد ذاكرة عابرة للجلسات مع
نمذجة تلقائية للمستخدم.

## استكشاف الأخطاء وإصلاحها

**هل بحث الذاكرة معطّل؟** تحقّق من `openclaw memory status`. إذا لم يُكتشف أي مزوّد،
فعيّن واحدًا صراحةً أو أضف مفتاح API.

**ألم يُكتشف المزوّد المحلي؟** تأكّد من وجود المسار المحلي وشغّل:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

تستخدم أوامر CLI المستقلة وGateway معرّف المزوّد نفسه `local`.
عيّن `memorySearch.provider: "local"` عندما تريد تضمينات محلية.

**هل النتائج قديمة؟** شغّل `openclaw memory index --force` لإعادة البناء. قد تفوّت
المراقبة تغييرات في حالات طرفية نادرة.

**ألا يتم تحميل sqlite-vec؟** يعود OpenClaw تلقائيًا إلى تشابه جيب التمام داخل العملية.
يعرض `openclaw memory status --deep` مخزن المتجهات المحلي بشكل منفصل عن مزوّد
التضمينات، لذا تشير `Vector store: unavailable` إلى تحميل sqlite-vec بينما تشير
`Embeddings: unavailable` إلى جاهزية المزوّد/المصادقة أو النموذج. تحقّق من السجلات
لمعرفة خطأ التحميل المحدد.

## الإعدادات

لإعداد مزوّد التضمينات، وضبط البحث الهجين (الأوزان، MMR، التضاؤل الزمني)،
والفهرسة على دفعات، والذاكرة متعددة الوسائط، وsqlite-vec، والمسارات الإضافية،
وجميع مفاتيح الإعدادات الأخرى، راجع
[مرجع إعدادات الذاكرة](/ar/reference/memory-config).

## ذات صلة

- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [بحث الذاكرة](/ar/concepts/memory-search)
- [Active Memory](/ar/concepts/active-memory)

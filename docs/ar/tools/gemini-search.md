---
read_when:
    - تريد استخدام Gemini من أجل `web_search`
    - تحتاج إلى `GEMINI_API_KEY`
    - تريد Google Search grounding
summary: بحث الويب في Gemini باستخدام Google Search grounding
title: بحث Gemini
x-i18n:
    generated_at: "2026-04-24T08:09:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

يدعم OpenClaw نماذج Gemini مع
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) المدمج،
الذي يعيد إجابات مُركّبة بالذكاء الاصطناعي ومدعومة بنتائج Google Search مباشرة مع
استشهادات.

## احصل على مفتاح API

<Steps>
  <Step title="أنشئ مفتاحًا">
    انتقل إلى [Google AI Studio](https://aistudio.google.com/apikey) وأنشئ
    مفتاح API.
  </Step>
  <Step title="خزّن المفتاح">
    اضبط `GEMINI_API_KEY` في بيئة Gateway، أو قم بالإعداد عبر:

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
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // اختياري إذا كان GEMINI_API_KEY مضبوطًا
            model: "gemini-2.5-flash", // الافتراضي
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**بديل البيئة:** اضبط `GEMINI_API_KEY` في بيئة Gateway.
وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.

## كيف يعمل

على عكس موفري البحث التقليديين الذين يعيدون قائمة من الروابط والمقتطفات،
يستخدم Gemini خاصية Google Search grounding لإنتاج إجابات مركّبة بالذكاء الاصطناعي مع
استشهادات مضمنة. وتتضمن النتائج كلًا من الإجابة المركّبة وعناوين URL
الخاصة بالمصادر.

- يتم تلقائيًا تحليل عناوين URL الخاصة بالاستشهادات من Gemini grounding من عناوين Google
  المعاد توجيهها إلى عناوين URL مباشرة.
- يستخدم تحليل إعادة التوجيه مسار الحماية من SSRF ‏(فحوصات HEAD + إعادة التوجيه +
  التحقق من `http/https`) قبل إعادة عنوان URL النهائي الخاص بالاستشهاد.
- يستخدم تحليل إعادة التوجيه إعدادات SSRF افتراضية صارمة، لذا فإن عمليات إعادة التوجيه إلى
  أهداف خاصة/داخلية يتم حظرها.

## المعلمات المدعومة

يدعم بحث Gemini المعلمة `query`.

يتم قبول `count` من أجل التوافق المشترك مع `web_search`، لكن Gemini grounding
ما يزال يعيد إجابة مركّبة واحدة مع استشهادات بدلًا من قائمة مكوّنة من N
نتيجة.

لا يتم دعم عوامل التصفية الخاصة بالمزوّد مثل `country`، و`language`، و`freshness`،
و`domain_filter`.

## اختيار النموذج

النموذج الافتراضي هو `gemini-2.5-flash` ‏(سريع وفعّال من حيث التكلفة). ويمكن استخدام أي نموذج Gemini
يدعم grounding عبر
`plugins.entries.google.config.webSearch.model`.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Brave Search](/ar/tools/brave-search) -- نتائج منظمة مع مقتطفات
- [Perplexity Search](/ar/tools/perplexity-search) -- نتائج منظمة + استخراج المحتوى

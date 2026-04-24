---
read_when:
    - تريد استخدام Grok من أجل `web_search`
    - أنت بحاجة إلى `XAI_API_KEY` من أجل البحث على الويب
summary: البحث على الويب عبر Grok باستخدام استجابات xAI المرتكزة على الويب
title: بحث Grok
x-i18n:
    generated_at: "2026-04-24T08:09:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 15
---

يدعم OpenClaw مزود Grok باعتباره مزودًا لـ `web_search`، باستخدام استجابات xAI المرتكزة
على الويب لإنتاج إجابات مُركّبة بالذكاء الاصطناعي ومدعومة بنتائج بحث مباشرة
مع استشهادات.

يمكن للمفتاح نفسه `XAI_API_KEY` أيضًا تشغيل الأداة المضمنة `x_search` للبحث
في منشورات X ‏(Twitter سابقًا). وإذا خزّنت المفتاح تحت
`plugins.entries.xai.config.webSearch.apiKey`، فإن OpenClaw يعيد الآن استخدامه
كبديل احتياطي لمزود النموذج xAI المضمّن أيضًا.

وبالنسبة إلى مقاييس X على مستوى المنشور مثل إعادة النشر، أو الردود، أو الإشارات المرجعية، أو المشاهدات، ففضّل
استخدام `x_search` مع عنوان URL الدقيق للمنشور أو معرّف الحالة بدلًا من
استعلام بحث واسع.

## Onboarding وconfigure

إذا اخترت **Grok** أثناء:

- `openclaw onboard`
- `openclaw configure --section web`

فيمكن لـ OpenClaw عرض خطوة متابعة منفصلة لتفعيل `x_search` باستخدام
`XAI_API_KEY` نفسه. وهذه المتابعة:

- لا تظهر إلا بعد اختيارك Grok من أجل `web_search`
- ليست خيارًا منفصلًا على المستوى الأعلى لمزود البحث على الويب
- ويمكنها اختياريًا ضبط نموذج `x_search` في التدفق نفسه

إذا تخطيتها، فيمكنك تفعيل `x_search` أو تغييره لاحقًا في الإعدادات.

## احصل على مفتاح API

<Steps>
  <Step title="أنشئ مفتاحًا">
    احصل على مفتاح API من [xAI](https://console.x.ai/).
  </Step>
  <Step title="خزّن المفتاح">
    اضبط `XAI_API_KEY` في بيئة Gateway، أو قم بالتهيئة عبر:

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**بديل عبر البيئة:** اضبط `XAI_API_KEY` في بيئة Gateway.
وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.

## كيف يعمل

يستخدم Grok استجابات xAI المرتكزة على الويب لتركيب إجابات مع استشهادات
مضمنة، بشكل مشابه لأسلوب Gemini في الارتكاز عبر Google Search.

## المعلمات المدعومة

يدعم بحث Grok المعلمة `query`.

ويتم قبول `count` لتوافق `web_search` المشترك، لكن Grok لا يزال
يعيد إجابة مُركّبة واحدة مع استشهادات بدلًا من قائمة من N نتائج.

ولا يتم دعم المرشحات الخاصة بالـ provider حاليًا.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع providers والاكتشاف التلقائي
- [`x_search` في Web Search](/ar/tools/web#x_search) -- بحث X أصلي من الدرجة الأولى عبر xAI
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مركبة بالذكاء الاصطناعي عبر الارتكاز في Google

---
read_when:
    - تريد استخدام Grok من أجل web_search
    - تحتاج إلى XAI_API_KEY للبحث على الويب
summary: بحث Grok على الويب عبر ردود xAI المستندة إلى الويب
title: بحث Grok
x-i18n:
    generated_at: "2026-05-02T07:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw يدعم Grok كمزوّد `web_search`، باستخدام استجابات xAI المستندة إلى الويب لإنتاج إجابات مركّبة بالذكاء الاصطناعي ومدعومة بنتائج بحث مباشرة مع الاستشهادات.

يمكن للمفتاح نفسه `XAI_API_KEY` أيضًا تشغيل الأداة المدمجة `x_search` للبحث في منشورات X (المعروف سابقًا باسم Twitter). إذا خزّنت المفتاح ضمن `plugins.entries.xai.config.webSearch.apiKey`، فإن OpenClaw يعيد الآن استخدامه كخيار احتياطي لمزوّد نموذج xAI المضمّن أيضًا.

بالنسبة إلى مقاييس X على مستوى المنشور، مثل إعادة النشر أو الردود أو الإشارات المرجعية أو المشاهدات، فضّل استخدام `x_search` مع عنوان URL الدقيق للمنشور أو معرّف الحالة بدلًا من استعلام بحث واسع.

## الإعداد الأولي والتهيئة

إذا اخترت **Grok** أثناء:

- `openclaw onboard`
- `openclaw configure --section web`

يمكن لـ OpenClaw عرض خطوة متابعة منفصلة لتفعيل `x_search` باستخدام مفتاح `XAI_API_KEY` نفسه. خطوة المتابعة هذه:

- تظهر فقط بعد اختيار Grok لـ `web_search`
- ليست خيارًا منفصلًا على المستوى الأعلى لمزوّد بحث الويب
- يمكنها اختياريًا تعيين نموذج `x_search` أثناء التدفق نفسه

إذا تخطّيتها، يمكنك تفعيل `x_search` أو تغييره لاحقًا في الإعدادات.

## الحصول على مفتاح API

<Steps>
  <Step title="إنشاء مفتاح">
    احصل على مفتاح API من [xAI](https://console.x.ai/).
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `XAI_API_KEY` في بيئة Gateway، أو قم بالتهيئة عبر:

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
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**بديل البيئة:** عيّن `XAI_API_KEY` في بيئة Gateway.
بالنسبة إلى تثبيت Gateway، ضعه في `~/.openclaw/.env`.

## كيفية العمل

يستخدم Grok استجابات xAI المستندة إلى الويب لتركيب الإجابات مع استشهادات مضمنة، على نحو مشابه لنهج Gemini في الاستناد إلى Google Search.

## المعلمات المدعومة

يدعم بحث Grok المعلمة `query`.

تُقبل `count` للتوافق مع `web_search` المشتركة، لكن Grok لا يزال يعيد إجابة مركّبة واحدة مع استشهادات بدلًا من قائمة نتائج بعدد N.

المرشحات الخاصة بالمزوّد غير مدعومة حاليًا.

يستخدم Grok مهلة افتراضية خاصة بالمزوّد قدرها 60 ثانية لأن عمليات بحث xAI Responses المستندة إلى الويب قد تستغرق وقتًا أطول من القيمة الافتراضية المشتركة لـ `web_search`. عيّن `tools.web.search.timeoutSeconds` لتجاوزها.

## تجاوزات عنوان URL الأساسي

عيّن `plugins.entries.xai.config.webSearch.baseUrl` عندما يجب أن يمر بحث الويب في Grok عبر وكيل مشغّل أو نقطة نهاية Responses متوافقة مع xAI. يرسل OpenClaw الطلبات إلى `<baseUrl>/responses` بعد إزالة الشرطات المائلة اللاحقة. يستخدم `x_search` خيار الرجوع نفسه `webSearch.baseUrl` ما لم يتم تعيين `plugins.entries.xai.config.xSearch.baseUrl`.

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [x_search في Web Search](/ar/tools/web#x_search) -- بحث X من الدرجة الأولى عبر xAI
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مركّبة بالذكاء الاصطناعي عبر الاستناد إلى Google

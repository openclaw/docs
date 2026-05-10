---
read_when:
    - تريد استخدام Grok لإجراء web_search
    - تحتاج إلى XAI_API_KEY للبحث على الويب
summary: بحث Grok على الويب عبر استجابات xAI المستندة إلى الويب
title: بحث Grok
x-i18n:
    generated_at: "2026-05-10T20:04:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

يدعم OpenClaw استخدام Grok بصفته مزود `web_search`، باستخدام استجابات xAI المستندة إلى الويب لإنتاج إجابات مركّبة بالذكاء الاصطناعي ومدعومة بنتائج بحث مباشرة مع الاستشهادات.

يمكن لمفتاح API نفسه الخاص بـ xAI تشغيل أداة `x_search` المدمجة للبحث في منشورات X (سابقًا Twitter) وأداة `code_execution` أيضًا. إذا خزّنت المفتاح ضمن `plugins.entries.xai.config.webSearch.apiKey`، فسيعيد OpenClaw الآن استخدامه كخيار احتياطي لمزود نماذج xAI المضمّن أيضًا.

بالنسبة إلى مقاييس X على مستوى المنشور مثل إعادة النشر أو الردود أو الإشارات المرجعية أو المشاهدات، فضّل استخدام `x_search` مع عنوان URL الدقيق للمنشور أو معرّف الحالة بدلًا من استعلام بحث واسع.

## الإعداد الأولي والتهيئة

إذا اخترت **Grok** أثناء:

- `openclaw onboard`
- `openclaw configure --section web`

يمكن لـ OpenClaw عرض خطوة متابعة منفصلة لتمكين `x_search` باستخدام `XAI_API_KEY` نفسه. خطوة المتابعة تلك:

- لا تظهر إلا بعد اختيار Grok لـ `web_search`
- ليست اختيارًا منفصلًا لمزود بحث ويب من المستوى الأعلى
- يمكنها اختياريًا ضبط نموذج `x_search` أثناء التدفق نفسه

إذا تخطيتها، يمكنك تمكين `x_search` أو تغييره لاحقًا في الإعدادات.

## الحصول على مفتاح API

<Steps>
  <Step title="أنشئ مفتاحًا">
    احصل على مفتاح API من [xAI](https://console.x.ai/).
  </Step>
  <Step title="خزّن المفتاح">
    عيّن `XAI_API_KEY` في بيئة Gateway، أو هيّئه عبر:

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
لتثبيت Gateway، ضعه في `~/.openclaw/.env`.

## آلية العمل

يستخدم Grok استجابات xAI المستندة إلى الويب لتركيب إجابات مع استشهادات مضمّنة، على غرار نهج الإسناد إلى Google Search في Gemini.

## المعلمات المدعومة

يدعم بحث Grok المعلمة `query`.

تُقبل `count` للتوافق المشترك مع `web_search`، لكن Grok لا يزال يعيد إجابة واحدة مركّبة مع استشهادات بدلًا من قائمة نتائج بعدد N.

لا تُدعم عوامل التصفية الخاصة بالمزود حاليًا.

يستخدم Grok مهلة افتراضية خاصة بالمزود قدرها 60 ثانية لأن عمليات بحث xAI Responses المستندة إلى الويب قد تستغرق وقتًا أطول من مهلة `web_search` المشتركة الافتراضية. عيّن `tools.web.search.timeoutSeconds` لتجاوزها.

## تجاوزات عنوان URL الأساسي

عيّن `plugins.entries.xai.config.webSearch.baseUrl` عندما ينبغي توجيه بحث الويب في Grok عبر وكيل مشغّل أو نقطة نهاية Responses متوافقة مع xAI. يرسل OpenClaw الطلبات إلى `<baseUrl>/responses` بعد إزالة الشرطات المائلة اللاحقة. يستخدم `x_search` خيار `webSearch.baseUrl` الاحتياطي نفسه ما لم يتم تعيين `plugins.entries.xai.config.xSearch.baseUrl`.

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- كل المزودين والاكتشاف التلقائي
- [x_search في Web Search](/ar/tools/web#x_search) -- بحث X من الدرجة الأولى عبر xAI
- [Gemini Search](/ar/tools/gemini-search) -- إجابات مركّبة بالذكاء الاصطناعي عبر إسناد Google

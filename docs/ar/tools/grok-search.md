---
read_when:
    - تريد استخدام Grok لـ web_search
    - تريد استخدام xAI OAuth أو XAI_API_KEY للبحث على الويب
summary: بحث الويب في Grok عبر ردود xAI المستندة إلى الويب
title: بحث Grok
x-i18n:
    generated_at: "2026-06-27T18:42:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

يدعم OpenClaw Grok كمزوّد `web_search`، باستخدام ردود xAI المستندة إلى الويب لإنتاج إجابات مركّبة بالذكاء الاصطناعي ومدعومة بنتائج بحث مباشرة مع الاستشهادات.

يفضّل بحث Grok على الويب تسجيل دخول OAuth الحالي لديك في xAI عندما يكون متاحًا.
إذا لم يكن هناك ملف OAuth موجود، فيمكن لمفتاح API نفسه الخاص بـ xAI أيضًا تشغيل أداة `x_search` المضمّنة للبحث في منشورات X (المعروفة سابقًا باسم Twitter) وأداة `code_execution`. إذا خزّنت المفتاح ضمن `plugins.entries.xai.config.webSearch.apiKey`، يعيد OpenClaw استخدامه كخيار احتياطي لمزوّد نماذج xAI المضمّن أيضًا.

بالنسبة إلى مقاييس X على مستوى المنشور، مثل إعادة النشر أو الردود أو العلامات المرجعية أو المشاهدات، ففضّل استخدام `x_search` مع عنوان URL الدقيق للمنشور أو معرّف الحالة بدلًا من استعلام بحث واسع.

## الإعداد الأولي والتكوين

إذا اخترت **Grok** أثناء:

- `openclaw onboard`
- `openclaw configure --section web`

يمكن لـ OpenClaw استخدام ملف OAuth حالي في xAI من دون مطالبتك بمفتاح منفصل للبحث على الويب. إذا لم يكن OAuth متاحًا، فإنه يعود إلى إعداد مفتاح API الخاص بـ xAI.
يمكن لـ OpenClaw أيضًا عرض خطوة متابعة منفصلة لتمكين `x_search` باستخدام بيانات اعتماد xAI نفسها. خطوة المتابعة هذه:

- لا تظهر إلا بعد اختيار Grok لـ `web_search`
- ليست خيارًا منفصلًا عالي المستوى لمزوّد البحث على الويب
- يمكنها اختياريًا ضبط نموذج `x_search` أثناء المسار نفسه

إذا تخطّيتها، يمكنك تمكين `x_search` أو تغييره لاحقًا في الإعدادات.

## تسجيل الدخول أو الحصول على مفتاح API

<Steps>
  <Step title="Use xAI OAuth">
    إذا سبق أن سجّلت الدخول باستخدام xAI أثناء الإعداد الأولي أو مصادقة النموذج، فاختر Grok كمزوّد `web_search`. لا يلزم مفتاح API منفصل:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Use an API key fallback">
    احصل على مفتاح API من [xAI](https://console.x.ai/) عندما لا يكون OAuth متاحًا أو عندما تريد عمدًا إعداد بحث ويب مدعومًا بمفتاح.
  </Step>
  <Step title="Store the key">
    اضبط `XAI_API_KEY` في بيئة Gateway، أو كوّنه عبر:

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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
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

**بدائل بيانات الاعتماد:** سجّل الدخول باستخدام `openclaw models auth login
--provider xai --method oauth`، أو اضبط `XAI_API_KEY` في بيئة Gateway، أو خزّن `plugins.entries.xai.config.webSearch.apiKey`. بالنسبة إلى تثبيت gateway، ضع متغيرات البيئة في `~/.openclaw/.env`.

## آلية العمل

يستخدم Grok ردود xAI المستندة إلى الويب لتركيب إجابات تتضمن استشهادات مضمّنة، على نحو مشابه لنهج Gemini في الاستناد إلى Google Search.

## المعاملات المدعومة

يدعم بحث Grok المعامل `query`.

يُقبل `count` للتوافق المشترك مع `web_search`، لكن Grok لا يزال يعيد إجابة مركّبة واحدة مع استشهادات بدلًا من قائمة نتائج بعدد N.

الفلاتر الخاصة بالمزوّد غير مدعومة حاليًا.

يستخدم Grok مهلة افتراضية خاصة بالمزوّد قدرها 60 ثانية لأن عمليات البحث المستندة إلى الويب في xAI Responses قد تستغرق وقتًا أطول من الإعداد الافتراضي المشترك لـ `web_search`. اضبط `tools.web.search.timeoutSeconds` لتجاوزها.

## تجاوزات عنوان URL الأساسي

اضبط `plugins.entries.xai.config.webSearch.baseUrl` عندما ينبغي أن يمر بحث Grok على الويب عبر وكيل مشغّل أو نقطة نهاية Responses متوافقة مع xAI. يرسل OpenClaw الطلبات إلى `<baseUrl>/responses` بعد إزالة الشرطات المائلة اللاحقة. يستخدم `x_search` خيار `webSearch.baseUrl` الاحتياطي نفسه ما لم يتم ضبط `plugins.entries.xai.config.xSearch.baseUrl`.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [`x_search` في بحث الويب](/ar/tools/web#x_search) -- بحث X من الدرجة الأولى عبر xAI
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مركّبة بالذكاء الاصطناعي عبر الاستناد إلى Google

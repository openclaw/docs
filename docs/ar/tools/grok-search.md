---
read_when:
    - تريد استخدام Grok لإجراء البحث على الويب
    - تريد استخدام xAI OAuth أو `XAI_API_KEY` للبحث على الويب
summary: بحث Grok على الويب عبر استجابات xAI المستندة إلى الويب
title: بحث Grok
x-i18n:
    generated_at: "2026-07-12T06:41:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

يدعم OpenClaw استخدام Grok كمزوّد لـ `web_search`، مستعينًا باستجابات xAI
المستندة إلى الويب لإنتاج إجابات مُركّبة بالذكاء الاصطناعي ومدعومة بنتائج بحث مباشرة
مع استشهادات.

يفضّل بحث Grok على الويب استخدام تسجيل دخول OAuth حالي إلى xAI عند توفره.
إذا لم يوجد ملف تعريف OAuth، فسيشغّل مفتاح واجهة برمجة تطبيقات xAI نفسه أيضًا أداة
`x_search` المضمّنة للبحث في منشورات X (المعروفة سابقًا باسم Twitter)، وأداة
`code_execution`. كما يتيح تخزين المفتاح في `plugins.entries.xai.config.webSearch.apiKey`
لـ OpenClaw إعادة استخدامه كخيار احتياطي لمزوّد نماذج xAI المضمّن.

للحصول على مقاييس X على مستوى المنشور (إعادات النشر، والردود، والإشارات المرجعية، والمشاهدات)، استخدم
[`x_search`](/ar/tools/web#x_search) مع عنوان URL الدقيق للمنشور أو معرّف الحالة
بدلًا من استعلام بحث واسع.

## الإعداد الأولي والتهيئة

يتيح اختيار **Grok** أثناء `openclaw onboard` أو `openclaw configure --section
web` لـ OpenClaw إعادة استخدام ملف تعريف OAuth حالي إلى xAI دون طلب
مفتاح منفصل للبحث على الويب. وفي غياب OAuth، يعود إلى إعداد مفتاح واجهة برمجة تطبيقات xAI.

بعد ذلك، يعرض OpenClaw خطوة متابعة لتمكين `x_search` باستخدام بيانات اعتماد xAI
نفسها. وهذه المتابعة:

- لا تظهر إلا بعد اختيار Grok لـ `web_search`
- ليست خيارًا منفصلًا لمزوّد بحث على الويب من المستوى الأعلى
- يمكنها اختياريًا ضبط نموذج `x_search` ضمن التدفق نفسه

تخطَّها لتمكين `x_search` أو تغييره لاحقًا في التهيئة.

## تسجيل الدخول أو الحصول على مفتاح واجهة برمجة تطبيقات

<Steps>
  <Step title="استخدام OAuth الخاص بـ xAI">
    إذا سبق أن سجّلت الدخول إلى xAI أثناء الإعداد الأولي أو مصادقة النموذج، فاختر
    Grok كمزوّد لـ `web_search`. لا يلزم مفتاح منفصل لواجهة برمجة التطبيقات:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="استخدام مفتاح واجهة برمجة تطبيقات كخيار احتياطي">
    احصل على مفتاح واجهة برمجة تطبيقات من [xAI](https://console.x.ai/) عندما لا يتوفر OAuth
    أو عندما ترغب عمدًا في تهيئة بحث على الويب مدعومة بمفتاح.
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `XAI_API_KEY` في بيئة Gateway، أو نفّذ التهيئة عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## التهيئة

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // اختياري إذا توفر OAuth الخاص بـ xAI أو XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // تجاوز اختياري لعنوان URL الأساسي/الوكيل لواجهة Responses API
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

**بدائل بيانات الاعتماد:** `openclaw models auth login --provider xai
--method oauth`، أو `XAI_API_KEY` في بيئة Gateway، أو
`plugins.entries.xai.config.webSearch.apiKey`. لتثبيت Gateway، ضع متغيرات البيئة
في `~/.openclaw/.env`.

## آلية العمل

يستخدم Grok استجابات xAI المستندة إلى الويب لتركيب إجابات تتضمن استشهادات
مضمنة، على غرار نهج Gemini في الاستناد إلى Google Search.

## المعلمات المدعومة

يدعم بحث Grok المعلمة `query`. وتُقبل `count` للتوافق المشترك مع `web_search`،
لكن Grok يعيد دائمًا إجابة مُركّبة واحدة مع استشهادات
بدلًا من قائمة تحتوي على N من النتائج. ولا تُدعم عوامل التصفية الخاصة بالمزوّد.

تبلغ المهلة الافتراضية لـ Grok مقدار 60 ثانية لأن عمليات البحث المستندة إلى الويب عبر
xAI Responses قد تستغرق وقتًا أطول من القيمة الافتراضية المشتركة لـ `web_search`. ويمكن تجاوزها
باستخدام `tools.web.search.timeoutSeconds`.

## تجاوزات عنوان URL الأساسي

عيّن `plugins.entries.xai.config.webSearch.baseUrl` لتوجيه بحث Grok على الويب
عبر وكيل تابع للمشغّل أو نقطة نهاية Responses متوافقة مع xAI. يرسل OpenClaw
طلبات POST إلى `<baseUrl>/responses` بعد إزالة الشرطات المائلة الختامية. وتعود `x_search`
إلى `webSearch.baseUrl` نفسه كخيار احتياطي ما لم تُضبط
`plugins.entries.xai.config.xSearch.baseUrl`.

## ذو صلة

- [نظرة عامة على البحث على الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [`x_search` في البحث على الويب](/ar/tools/web#x_search) -- بحث أصيل في X عبر xAI
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مُركّبة بالذكاء الاصطناعي عبر الاستناد إلى Google

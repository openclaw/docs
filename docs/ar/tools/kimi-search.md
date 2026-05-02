---
read_when:
    - تريد استخدام Kimi من أجل web_search
    - تحتاج إلى KIMI_API_KEY أو MOONSHOT_API_KEY
summary: بحث الويب في Kimi عبر بحث الويب في Moonshot
title: بحث Kimi
x-i18n:
    generated_at: "2026-05-02T07:45:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
---

يدعم OpenClaw Kimi كموفّر `web_search`، باستخدام بحث الويب من Moonshot
لإنتاج إجابات مركّبة بالذكاء الاصطناعي مع استشهادات.

## الحصول على مفتاح API

<Steps>
  <Step title="Create a key">
    احصل على مفتاح API من [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Store the key">
    عيّن `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في بيئة Gateway، أو
    اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

عند اختيار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة API الخاصة بـ Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- نموذج بحث الويب الافتراضي من Kimi (القيمة الافتراضية هي `kimi-k2.6`)

## الإعدادات

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

إذا كنت تستخدم مضيف API الصيني للمحادثة (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)، يعيد OpenClaw استخدام المضيف نفسه لـ Kimi
`web_search` عند حذف `tools.web.search.kimi.baseUrl`، بحيث لا تصل المفاتيح من
[platform.moonshot.cn](https://platform.moonshot.cn/) إلى نقطة النهاية
الدولية عن طريق الخطأ (والتي تُرجع غالبًا HTTP 401). تجاوز ذلك
باستخدام `tools.web.search.kimi.baseUrl` عندما تحتاج إلى عنوان URL أساسي مختلف للبحث.

**بديل البيئة:** عيّن `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في بيئة
Gateway. لتثبيت Gateway، ضعه في `~/.openclaw/.env`.

إذا حذفت `baseUrl`، يستخدم OpenClaw القيمة الافتراضية `https://api.moonshot.ai/v1`.
إذا حذفت `model`، يستخدم OpenClaw القيمة الافتراضية `kimi-k2.6`.

## آلية العمل

يستخدم Kimi بحث الويب من Moonshot لتركيب إجابات مع استشهادات مضمنة،
على نحو مشابه لنهج الاستجابة المؤسَّسة لدى Gemini وGrok.

يتعامل OpenClaw مع Kimi `web_search` على أنه ناجح فقط بعد أن يعيد Moonshot
دليل تأصيل أصلي من بحث الويب، مثل حمولة أداة `$web_search` قابلة لإعادة التشغيل،
أو `search_results`، أو عناوين URL للاستشهادات. إذا توقف Kimi فورًا مع إجابة
محادثة عادية مثل "لا يمكنني تصفح الإنترنت" ومن دون دليل تأصيل،
يعيد OpenClaw خطأ منظّمًا باسم `kimi_web_search_ungrounded` بدلًا من
تغليف ذلك النص كنتيجة بحث. أعد محاولة الاستعلام، أو انتقل إلى موفّر منظّم
مثل Brave، أو استخدم `web_fetch` / أداة المتصفح عندما يكون لديك بالفعل
عنوان URL مستهدف.

## المعلمات المدعومة

يدعم بحث Kimi `query`.

يُقبل `count` للتوافق المشترك مع `web_search`، لكن Kimi لا يزال
يعيد إجابة مركّبة واحدة مع استشهادات بدلًا من قائمة نتائج بعدد N.

لا تُدعم المرشحات الخاصة بالموفّر حاليًا.

## ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [Moonshot AI](/ar/providers/moonshot) -- وثائق نموذج Moonshot وموفّر Kimi Coding
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مركّبة بالذكاء الاصطناعي عبر التأصيل من Google
- [بحث Grok](/ar/tools/grok-search) -- إجابات مركّبة بالذكاء الاصطناعي عبر التأصيل من xAI

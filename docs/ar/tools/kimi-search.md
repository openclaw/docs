---
read_when:
    - تريد استخدام Kimi من أجل `web_search`
    - أنت بحاجة إلى `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
summary: بحث Kimi على الويب عبر بحث الويب الخاص بـ Moonshot
title: بحث Kimi
x-i18n:
    generated_at: "2026-04-24T08:09:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 15
---

يدعم OpenClaw مزود Kimi باعتباره مزودًا لـ `web_search`، باستخدام بحث الويب الخاص بـ Moonshot
لإنتاج إجابات مُركّبة بالذكاء الاصطناعي مع استشهادات.

## احصل على مفتاح API

<Steps>
  <Step title="أنشئ مفتاحًا">
    احصل على مفتاح API من [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="خزّن المفتاح">
    اضبط `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في بيئة Gateway، أو
    قم بالتهيئة عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

عندما تختار **Kimi** أثناء `openclaw onboard` أو
`openclaw configure --section web`، يمكن لـ OpenClaw أيضًا أن يطلب:

- منطقة Moonshot API:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- نموذج Kimi الافتراضي للبحث على الويب (الافتراضي `kimi-k2.6`)

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

إذا كنت تستخدم مضيف China API للدردشة (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)، فإن OpenClaw يعيد استخدام المضيف نفسه لـ Kimi
`web_search` عندما تكون `tools.web.search.kimi.baseUrl` غير مضبوطة، بحيث لا تصل المفاتيح من
[platform.moonshot.cn](https://platform.moonshot.cn/) إلى
نقطة النهاية الدولية بالخطأ (والتي غالبًا ما تعيد HTTP 401). استخدم التجاوز
`tools.web.search.kimi.baseUrl` عندما تحتاج إلى base URL مختلف للبحث.

**بديل عبر البيئة:** اضبط `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في
بيئة Gateway. وبالنسبة إلى تثبيت gateway، ضعه في `~/.openclaw/.env`.

إذا حذفت `baseUrl`، يستخدم OpenClaw افتراضيًا `https://api.moonshot.ai/v1`.
وإذا حذفت `model`، يستخدم OpenClaw افتراضيًا `kimi-k2.6`.

## كيف يعمل

يستخدم Kimi بحث الويب في Moonshot لتركيب إجابات مع استشهادات مضمنة،
بشكل مشابه لأسلوب الاستجابات المرتكزة في Gemini وGrok.

## المعلمات المدعومة

يدعم بحث Kimi المعلمة `query`.

ويتم قبول `count` لتوافق `web_search` المشترك، لكن Kimi لا يزال
يعيد إجابة مُركّبة واحدة مع استشهادات بدلًا من قائمة من N نتائج.

ولا يتم دعم المرشحات الخاصة بالـ provider حاليًا.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع providers والاكتشاف التلقائي
- [Moonshot AI](/ar/providers/moonshot) -- وثائق مزود نموذج Moonshot + Kimi Coding
- [بحث Gemini](/ar/tools/gemini-search) -- إجابات مركبة بالذكاء الاصطناعي عبر الارتكاز في Google
- [بحث Grok](/ar/tools/grok-search) -- إجابات مركبة بالذكاء الاصطناعي عبر الارتكاز في xAI

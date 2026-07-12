---
read_when:
    - تريد استخدام Kimi لإجراء `web_search`
    - تحتاج إلى `KIMI_API_KEY` أو `MOONSHOT_API_KEY`
summary: بحث Kimi على الويب عبر بحث Moonshot على الويب
title: بحث Kimi
x-i18n:
    generated_at: "2026-07-12T06:41:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi هو موفّر `web_search` مدعوم ببحث الويب الأصلي من Moonshot. تُنشئ Moonshot
إجابة واحدة تتضمن استشهادات مضمّنة، على غرار موفّري الاستجابات المستندة إلى مصادر
في Gemini وGrok، بدلًا من إرجاع قائمة نتائج مرتّبة.

## الإعداد

<Steps>
  <Step title="إنشاء مفتاح">
    احصل على مفتاح API من [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `KIMI_API_KEY` أو `MOONSHOT_API_KEY` في بيئة Gateway (ولعملية تثبيت
    Gateway، أضفه إلى `~/.openclaw/.env`)، أو اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

يؤدي اختيار **Kimi** أثناء `openclaw onboard` أو `openclaw configure --section web`
أيضًا إلى المطالبة بما يلي:

- منطقة API الخاصة بـ Moonshot: `https://api.moonshot.ai/v1` أو `https://api.moonshot.cn/v1`
- نموذج بحث الويب (القيمة الافتراضية هي `kimi-k2.6`)

## الإعدادات

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // اختياري إذا عُيّن KIMI_API_KEY أو MOONSHOT_API_KEY
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

يُكتشف `tools.web.search.provider` تلقائيًا من مفاتيح API المتاحة عند حذفه؛
عيّنه صراحةً إلى `kimi` إذا ضُبطت بيانات اعتماد بحث متعددة.

تعمل أيضًا الصيغة المكافئة المحددة النطاق ضمن `tools.web.search.kimi`‏ (`apiKey` و`baseUrl` و`model`)؛
وتُدمج الصيغتان في الإعدادات النهائية نفسها.

القيم الافتراضية: تكون قيمة `baseUrl` الافتراضية هي `https://api.moonshot.ai/v1` عند حذفها،
وتكون قيمة `model` الافتراضية هي `kimi-k2.6`.

إذا كانت حركة مرور الدردشة تستخدم المضيف الصيني (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)، فإن `web_search` في Kimi يعيد استخدام ذلك المضيف تلقائيًا
عندما لا تكون قيمة `baseUrl` الخاصة به معيّنة، وبذلك لا تصل مفاتيح `.cn` عن طريق الخطأ إلى
نقطة النهاية الدولية (التي تُرجع HTTP 401 لهذه المفاتيح). عيّن قيمة `baseUrl`
صريحة لـ Kimi لتجاوز هذا التوارث.

## متطلب الاستناد إلى المصادر

لا يعيد OpenClaw نتيجة `web_search` من Kimi إلا بعد أن تتضمن استجابة Moonshot
دليلًا أصليًا على الاستناد إلى بحث الويب، مثل إعادة تشغيل استدعاء أداة `$web_search`،
أو `search_results`، أو عناوين URL للاستشهادات. إذا أجاب Kimi مباشرةً دون
استناد إلى مصادر (على سبيل المثال: «لا يمكنني تصفح الإنترنت»)، فإن OpenClaw يعيد
خطأ `kimi_web_search_ungrounded` بدلًا من التعامل مع ذلك النص على أنه نتيجة بحث.
أعد محاولة الاستعلام، أو انتقل إلى موفّر منظّم مثل Brave، أو استخدم
`web_fetch` / أداة المتصفح عندما يكون لديك بالفعل عنوان URL مستهدف.

## معاملات الأداة

| المعامل                                                         | مدعوم                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `query`                                                         | نعم                                                                                                                          |
| `count`                                                         | مقبول للتوافق بين الموفّرين، لكنه يُتجاهل: يعيد Kimi دائمًا إجابة واحدة مُنشأة، وليس قائمة من N نتائج                      |
| `country`, `language`, `freshness`, `date_after`, `date_before` | لا                                                                                                                           |

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) - جميع الموفّرين والاكتشاف التلقائي
- [Moonshot AI](/ar/providers/moonshot) - توثيق نموذج Moonshot وموفّر Kimi Coding
- [بحث Gemini](/ar/tools/gemini-search) - إجابات مُنشأة بالذكاء الاصطناعي عبر الاستناد إلى مصادر Google
- [بحث Grok](/ar/tools/grok-search) - إجابات مُنشأة بالذكاء الاصطناعي عبر الاستناد إلى مصادر xAI

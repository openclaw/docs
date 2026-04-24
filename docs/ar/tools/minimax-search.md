---
read_when:
    - تريد استخدام MiniMax لـ web_search
    - تحتاج إلى مفتاح MiniMax Coding Plan
    - تريد إرشادات مضيف البحث MiniMax للصين/العالمي
summary: بحث MiniMax عبر Coding Plan search API
title: بحث MiniMax
x-i18n:
    generated_at: "2026-04-24T08:10:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

يدعم OpenClaw خدمة MiniMax كمزوّد `web_search` عبر MiniMax
Coding Plan search API. وهي تعيد نتائج بحث منظَّمة تتضمن العناوين وعناوين URL
والمقتطفات والاستعلامات ذات الصلة.

## احصل على مفتاح Coding Plan

<Steps>
  <Step title="إنشاء مفتاح">
    أنشئ أو انسخ مفتاح MiniMax Coding Plan من
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
  </Step>
  <Step title="تخزين المفتاح">
    اضبط `MINIMAX_CODE_PLAN_KEY` في بيئة Gateway، أو هيّئه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

يقبل OpenClaw أيضًا `MINIMAX_CODING_API_KEY` كاسم مستعار بيئي. ولا يزال `MINIMAX_API_KEY`
مقروءًا كـ fallback للتوافق عندما يكون يشير بالفعل إلى token خاص بـ coding-plan.

## التهيئة

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // اختياري إذا كان MINIMAX_CODE_PLAN_KEY مضبوطًا
            region: "global", // أو "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**بديل بيئي:** اضبط `MINIMAX_CODE_PLAN_KEY` في بيئة Gateway.
في تثبيت gateway، ضعه في `~/.openclaw/.env`.

## اختيار المنطقة

يستخدم MiniMax Search نقاط النهاية التالية:

- عالمي: `https://api.minimax.io/v1/coding_plan/search`
- الصين: `https://api.minimaxi.com/v1/coding_plan/search`

إذا لم يتم ضبط `plugins.entries.minimax.config.webSearch.region`، فإن OpenClaw يحلّ
المنطقة بهذا الترتيب:

1. `tools.web.search.minimax.region` / `webSearch.region` المملوك للـ Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

وهذا يعني أن onboarding الخاص بالصين أو `MINIMAX_API_HOST=https://api.minimaxi.com/...`
يحافظ تلقائيًا على MiniMax Search على مضيف الصين أيضًا.

حتى عندما تكون قد صادقت MiniMax عبر مسار OAuth ‏`minimax-portal`،
فإن web search يظل مسجلًا بمعرّف المزوّد `minimax`; ويُستخدم عنوان base URL الخاص بمزوّد OAuth
فقط كتلميح منطقة لاختيار مضيف الصين/العالمي.

## المعلمات المدعومة

يدعم MiniMax Search ما يلي:

- `query`
- `count` ‏(يقص OpenClaw قائمة النتائج المرجعة إلى العدد المطلوب)

لا تُدعَم حاليًا المرشحات الخاصة بالمزوّد.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [MiniMax](/ar/providers/minimax) -- إعداد النموذج والصورة والكلام والمصادقة

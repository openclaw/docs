---
read_when:
    - تريد استخدام MiniMax لـ web_search
    - تحتاج إلى مفتاح خطة رموز MiniMax أو رمز OAuth
    - تريد إرشادات حول مضيف البحث الصيني/العالمي في MiniMax
summary: MiniMax Search عبر واجهة برمجة تطبيقات البحث في Token Plan
title: بحث MiniMax
x-i18n:
    generated_at: "2026-05-11T20:43:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

يدعم OpenClaw مزوّد `web_search` من MiniMax عبر API البحث MiniMax
Token Plan. يُرجع نتائج بحث منظّمة تتضمن العناوين وعناوين URL
والمقتطفات والاستعلامات ذات الصلة.

## الحصول على اعتماد Token Plan

<Steps>
  <Step title="إنشاء مفتاح">
    أنشئ مفتاح MiniMax Token Plan أو انسخه من
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    يمكن لإعدادات OAuth إعادة استخدام `MINIMAX_OAUTH_TOKEN` بدلاً من ذلك.
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `MINIMAX_CODE_PLAN_KEY` في بيئة Gateway، أو اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

يقبل OpenClaw أيضاً `MINIMAX_CODING_API_KEY` و`MINIMAX_OAUTH_TOKEN` و
`MINIMAX_API_KEY` كأسماء مستعارة لمتغيرات البيئة. يجب أن يشير `MINIMAX_API_KEY` إلى
اعتماد Token Plan مفعّل للبحث؛ قد لا تقبل نقطة نهاية بحث Token Plan مفاتيح API
العادية لنماذج MiniMax.

## الإعدادات

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
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

**بديل البيئة:** عيّن `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو
`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` في بيئة Gateway.
لتثبيت gateway، ضعه في `~/.openclaw/.env`.

## اختيار المنطقة

يستخدم بحث MiniMax نقاط النهاية هذه:

- عالمي: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

إذا لم يتم تعيين `plugins.entries.minimax.config.webSearch.region`، فإن OpenClaw يحل
المنطقة بهذا الترتيب:

1. `tools.web.search.minimax.region` / `webSearch.region` المملوك من Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

يعني ذلك أن إعداد CN أو `MINIMAX_API_HOST=https://api.minimaxi.com/...`
يبقي بحث MiniMax تلقائياً على مضيف CN أيضاً.

حتى عندما تصادق مع MiniMax عبر مسار OAuth `minimax-portal`،
لا يزال بحث الويب يسجَّل بمعرّف المزوّد `minimax`؛ ويُستخدم عنوان URL الأساسي
لمزوّد OAuth كتلميح منطقة لاختيار مضيف CN/العالمي، ويمكن لـ `MINIMAX_OAUTH_TOKEN`
تلبية اعتماد الحامل لبحث MiniMax.

## المعاملات المدعومة

| المعامل | النوع    | القيود | الوصف                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | مطلوب    | سلسلة استعلام البحث.                                                        |
| `count`   | integer | 1-10        | عدد النتائج المراد إرجاعها. يقلّص OpenClaw القائمة المُرجعة إلى هذا الحجم. |

المرشحات الخاصة بالمزوّد غير مدعومة حالياً.

## ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [MiniMax](/ar/providers/minimax) -- إعداد النماذج والصور والكلام والمصادقة

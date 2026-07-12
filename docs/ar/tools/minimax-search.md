---
read_when:
    - تريد استخدام MiniMax لإجراء web_search
    - تحتاج إلى مفتاح MiniMax Token Plan أو رمز OAuth مميز
    - تريد إرشادات حول مضيف البحث لـ MiniMax في الصين/عالميًا
summary: بحث MiniMax عبر واجهة API للبحث ضمن خطة Token
title: بحث MiniMax
x-i18n:
    generated_at: "2026-07-12T06:43:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

يدعم OpenClaw استخدام MiniMax بوصفه مزوّد `web_search` عبر واجهة API للبحث ضمن خطة الرموز المميّزة في MiniMax. ويُرجع نتائج بحث منظّمة تتضمن العناوين وعناوين URL والمقتطفات والاستعلامات ذات الصلة.

## الحصول على بيانات اعتماد لخطة الرموز المميّزة

<Steps>
  <Step title="إنشاء مفتاح">
    أنشئ مفتاح خطة الرموز المميّزة في MiniMax أو انسخه من
    [منصة MiniMax](https://platform.minimax.io/user-center/basic-information/interface-key).
    ويمكن لإعدادات OAuth إعادة استخدام `MINIMAX_OAUTH_TOKEN` بدلًا منه.
  </Step>
  <Step title="تخزين المفتاح">
    عيّن `MINIMAX_CODE_PLAN_KEY` في بيئة Gateway، أو اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

يقبل OpenClaw أيضًا `MINIMAX_CODING_API_KEY` و`MINIMAX_OAUTH_TOKEN` و`MINIMAX_API_KEY` بوصفها أسماء بديلة لمتغيرات البيئة، ويجري التحقق منها بهذا الترتيب بعد `MINIMAX_CODE_PLAN_KEY`. يجب أن يشير `MINIMAX_API_KEY` إلى بيانات اعتماد لخطة الرموز المميّزة تدعم البحث؛ فقد لا تقبل نقطة نهاية البحث لخطة الرموز المميّزة مفاتيح واجهة API العادية لنماذج MiniMax.

## الإعداد

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // اختياري إذا كان متغير بيئة لخطة الرموز المميّزة في MiniMax معيّنًا
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

**بديل باستخدام البيئة:** عيّن `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو
`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` في بيئة Gateway.
وفي تثبيت Gateway، ضعه في `~/.openclaw/.env`.

## اختيار المنطقة

يستخدم بحث MiniMax نقاط النهاية التالية:

- عالميًا: `https://api.minimax.io/v1/coding_plan/search`
- الصين: `https://api.minimaxi.com/v1/coding_plan/search`

إذا لم تُعيَّن `plugins.entries.minimax.config.webSearch.region`، يحدّد OpenClaw
المنطقة بالترتيب التالي:

1. `tools.web.search.minimax.region` / الإعداد `webSearch.region` المملوك للـ Plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

يعني ذلك أن الإعداد الأولي للصين أو `MINIMAX_API_HOST=https://api.minimaxi.com/...`
يُبقي بحث MiniMax تلقائيًا على المضيف الصيني أيضًا.

حتى عند مصادقة MiniMax عبر مسار OAuth المسمى `minimax-portal`، يظل بحث الويب
مسجلًا بمعرّف المزوّد `minimax`؛ ويُستخدم عنوان URL الأساسي لمزوّد OAuth بوصفه
تلميحًا للمنطقة لاختيار المضيف الصيني أو العالمي، ويمكن لـ `MINIMAX_OAUTH_TOKEN`
توفير بيانات اعتماد رمز الحامل لبحث MiniMax.

## المعلمات المدعومة

| المعلمة | النوع    | القيود              | الوصف                                                                    |
| ------- | -------- | ------------------- | ------------------------------------------------------------------------ |
| `query` | سلسلة نصية | مطلوبة              | سلسلة استعلام البحث.                                                     |
| `count` | عدد صحيح | 1-10، الافتراضي 5   | عدد النتائج المطلوب إرجاعها. يقتطع OpenClaw القائمة المُرجعة إلى هذا الحجم. |

لا تُدعم حاليًا عوامل التصفية الخاصة بالمزوّد.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [MiniMax](/ar/providers/minimax) -- إعداد النموذج والصور والكلام والمصادقة

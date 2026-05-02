---
read_when:
    - تريد استخدام MiniMax لـ web_search
    - تحتاج إلى مفتاح MiniMax Token Plan أو رمز OAuth
    - تريد إرشادات حول مضيف البحث في MiniMax CN/العالمي
summary: MiniMax Search عبر واجهة برمجة تطبيقات البحث الخاصة بـ Token Plan
title: بحث MiniMax
x-i18n:
    generated_at: "2026-05-02T07:45:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

يدعم OpenClaw MiniMax كموفّر `web_search` عبر واجهة API للبحث الخاصة بـ MiniMax
Token Plan. تُرجع نتائج بحث منظّمة تتضمن عناوين، وعناوين URL،
ومقتطفات، واستعلامات ذات صلة.

## الحصول على بيانات اعتماد Token Plan

<Steps>
  <Step title="إنشاء مفتاح">
    أنشئ مفتاح MiniMax Token Plan أو انسخه من
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key).
    يمكن لإعدادات OAuth إعادة استخدام `MINIMAX_OAUTH_TOKEN` بدلاً من ذلك.
  </Step>
  <Step title="تخزين المفتاح">
    اضبط `MINIMAX_CODE_PLAN_KEY` في بيئة Gateway، أو اضبطه عبر:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

يقبل OpenClaw أيضًا `MINIMAX_CODING_API_KEY` و`MINIMAX_OAUTH_TOKEN` و
`MINIMAX_API_KEY` كأسماء مستعارة للبيئة. يجب أن يشير `MINIMAX_API_KEY` إلى
بيانات اعتماد Token Plan مفعّل للبحث؛ قد لا تُقبل مفاتيح API العادية لنماذج MiniMax
من نقطة نهاية بحث Token Plan.

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

**بديل البيئة:** اضبط `MINIMAX_CODE_PLAN_KEY` أو `MINIMAX_CODING_API_KEY` أو
`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` في بيئة Gateway.
لتثبيت gateway، ضعه في `~/.openclaw/.env`.

## اختيار المنطقة

يستخدم MiniMax Search نقاط النهاية هذه:

- عالمي: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

إذا لم يتم ضبط `plugins.entries.minimax.config.webSearch.region`، فإن OpenClaw يحل
المنطقة بهذا الترتيب:

1. `tools.web.search.minimax.region` / `webSearch.region` المملوك للـ plugin
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

يعني ذلك أن إعداد CN أو `MINIMAX_API_HOST=https://api.minimaxi.com/...`
يبقي MiniMax Search تلقائيًا على مضيف CN أيضًا.

حتى عندما تصادق مع MiniMax عبر مسار OAuth `minimax-portal`،
يظل بحث الويب مسجلاً بمعرّف الموفّر `minimax`؛ ويُستخدم عنوان URL الأساسي لموفّر OAuth
كتلميح منطقة لاختيار مضيف CN/العالمي، ويمكن لـ `MINIMAX_OAUTH_TOKEN`
أن يلبّي بيانات اعتماد bearer الخاصة بـ MiniMax Search.

## المعلمات المدعومة

يدعم MiniMax Search:

- `query`
- `count` (يقلّص OpenClaw قائمة النتائج المُرجعة إلى العدد المطلوب)

لا تُدعم حاليًا عوامل التصفية الخاصة بالموفّر.

## ذو صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [MiniMax](/ar/providers/minimax) -- إعداد النموذج، والصورة، والكلام، والمصادقة

---
read_when:
    - تريد استخدام Ollama من أجل `web_search`
    - تريد مزوّد `web_search` لا يتطلب مفتاحًا
    - تحتاج إلى إرشادات إعداد Ollama Web Search
summary: البحث على الويب عبر Ollama المضيف المُهيّأ لديك
title: البحث على الويب في Ollama
x-i18n:
    generated_at: "2026-04-26T11:42:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

يدعم OpenClaw **Ollama Web Search** كمزوّد `web_search` مضمّن. وهو
يستخدم واجهة API الخاصة بالبحث على الويب في Ollama ويُرجع نتائج منظَّمة تتضمن العناوين وعناوين URL
والمقتطفات.

وعلى خلاف مزوّد نماذج Ollama، لا يحتاج هذا الإعداد إلى مفتاح API
افتراضيًا. لكنه يتطلب:

- مضيف Ollama يمكن لـ OpenClaw الوصول إليه
- `ollama signin`

## الإعداد

<Steps>
  <Step title="ابدأ تشغيل Ollama">
    تأكد من أن Ollama مثبت ويعمل.
  </Step>
  <Step title="سجّل الدخول">
    شغّل:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="اختر Ollama Web Search">
    شغّل:

    ```bash
    openclaw configure --section web
    ```

    ثم اختر **Ollama Web Search** كمزوّد.

  </Step>
</Steps>

إذا كنت تستخدم Ollama بالفعل للنماذج، فإن Ollama Web Search يعيد استخدام
المضيف المُهيّأ نفسه.

## الإعدادات

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

تجاوز اختياري لمضيف Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

إذا لم يتم ضبط عنوان URL أساسي صريح لـ Ollama، يستخدم OpenClaw العنوان `http://127.0.0.1:11434`.

إذا كان مضيف Ollama لديك يتوقع مصادقة bearer، فإن OpenClaw يعيد استخدام
`models.providers.ollama.apiKey` (أو مصادقة المزوّد المطابقة المدعومة بمتغيرات البيئة)
لطلبات البحث على الويب أيضًا.

## ملاحظات

- لا يلزم وجود حقل مفتاح API مخصص للبحث على الويب لهذا المزوّد.
- إذا كان مضيف Ollama محميًا بالمصادقة، فإن OpenClaw يعيد استخدام مفتاح API
  العادي الخاص بمزوّد Ollama عندما يكون موجودًا.
- يحذّر OpenClaw أثناء الإعداد إذا كان Ollama غير قابل للوصول أو لم يتم تسجيل الدخول، لكنه
  لا يمنع الاختيار.
- يمكن للاكتشاف التلقائي في وقت التشغيل الرجوع إلى Ollama Web Search عندما لا يكون هناك
  مزوّد ذو أولوية أعلى ومهيّأ ببيانات اعتماد.
- يستخدم المزوّد نقطة النهاية `/api/web_search` الخاصة بـ Ollama.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدات والاكتشاف التلقائي
- [Ollama](/ar/providers/ollama) -- إعداد نماذج Ollama وأوضاع السحابة/المحلي

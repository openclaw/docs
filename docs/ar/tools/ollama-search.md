---
read_when:
    - تريد استخدام Ollama من أجل `web_search`
    - تريد مزود `web_search` لا يحتاج إلى مفتاح
    - أنت بحاجة إلى إرشادات إعداد بحث الويب في Ollama
summary: بحث الويب عبر Ollama باستخدام مضيف Ollama المضبوط لديك
title: بحث الويب في Ollama
x-i18n:
    generated_at: "2026-04-24T08:10:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68d486c43d80319427302fa77fb77e34b7ffd50e8f096f9cb50ccb8dd77bc0da
    source_path: tools/ollama-search.md
    workflow: 15
---

يدعم OpenClaw **بحث الويب عبر Ollama** باعتباره مزودًا مضمّنًا لـ `web_search`.
ويستخدم واجهة API التجريبية للبحث على الويب في Ollama ويعيد نتائج منظمة
تحتوي على العناوين، وعناوين URL، والمقتطفات.

وعلى خلاف مزود نماذج Ollama، فإن هذا الإعداد لا يحتاج إلى مفتاح API
افتراضيًا. لكنه يتطلب:

- مضيف Ollama يمكن لـ OpenClaw الوصول إليه
- `ollama signin`

## الإعداد

<Steps>
  <Step title="ابدأ Ollama">
    تأكد من أن Ollama مثبتة وتعمل.
  </Step>
  <Step title="سجّل الدخول">
    شغّل:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="اختر بحث الويب في Ollama">
    شغّل:

    ```bash
    openclaw configure --section web
    ```

    ثم اختر **Ollama Web Search** باعتباره provider.

  </Step>
</Steps>

إذا كنت تستخدم Ollama بالفعل للنماذج، فإن Ollama Web Search يعيد استخدام
المضيف المضبوط نفسه.

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

إذا لم يتم ضبط base URL صريح لـ Ollama، يستخدم OpenClaw القيمة `http://127.0.0.1:11434`.

إذا كان مضيف Ollama الخاص بك يتوقع مصادقة bearer، فإن OpenClaw يعيد استخدام
`models.providers.ollama.apiKey` ‏(أو مصادقة provider المطابقة والمدعومة بالبيئة)
لطلبات البحث على الويب أيضًا.

## ملاحظات

- لا يلزم حقل مفتاح API خاص بالبحث على الويب لهذا provider.
- إذا كان مضيف Ollama محميًا بالمصادقة، فإن OpenClaw يعيد استخدام مفتاح API العادي الخاص
  بمزود Ollama عند وجوده.
- يحذّر OpenClaw أثناء الإعداد إذا كانت Ollama غير قابلة للوصول أو لم يتم تسجيل الدخول فيها،
  لكنه لا يمنع الاختيار.
- يمكن للاكتشاف التلقائي في وقت التشغيل أن يعود إلى بحث الويب في Ollama عندما لا يكون أي provider
  أعلى أولوية ومعتمد ببيانات اعتماد مضبوطًا.
- يستخدم provider نقطة النهاية التجريبية `/api/experimental/web_search`
  الخاصة بـ Ollama.

## ذو صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع providers والاكتشاف التلقائي
- [Ollama](/ar/providers/ollama) -- إعداد نماذج Ollama وأوضاع السحابة/المحلي

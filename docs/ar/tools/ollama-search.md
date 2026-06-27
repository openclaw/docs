---
read_when:
    - تريد استخدام Ollama من أجل web_search
    - تريد موفّر web_search بلا مفتاح
    - تريد استخدام بحث الويب المستضاف من Ollama مع OLLAMA_API_KEY
    - تحتاج إلى إرشادات إعداد بحث الويب في Ollama
summary: بحث الويب عبر مضيف Ollama محلي أو واجهة Ollama API المستضافة
title: بحث الويب في Ollama
x-i18n:
    generated_at: "2026-06-27T18:43:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

يدعم OpenClaw **Ollama Web Search** بوصفه مزوّد `web_search` مضمّنًا. يستخدم
واجهة API للبحث على الويب من Ollama ويعيد نتائج منظمة تتضمن عناوين، وعناوين URL،
ومقتطفات.

بالنسبة إلى Ollama المحلي أو المستضاف ذاتيًا، لا يحتاج هذا الإعداد إلى مفتاح API
افتراضيًا. لكنه يتطلب:

- مضيف Ollama يمكن الوصول إليه من OpenClaw
- `ollama signin`

للبحث المستضاف المباشر، اضبط عنوان URL الأساسي لمزوّد Ollama على `https://ollama.com`
وقدّم `OLLAMA_API_KEY` حقيقيًا.

## الإعداد

<Steps>
  <Step title="بدء Ollama">
    تأكد من تثبيت Ollama وتشغيله.
  </Step>
  <Step title="تسجيل الدخول">
    شغّل:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="اختيار Ollama Web Search">
    شغّل:

    ```bash
    openclaw configure --section web
    ```

    ثم اختر **Ollama Web Search** بوصفه المزوّد.

  </Step>
</Steps>

إذا كنت تستخدم Ollama للنماذج بالفعل، فسيعيد Ollama Web Search استخدام المضيف
نفسه الذي تم تكوينه.

## التكوين

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
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

إذا كنت تكوّن Ollama بالفعل بوصفه مزوّد نماذج، فيمكن لمزوّد البحث على الويب
إعادة استخدام ذلك المضيف بدلًا من ذلك:

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

يستخدم مزوّد نماذج Ollama المفتاح `baseUrl` بوصفه المفتاح الأساسي. كما يحترم مزوّد البحث على الويب `baseURL` في `models.providers.ollama` للتوافق مع أمثلة التكوين بنمط OpenAI SDK.

إذا لم يتم تعيين عنوان URL أساسي صريح لـ Ollama، يستخدم OpenClaw العنوان `http://127.0.0.1:11434`.

إذا كان مضيف Ollama يتوقع مصادقة حامل الرمز، يعيد OpenClaw استخدام
`models.providers.ollama.apiKey` (أو مصادقة المزوّد المطابقة والمدعومة بمتغيرات البيئة)
للطلبات إلى ذلك المضيف المكوّن.

Ollama Web Search المستضاف المباشر:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## ملاحظات

- لا يلزم حقل مفتاح API خاص بالبحث على الويب لهذا المزوّد.
- إذا كان مضيف Ollama محميًا بالمصادقة، يعيد OpenClaw استخدام مفتاح API العادي
  لمزوّد Ollama عند وجوده.
- إذا كان `baseUrl` هو `https://ollama.com`، يستدعي OpenClaw
  `https://ollama.com/api/web_search` مباشرة ويرسل مفتاح API المكوّن لـ Ollama
  بوصفه مصادقة حامل الرمز.
- إذا لم يكشف المضيف المكوّن عن البحث على الويب وكان `OLLAMA_API_KEY` معيّنًا،
  يمكن لـ OpenClaw الرجوع إلى `https://ollama.com/api/web_search` دون إرسال
  مفتاح البيئة هذا إلى المضيف المحلي.
- يحذر OpenClaw أثناء الإعداد إذا تعذر الوصول إلى Ollama أو لم يتم تسجيل الدخول،
  لكنه لا يمنع الاختيار.
- لا يحدد OpenClaw تلقائيًا Ollama Web Search عند عدم تكوين مزوّد أعلى أولوية
  ذي بيانات اعتماد؛ اختره صراحة باستخدام
  `tools.web.search.provider: "ollama"`.
- تستخدم مضيفات خادم Ollama المحلي نقطة نهاية الوكيل المحلية
  `/api/experimental/web_search`، التي توقع الطلبات وتعيد توجيهها إلى Ollama Cloud.
- تستخدم مضيفات `https://ollama.com` نقطة النهاية العامة المستضافة
  `/api/web_search` مباشرة مع مصادقة مفتاح API بصيغة حامل الرمز.

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والكشف التلقائي
- [Ollama](/ar/providers/ollama) -- إعداد نماذج Ollama وأوضاع السحابة/المحلي

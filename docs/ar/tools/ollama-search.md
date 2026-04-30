---
read_when:
    - تريد استخدام Ollama من أجل web_search
    - تريد موفّر web_search بلا مفتاح
    - تريد استخدام بحث الويب المستضاف من Ollama باستخدام OLLAMA_API_KEY
    - تحتاج إلى إرشادات لإعداد بحث الويب في Ollama
summary: بحث الويب من Ollama عبر مضيف Ollama محلي أو واجهة برمجة تطبيقات Ollama المستضافة
title: بحث الويب في Ollama
x-i18n:
    generated_at: "2026-04-30T08:31:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

يدعم OpenClaw **Ollama Web Search** كمزوّد `web_search` مضمن. وهو
يستخدم واجهة API للبحث على الويب من Ollama ويعيد نتائج منظّمة تتضمن عناوين وURLs
ومقتطفات.

بالنسبة إلى Ollama المحلي أو المستضاف ذاتيًا، لا يحتاج هذا الإعداد إلى مفتاح API
افتراضيًا. لكنه يتطلب:

- مضيف Ollama يمكن الوصول إليه من OpenClaw
- `ollama signin`

للبحث المستضاف المباشر، اضبط عنوان URL الأساسي لمزوّد Ollama على `https://ollama.com`
ووفّر `OLLAMA_API_KEY` حقيقيًا.

## الإعداد

<Steps>
  <Step title="Start Ollama">
    تأكد من تثبيت Ollama وتشغيله.
  </Step>
  <Step title="Sign in">
    شغّل:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    شغّل:

    ```bash
    openclaw configure --section web
    ```

    ثم اختر **Ollama Web Search** كمزوّد.

  </Step>
</Steps>

إذا كنت تستخدم Ollama بالفعل للنماذج، فإن Ollama Web Search يعيد استخدام المضيف
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

إذا كنت قد كوّنت Ollama بالفعل كمزوّد نماذج، فيمكن لمزوّد البحث على الويب
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

يستخدم مزوّد نماذج Ollama المفتاح `baseUrl` باعتباره المفتاح القانوني. كما يراعي مزوّد البحث على الويب `baseURL` ضمن `models.providers.ollama` للتوافق مع أمثلة التكوين بأسلوب OpenAI SDK.

إذا لم يتم تعيين عنوان URL أساسي صريح لـ Ollama، يستخدم OpenClaw `http://127.0.0.1:11434`.

إذا كان مضيف Ollama يتوقع مصادقة Bearer، يعيد OpenClaw استخدام
`models.providers.ollama.apiKey` (أو مصادقة المزوّد المطابقة والمدعومة من env)
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

- لا يلزم حقل مفتاح API مخصص للبحث على الويب لهذا المزوّد.
- إذا كان مضيف Ollama محميًا بالمصادقة، يعيد OpenClaw استخدام مفتاح API العادي
  لمزوّد Ollama عند وجوده.
- إذا كان `baseUrl` هو `https://ollama.com`، يستدعي OpenClaw
  `https://ollama.com/api/web_search` مباشرة ويرسل مفتاح API المكوّن لـ Ollama
  كمصادقة Bearer.
- إذا لم يوفّر المضيف المكوّن البحث على الويب وكان `OLLAMA_API_KEY` معيّنًا،
  يمكن لـ OpenClaw الرجوع إلى `https://ollama.com/api/web_search` دون إرسال
  مفتاح env ذلك إلى المضيف المحلي.
- يحذّر OpenClaw أثناء الإعداد إذا كان Ollama غير قابل للوصول أو لم يتم تسجيل الدخول إليه، لكنه
  لا يمنع الاختيار.
- يمكن للاكتشاف التلقائي في وقت التشغيل الرجوع إلى Ollama Web Search عند عدم تكوين
  مزوّد ذي أولوية أعلى ويملك بيانات اعتماد.
- تستخدم مضيفات برنامج Ollama الخفي المحلي نقطة نهاية الوكيل المحلي
  `/api/experimental/web_search`، والتي توقّع الطلب وتعيد توجيهه إلى Ollama Cloud.
- تستخدم مضيفات `https://ollama.com` نقطة النهاية العامة المستضافة
  `/api/web_search` مباشرة مع مصادقة مفتاح API من نوع Bearer.

## ذات صلة

- [نظرة عامة على Web Search](/ar/tools/web) -- جميع المزوّدين والاكتشاف التلقائي
- [Ollama](/ar/providers/ollama) -- إعداد نماذج Ollama وأوضاع السحابة/المحلي

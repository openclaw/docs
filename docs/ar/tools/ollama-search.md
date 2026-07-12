---
read_when:
    - تريد استخدام Ollama لإجراء البحث على الويب
    - تريد موفّر web_search لا يتطلب مفتاحًا
    - تريد استخدام Ollama Web Search المستضاف مع OLLAMA_API_KEY
    - تحتاج إلى إرشادات لإعداد Ollama Web Search
summary: بحث الويب في Ollama عبر مضيف Ollama محلي أو واجهة Ollama API المستضافة
title: بحث الويب في Ollama
x-i18n:
    generated_at: "2026-07-12T06:44:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

يدعم OpenClaw **بحث الويب من Ollama** بصفته موفّر `web_search` مضمّنًا،
ويُرجع العناوين وعناوين URL والمقتطفات من واجهة API لبحث الويب الخاصة بـ Ollama.

لا يحتاج Ollama المحلي/المستضاف ذاتيًا إلى مفتاح API افتراضيًا؛ بل يتطلب
مضيف Ollama يمكن الوصول إليه، بالإضافة إلى `ollama signin`. أما البحث المستضاف
المباشر (من دون Ollama محلي) فيتطلب `baseUrl: "https://ollama.com"` ومفتاح
`OLLAMA_API_KEY` حقيقيًا.

## الإعداد

<Steps>
  <Step title="تشغيل Ollama">
    تأكد من تثبيت Ollama وتشغيله.
  </Step>
  <Step title="تسجيل الدخول">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="اختيار بحث الويب من Ollama">
    ```bash
    openclaw configure --section web
    ```

    حدّد **Ollama Web Search** بصفته الموفّر.

  </Step>
</Steps>

إذا كنت تستخدم Ollama للنماذج بالفعل، فسيعيد بحث الويب من Ollama استخدام
المضيف نفسه الذي سبق تكوينه.

<Note>
  لا يختار OpenClaw بحث الويب من Ollama تلقائيًا بدلًا من موفّر ذي أولوية أعلى
  ومزوّد ببيانات اعتماد؛ بل يجب اختياره صراحةً باستخدام
  `tools.web.search.provider: "ollama"`.
</Note>

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

تجاوز اختياري للمضيف، يقتصر نطاقه على بحث الويب فقط:

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

أو أعد استخدام المضيف الذي سبق تكوينه لموفّر نماذج Ollama:

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

المفتاح `models.providers.ollama.baseUrl` هو المفتاح القياسي؛ ويقبل موفّر
بحث الويب أيضًا `baseURL` في ذلك الموضع للتوافق مع أمثلة التكوين بأسلوب
OpenAI SDK. وإذا لم يُضبط شيء، يستخدم OpenClaw القيمة الافتراضية
`http://127.0.0.1:11434`.

بحث الويب المستضاف المباشر من Ollama (من دون Ollama محلي):

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

## المصادقة وتوجيه الطلبات

- لا يوجد حقل مفتاح API خاص ببحث الويب؛ إذ يعيد الموفّر استخدام
  `models.providers.ollama.apiKey` (أو مصادقة الموفّر المطابقة والمدعومة
  بمتغيرات البيئة) عندما يكون المضيف المكوّن محميًا بالمصادقة.
- ترتيب تحديد المضيف: `plugins.entries.ollama.config.webSearch.baseUrl` ←
  `models.providers.ollama.baseUrl` (أو `baseURL`) ← `http://127.0.0.1:11434`.
- إذا كان المضيف المحدد هو `https://ollama.com`، يستدعي OpenClaw
  `https://ollama.com/api/web_search` مباشرةً باستخدام مفتاح API لمصادقة
  حامل الرمز.
- بخلاف ذلك، يستدعي OpenClaw أولًا نقطة نهاية الوكيل المحلي
  `/api/experimental/web_search` (التي توقّع الطلب وتعيد توجيهه إلى سحابة
  Ollama)، ثم يعود احتياطيًا إلى `/api/web_search` على المضيف نفسه. وإذا فشل
  كلاهما وكان `OLLAMA_API_KEY` مضبوطًا، فإنه يعيد المحاولة مرة واحدة مع
  `https://ollama.com/api/web_search` باستخدام ذلك المفتاح، من دون إرساله إلى
  المضيف المحلي.
- يحذّر OpenClaw أثناء الإعداد إذا تعذر الوصول إلى Ollama أو لم يُسجّل الدخول
  إليه، لكنه لا يمنع تحديد الموفّر.

## مواضيع ذات صلة

- [نظرة عامة على بحث الويب](/ar/tools/web) -- جميع الموفّرين والاكتشاف التلقائي
- [Ollama](/ar/providers/ollama) -- إعداد نماذج Ollama والأوضاع السحابية/المحلية

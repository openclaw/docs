---
read_when:
    - تريد أن يبدأ OpenClaw خادم نماذج محليًا فقط عند اختيار نموذجه
    - تشغّل ds4 أو inferrs أو vLLM أو llama.cpp أو MLX أو خادمًا محليًا آخر متوافقًا مع OpenAI
    - تحتاج إلى التحكم في بدء التشغيل البارد، والجاهزية، وإيقاف التشغيل عند الخمول لموفري الخدمة المحليين.
summary: بدء تشغيل خوادم النماذج المحلية عند الطلب قبل طلبات نماذج OpenClaw
title: خدمات النماذج المحلية
x-i18n:
    generated_at: "2026-06-27T17:39:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

يتيح `models.providers.<id>.localService` لـ OpenClaw تشغيل خادم نماذج محلي
مملوك للمزود عند الطلب. هذا إعداد على مستوى المزود: عندما ينتمي النموذج المحدد
إلى ذلك المزود، يفحص OpenClaw الخدمة، ويشغل العملية إذا كانت نقطة النهاية
متوقفة، وينتظر الجاهزية، ثم يرسل طلب النموذج.

استخدمه للخوادم المحلية التي تكون مكلفة عند إبقائها قيد التشغيل طوال اليوم، أو
للإعدادات اليدوية حيث ينبغي أن يكون اختيار النموذج كافيًا لتشغيل الواجهة الخلفية.

## آلية العمل

1. يُحل طلب النموذج إلى مزود مهيأ.
2. إذا كان لدى ذلك المزود `localService`، يفحص OpenClaw `healthUrl`.
3. إذا نجح الفحص، يستخدم OpenClaw الخادم الموجود.
4. إذا فشل الفحص، يشغل OpenClaw `command` مع `args`.
5. يستطلع OpenClaw الجاهزية حتى تنتهي مهلة `readyTimeoutMs`.
6. يُرسل طلب النموذج عبر نقل المزود المعتاد.
7. إذا كان OpenClaw قد شغل العملية وكانت `idleStopMs` موجبة، فسيتم
   إيقاف العملية بعد أن يبقى آخر طلب قيد التنفيذ خاملاً لهذه المدة.

لا يثبت OpenClaw ‏launchd أو systemd أو Docker أو daemon لهذا الغرض. يكون
الخادم عملية فرعية لعملية OpenClaw التي احتاجته أولًا.

## شكل الإعداد

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## الحقول

- `command`: مسار تنفيذي مطلق. لا يُستخدم بحث الصدفة.
- `args`: وسيطات العملية. لا تُطبق قواعد توسيع الصدفة أو الأنابيب أو globbing أو الاقتباس.
- `cwd`: دليل عمل اختياري للعملية.
- `env`: متغيرات بيئة اختيارية تُدمج فوق بيئة عملية OpenClaw.
- `healthUrl`: عنوان URL للجاهزية. إذا أُهمل، يضيف OpenClaw ‏`/models` إلى
  `baseUrl`، بحيث يصبح `http://127.0.0.1:8000/v1`
  `http://127.0.0.1:8000/v1/models`.
- `readyTimeoutMs`: مهلة جاهزية بدء التشغيل. الافتراضي: `120000`.
- `idleStopMs`: تأخير إيقاف التشغيل عند الخمول للعمليات التي يشغلها OpenClaw. القيمة `0` أو
  إهماله يبقي العملية قيد التشغيل حتى يخرج OpenClaw.

## مثال Inferrs

Inferrs هو واجهة خلفية مخصصة متوافقة مع OpenAI وتستخدم `/v1`، لذلك تعمل واجهة API
الخاصة بالخدمة المحلية نفسها مع إدخال المزود `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

استبدل `command` بنتيجة `which inferrs` على الجهاز الذي يشغل OpenClaw.

## مثال ds4

للإعداد الكامل، وإرشادات ضبط حجم السياق، وأوامر التحقق، راجع
[ds4](/ar/providers/ds4).

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

## ملاحظات تشغيلية

- تدير عملية OpenClaw واحدة العملية الفرعية التي شغلتها. وستعيد عملية OpenClaw أخرى
  ترى عنوان URL نفسه لفحص الصحة قيد التشغيل استخدامه دون تبنيه.
- يُسلسل بدء التشغيل لكل أمر مزود ومجموعة وسيطات، لذلك لا تؤدي الطلبات المتزامنة
  إلى إنشاء خوادم مكررة للإعداد نفسه.
- تحتفظ استجابات البث النشطة بعقد استخدام؛ وينتظر إيقاف التشغيل عند الخمول حتى
  تكتمل معالجة جسم الاستجابة.
- استخدم `timeoutSeconds` على المزودين المحليين البطيئين حتى لا تصل عمليات البدء البارد وعمليات التوليد الطويلة
  إلى مهلة طلب النموذج الافتراضية.
- استخدم `healthUrl` صريحًا إذا كان خادمك يعرض الجاهزية في مكان آخر غير
  `/v1/models`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="Local models" href="/ar/gateway/local-models" icon="server">
    إعداد النماذج المحلية، وخيارات المزودين، وإرشادات السلامة.
  </Card>
  <Card title="Inferrs" href="/ar/providers/inferrs" icon="cpu">
    شغل OpenClaw عبر خادم inferrs المحلي المتوافق مع OpenAI.
  </Card>
</CardGroup>

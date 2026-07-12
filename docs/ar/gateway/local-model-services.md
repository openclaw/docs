---
read_when:
    - تريد أن يبدأ OpenClaw خادم نموذج محليًا فقط عند تحديد موفّر النموذج أو التضمينات الخاص به
    - تُشغِّل ds4 أو inferrs أو vLLM أو llama.cpp أو MLX أو خادمًا محليًا آخر متوافقًا مع OpenAI
    - تحتاج إلى التحكم في بدء التشغيل البارد، والجاهزية، وإيقاف التشغيل عند الخمول لموفّري الخدمات المحليين
summary: شغّل خوادم النماذج المحلية عند الطلب قبل طلبات النماذج والتضمين في OpenClaw
title: خدمات النماذج المحلية
x-i18n:
    generated_at: "2026-07-12T05:53:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

يبدأ `models.providers.<id>.localService` خادم نماذج محليًا مملوكًا لمزوّد عند الطلب. عندما يختار طلب نموذج أو تضمين ذلك المزوّد، يتحقق OpenClaw من نقطة نهاية الصحة، ويبدأ العملية إذا كانت متوقفة، وينتظر الجاهزية، ثم يرسل الطلب. استخدمه لتجنب إبقاء الخوادم المحلية مرتفعة التكلفة قيد التشغيل طوال اليوم.

## آلية العمل

1. يُحل طلب النموذج أو التضمين إلى مزوّد مُهيأ.
2. إذا كان لدى ذلك المزوّد `localService`، يتحقق OpenClaw من `healthUrl`.
3. عند نجاح التحقق، يستخدم OpenClaw الخادم قيد التشغيل بالفعل.
4. عند فشل التحقق، يشغّل OpenClaw الأمر `command` باستخدام `args`.
5. يستطلع OpenClaw نقطة نهاية الصحة حتى انتهاء مهلة `readyTimeoutMs`.
6. يمر الطلب عبر مسار النقل المعتاد للنموذج أو التضمين.
7. إذا بدأ OpenClaw العملية وكانت `idleStopMs` مضبوطة، فإنه يوقف العملية بعد بقاء آخر طلب قيد التنفيذ خاملًا طوال تلك المدة.

لا يثبّت OpenClaw أداة launchd أو systemd أو Docker أو أي خدمة خفية لهذا الغرض. الخادم مجرد عملية فرعية عادية للعملية التابعة لـ OpenClaw التي احتاجت إليه أولًا.

تُنفّذ عملية البدء تسلسليًا لكل مزوّد مُهيأ ولكل مجموعة من الأمر والوسيطات ومتغيرات البيئة، بحيث لا تؤدي طلبات المحادثة والتضمين المتزامنة للخدمة نفسها إلى تشغيل خوادم مكررة. يحتفظ كل طلب بعقد الاستئجار الخاص به حتى تكتمل معالجة الاستجابة، لذلك ينتظر الإيقاف عند الخمول اكتمال جميع طلبات النماذج والتضمين قيد التنفيذ. تظل الأسماء البديلة للمزوّدين المُهيأة منفصلة: يمكن لاسمين بديلين الإشارة إلى مضيفَي GPU مختلفين من دون دمجهما تحت معرّف المحوّل نفسه المتوافق مع Ollama أو LM Studio أو OpenAI.

إذا كانت عملية أخرى لـ OpenClaw تشغّل بالفعل خادمًا سليمًا عند `healthUrl` نفسه، تعيد هذه العملية استخدامه من دون أن تتولى إدارته (تدير كل عملية فقط العملية الفرعية التي بدأتها بنفسها). تتضمن سجلات البدء والخروج نهايات محدودة ومنقّحة لمخرجات العملية الفرعية، بالإضافة إلى تفاصيل التوقيت والخروج؛ ولا تُعرض قيم البيئة المُهيأة مطلقًا.

## بنية الإعداد

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

اضبط `timeoutSeconds` في إدخال المزوّد (وليس في `localService`) كي لا تتسبب عمليات البدء البارد البطيئة وعمليات التوليد الطويلة في بلوغ مهلة طلب النموذج الافتراضية. اضبط `healthUrl` صراحةً كلما كان خادمك يعرض الجاهزية في موضع آخر غير `/models` ضمن عنوان URL الأساسي.

## الحقول

| الحقل            | مطلوب | الوصف                                                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | نعم      | المسار المطلق للملف التنفيذي. لا يُجرى بحث في PATH الخاص بالصدفة.                                                                                      |
| `args`           | لا       | وسيطات العملية. لا يوجد توسيع للصدفة أو أنابيب أو مطابقة أنماط أو معالجة لعلامات الاقتباس.                                                                  |
| `cwd`            | لا       | دليل العمل للعملية.                                                                                                   |
| `env`            | لا       | متغيرات البيئة المدمجة فوق بيئة عملية OpenClaw.                                                                  |
| `healthUrl`      | لا       | عنوان URL للجاهزية. القيمة الافتراضية هي `baseUrl` مع إلحاق `/models` به (يتحول `http://127.0.0.1:8000/v1` إلى `http://127.0.0.1:8000/v1/models`). |
| `readyTimeoutMs` | لا       | الموعد النهائي لجاهزية بدء التشغيل. القيمة الافتراضية: `120000`.                                                                                       |
| `idleStopMs`     | لا       | مهلة الإيقاف عند الخمول لعملية بدأها OpenClaw. تؤدي القيمة `0` أو عدم تحديدها إلى إبقائها قيد التشغيل حتى خروج OpenClaw.                             |

## مثال Inferrs

Inferrs هو نظام خلفي مخصص لنقطة `/v1` ومتوافق مع OpenAI، لذا تعمل واجهة `localService` نفسها مع إدخال مزوّد `inferrs`:

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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

استبدل `command` بنتيجة `which inferrs` على الجهاز الذي يشغّل OpenClaw. إعداد Inferrs الكامل: [Inferrs](/ar/providers/inferrs).

## مثال ds4

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

أوامر الإعداد الكامل وتحديد حجم السياق والتحقق: [ds4](/ar/providers/ds4).

## ذو صلة

<CardGroup cols={2}>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    إعداد النماذج المحلية وخيارات المزوّد وإرشادات السلامة.
  </Card>
  <Card title="Inferrs" href="/ar/providers/inferrs" icon="cpu">
    شغّل OpenClaw عبر خادم Inferrs المحلي المتوافق مع OpenAI.
  </Card>
</CardGroup>

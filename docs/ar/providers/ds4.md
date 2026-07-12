---
read_when:
    - تريد تشغيل OpenClaw باستخدام antirez/ds4
    - تريد واجهة خلفية محلية لـ DeepSeek V4 Flash تدعم استدعاءات الأدوات
    - تحتاج إلى إعداد OpenClaw الخاص بـ ds4-server
summary: شغّل OpenClaw عبر ds4، وهو خادم محلي متوافق مع OpenAI لنموذج DeepSeek V4 Flash
title: ds4
x-i18n:
    generated_at: "2026-07-12T06:28:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) يقدّم DeepSeek V4 Flash من واجهة Metal خلفية محلية
عبر واجهة `/v1` متوافقة مع OpenAI. يتصل OpenClaw بـ ds4
من خلال عائلة المزوّدات العامة `openai-completions`.

لا يُعد ds4 Plugin مزوّد مضمّنًا في OpenClaw. اضبطه ضمن
`models.providers.ds4`، ثم اختر `ds4/deepseek-v4-flash`.

| الخاصية       | القيمة                                                        |
| ------------- | ------------------------------------------------------------- |
| معرّف المزوّد | `ds4`                                                         |
| Plugin        | لا يوجد (إعداد فقط)                                           |
| API           | إكمالات المحادثة المتوافقة مع OpenAI (`openai-completions`)   |
| عنوان URL الأساسي | `http://127.0.0.1:18000/v1` (مقترح)                       |
| معرّف النموذج | `deepseek-v4-flash`                                           |
| استدعاءات الأدوات | `tools` / `tool_calls` بأسلوب OpenAI                       |
| الاستدلال     | `thinking` و`reasoning_effort` بأسلوب DeepSeek                |

## المتطلبات

- نظام macOS يدعم Metal.
- نسخة مستنسخة عاملة من ds4 تتضمن `ds4-server` وملف GGUF الخاص بـ DeepSeek V4 Flash.
- ذاكرة كافية للسياق الذي تختاره؛ إذ تخصّص قيم `--ctx` الأكبر ذاكرة KV إضافية
  عند بدء تشغيل الخادم.

<Warning>
تتضمن دورات وكيل OpenClaw مخططات الأدوات وسياق مساحة العمل. قد يجتاز سياق صغير
مثل `--ctx 4096` اختبارات curl المباشرة، لكنه يفشل في تشغيلات الوكيل الكاملة مع
`500 prompt exceeds context`. استخدم `--ctx 32768` على الأقل لاختبارات التحقق
السريعة للوكيل والأدوات. لا تستخدم `--ctx 393216` إلا عند توفر ذاكرة كافية
ولتفعيل Think Max في ds4.
</Warning>

## البدء السريع

<Steps>
  <Step title="تشغيل ds4-server">
    استبدل `<DS4_DIR>` بمسار النسخة المستنسخة من ds4.

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="التحقق من نقطة النهاية المتوافقة مع OpenAI">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    يجب أن تتضمن الاستجابة `deepseek-v4-flash`.

  </Step>
  <Step title="إضافة إعداد مزوّد OpenClaw">
    أضف الإعداد من [الإعداد الكامل](#full-config)، ثم شغّل فحصًا للنموذج لمرة
    واحدة:

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## الإعداد الكامل

استخدم هذا الإعداد عندما يكون ds4 قيد التشغيل بالفعل على `127.0.0.1:18000`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

حافظ على توافق `contextWindow` مع `ds4-server --ctx`. وحافظ على توافق `maxTokens`
مع `--tokens` ما لم تكن تريد عمدًا أن يطلب OpenClaw مخرجات أقل من القيمة
الافتراضية للخادم.

## التشغيل عند الطلب

يمكن لـ OpenClaw تشغيل ds4 فقط عند اختيار نموذج `ds4/...`. أضف
`localService` إلى إدخال المزوّد نفسه:

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
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

يجب أن تكون قيمة `command` مسارًا مطلقًا لملف قابل للتنفيذ. لا يُستخدم البحث
عبر الصدفة ولا توسيع `~`. راجع [خدمات النماذج المحلية](/ar/gateway/local-model-services)
للاطلاع على جميع حقول `localService`.

## Think Max

يطبّق ds4 ميزة Think Max فقط عند تحقق الشرطين التاليين:

- يبدأ `ds4-server` باستخدام `--ctx 393216` أو قيمة أعلى.
- يستخدم الطلب `reasoning_effort: "max"` (أو حقل الجهد المكافئ في ds4).

إذا شغّلت هذا السياق الكبير، فحدّث كلاً من أعلام الخادم والبيانات الوصفية
لنموذج OpenClaw:

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## الاختبار

فحص HTTP مباشر يتجاوز OpenClaw:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

توجيه نموذج OpenClaw (كما في فحص البدء السريع):

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

اختبار تحقق سريع كامل للوكيل واستدعاء الأدوات، بسياق لا يقل عن 32768:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

النتيجة المتوقعة:

- تكون قيمة `executionTrace.winnerProvider` هي `ds4`
- تكون قيمة `executionTrace.winnerModel` هي `deepseek-v4-flash`
- تكون قيمة `toolSummary.calls` على الأقل `1`
- يبدأ `finalAssistantVisibleText` بـ `tool-ok`

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="يتعذر على curl /v1/models الاتصال">
    ds4 ليس قيد التشغيل أو غير مرتبط بالمضيف/المنفذ المحدد في `baseUrl`. شغّل
    `ds4-server`، ثم أعد المحاولة:

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    قيمة `--ctx` المضبوطة أصغر من اللازم لدورة OpenClaw. ارفع قيمة
    `ds4-server --ctx`، ثم حدّث `models.providers.ds4.models[].contextWindow`
    لتطابقها. تحتاج دورات الوكيل الكاملة التي تتضمن أدوات إلى سياق أكبر بكثير
    من طلب curl مباشر ذي رسالة واحدة.
  </Accordion>

  <Accordion title="عدم تفعيل Think Max">
    لا يستخدم ds4 ميزة Think Max إلا عندما تكون قيمة `--ctx` على الأقل `393216`
    ويطلب الطلب `reasoning_effort: "max"`. تعود السياقات الأصغر إلى الاستدلال
    العالي.
  </Accordion>

  <Accordion title="بطء الطلب الأول">
    يمر ds4 بمرحلة إقامة أولية باردة في Metal وتهيئة للنموذج. اضبط
    `localService.readyTimeoutMs: 300000` عندما يشغّل OpenClaw الخادم عند
    الطلب.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="خدمات النماذج المحلية" href="/ar/gateway/local-model-services" icon="play">
    شغّل خوادم النماذج المحلية عند الطلب قبل طلبات النماذج.
  </Card>
  <Card title="النماذج المحلية" href="/ar/gateway/local-models" icon="server">
    اختر واجهات النماذج الخلفية المحلية وشغّلها.
  </Card>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اضبط مراجع المزوّد والمصادقة وتجاوز الفشل.
  </Card>
  <Card title="DeepSeek" href="/ar/providers/deepseek" icon="brain">
    سلوك مزوّد DeepSeek الأصلي وعناصر التحكم في التفكير.
  </Card>
</CardGroup>

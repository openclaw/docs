---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتهيئته
summary: تشغيل OpenClaw مع LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T07:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio هو تطبيق سهل الاستخدام لكنه قوي لتشغيل النماذج ذات الأوزان المفتوحة على أجهزتك الخاصة. يتيح لك تشغيل نماذج llama.cpp ‏(GGUF) أو نماذج MLX ‏(على Apple Silicon). يأتي في هيئة حزمة بواجهة رسومية أو daemon بلا واجهة (`llmster`). وللوثائق الخاصة بالمنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## بداية سريعة

1. ثبّت LM Studio (سطح المكتب) أو `llmster` (بلا واجهة)، ثم ابدأ الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. ابدأ الخادم

تأكد من أنك إما تبدأ تطبيق سطح المكتب أو تشغّل daemon باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT للحصول على تجربة سلسة. تعرّف على المزيد في [دليل LM Studio الخاص بـ JIT وTTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. يتطلب OpenClaw قيمة رمز لـ LM Studio. اضبط `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت مصادقة LM Studio معطلة، فاستخدم أي قيمة رمز غير فارغة:

```bash
export LM_API_TOKEN="placeholder-key"
```

للتفاصيل الخاصة بإعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل onboarding واختر `LM Studio`:

```bash
openclaw onboard
```

5. في onboarding، استخدم مطالبة `Default model` لاختيار نموذج LM Studio الخاص بك.

يمكنك أيضًا ضبطه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`). وتقوم
مراجع النماذج في OpenClaw بإضافة بادئة اسم المزوّد: `lmstudio/qwen/qwen3.5-9b`. ويمكنك العثور على المفتاح الدقيق لـ
أي نموذج عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى الحقل `key`.

## Onboarding غير تفاعلي

استخدم onboarding غير التفاعلي عندما تريد برمجة الإعداد نصيًا (CI، أو provisioning، أو bootstrap عن بُعد):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

أو حدّد base URL أو النموذج مع مفتاح API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

يأخذ `--custom-model-id` مفتاح النموذج كما تعيده LM Studio (مثل `qwen/qwen3.5-9b`)، من دون
بادئة المزوّد `lmstudio/`.

يتطلب onboarding غير التفاعلي `--lmstudio-api-key` (أو `LM_API_TOKEN` في env).
وبالنسبة إلى خوادم LM Studio غير الموثقة، فإن أي قيمة رمز غير فارغة تعمل.

لا يزال `--custom-api-key` مدعومًا للتوافق، لكن `--lmstudio-api-key` هو المفضل مع LM Studio.

يكتب هذا الإعداد `models.providers.lmstudio`، ويضبط النموذج الافتراضي على
`lmstudio/<custom-model-id>`، ويكتب ملف تعريف المصادقة `lmstudio:default`.

يمكن للإعداد التفاعلي أن يطالب بطول سياق تحميل مفضل اختياري، ويطبقه على نماذج LM Studio المكتشفة التي يحفظها في الإعداد.

## الإعداد

### توافق استخدام البث

LM Studio متوافقة مع استخدام البث. وعندما لا تُصدر كائن `usage`
بصيغة OpenAI، يستعيد OpenClaw أعداد الرموز من بيانات
`timings.prompt_n` / `timings.predicted_n` الخاصة بأسلوب llama.cpp بدلًا من ذلك.

وينطبق السلوك نفسه على الواجهات الخلفية المحلية الأخرى المتوافقة مع OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### إعداد صريح

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

### لم يتم اكتشاف LM Studio

تأكد من أن LM Studio تعمل وأنك ضبطت `LM_API_TOKEN` (وبالنسبة إلى الخوادم غير الموثقة، فإن أي قيمة رمز غير فارغة تعمل):

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

تحقّق من إمكانية الوصول إلى API:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

إذا أبلغ الإعداد عن HTTP 401، فتحقق من مفتاح API لديك:

- تحقق من أن `LM_API_TOKEN` يطابق المفتاح المهيأ في LM Studio.
- للتفاصيل الخاصة بإعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان خادمك لا يتطلب مصادقة، فاستخدم أي قيمة رمز غير فارغة لـ `LM_API_TOKEN`.

### تحميل النموذج في الوقت المناسب

تدعم LM Studio تحميل النماذج في الوقت المناسب (JIT)، حيث يتم تحميل النماذج عند أول طلب. تأكد من تفعيل هذا لتجنب أخطاء 'Model not loaded'.

## ذو صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

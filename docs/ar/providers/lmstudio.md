---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد وتهيئة LM Studio
summary: تشغيل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T07:40:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio تطبيق سهل الاستخدام وقوي لتشغيل النماذج مفتوحة الأوزان على عتادك الخاص. يتيح لك تشغيل نماذج llama.cpp (GGUF) أو نماذج MLX (Apple Silicon). يأتي كحزمة واجهة رسومية أو كخدمة daemon بلا واجهة (`llmster`). للاطلاع على وثائق المنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

1. ثبّت LM Studio (سطح المكتب) أو `llmster` (بلا واجهة)، ثم شغّل الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. شغّل الخادم

تأكد من تشغيل تطبيق سطح المكتب أو تشغيل daemon باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT للحصول على تجربة سلسة. تعرّف على المزيد في [دليل LM Studio JIT وTTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. إذا كانت مصادقة LM Studio مفعّلة، فاضبط `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت مصادقة LM Studio معطّلة، يمكنك ترك مفتاح API فارغًا أثناء إعداد OpenClaw التفاعلي.

للاطلاع على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل الإعداد الأولي واختر `LM Studio`:

```bash
openclaw onboard
```

5. في الإعداد الأولي، استخدم مطالبة `Default model` لاختيار نموذج LM Studio الخاص بك.

يمكنك أيضًا ضبطه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`). تضيف مراجع نماذج OpenClaw اسم المزوّد في البداية: `lmstudio/qwen/qwen3.5-9b`. يمكنك العثور على المفتاح الدقيق لنموذج عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى الحقل `key`.

## الإعداد الأولي غير التفاعلي

استخدم الإعداد الأولي غير التفاعلي عندما تريد أتمتة الإعداد بالسكربتات (CI، التهيئة، التشغيل الأولي عن بُعد):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

أو حدّد عنوان URL الأساسي، والنموذج، ومفتاح API الاختياري:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

يأخذ `--custom-model-id` مفتاح النموذج كما تُرجعه LM Studio (مثل `qwen/qwen3.5-9b`)، من دون بادئة المزوّد `lmstudio/`.

بالنسبة إلى خوادم LM Studio المصادق عليها، مرّر `--lmstudio-api-key` أو اضبط `LM_API_TOKEN`.
بالنسبة إلى خوادم LM Studio غير المصادق عليها، احذف المفتاح؛ يخزّن OpenClaw علامة محلية غير سرية.

يبقى `--custom-api-key` مدعومًا للتوافق، لكن يُفضّل استخدام `--lmstudio-api-key` مع LM Studio.

يكتب هذا `models.providers.lmstudio` ويضبط النموذج الافتراضي على
`lmstudio/<custom-model-id>`. عند توفير مفتاح API، يكتب الإعداد أيضًا ملف تعريف المصادقة
`lmstudio:default`.

يمكن للإعداد التفاعلي أن يطلب طول سياق تحميل مفضّل اختياريًا ويطبّقه على نماذج LM Studio المكتشفة التي يحفظها في الإعدادات.
تثق إعدادات Plugin الخاصة بـ LM Studio بنقطة نهاية LM Studio المضبوطة لطلبات النماذج، بما في ذلك مضيفو loopback وLAN وtailnet. يمكنك إلغاء ذلك عبر ضبط `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## الإعدادات

### توافق استخدام البث

LM Studio متوافق مع استخدام البث. عندما لا يصدر كائن `usage` على شكل OpenAI، يستعيد OpenClaw أعداد الرموز من بيانات `timings.prompt_n` / `timings.predicted_n` الوصفية بنمط llama.cpp بدلًا من ذلك.

ينطبق سلوك استخدام البث نفسه على الخلفيات المحلية التالية المتوافقة مع OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### توافق التفكير

عندما يبلّغ اكتشاف `/api/v1/models` في LM Studio عن خيارات استدلال خاصة بالنموذج، يحافظ OpenClaw على تلك القيم الأصلية في بيانات توافق النموذج الوصفية. بالنسبة إلى نماذج التفكير الثنائية التي تعلن `allowed_options: ["off", "on"]`، يربط OpenClaw التفكير المعطّل بـ `off` ومستويات `/think` المفعّلة بـ `on` بدلًا من إرسال قيم خاصة بـ OpenAI فقط مثل `low` أو `medium`.

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

تأكد من أن LM Studio قيد التشغيل. إذا كانت المصادقة مفعّلة، فاضبط `LM_API_TOKEN` أيضًا:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

تحقق من إمكانية الوصول إلى API:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

إذا أبلغ الإعداد عن HTTP 401، فتحقق من مفتاح API الخاص بك:

- تحقق من أن `LM_API_TOKEN` يطابق المفتاح المضبوط في LM Studio.
- للاطلاع على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان خادمك لا يتطلب مصادقة، فاترك المفتاح فارغًا أثناء الإعداد.

### تحميل النموذج في الوقت المناسب

يدعم LM Studio تحميل النماذج في الوقت المناسب (JIT)، حيث تُحمّل النماذج عند أول طلب. يحمّل OpenClaw النماذج مسبقًا عبر نقطة نهاية التحميل الأصلية في LM Studio افتراضيًا، وهذا يساعد عندما تكون JIT معطّلة. للسماح لـ JIT في LM Studio وسلوك TTL عند الخمول والإخلاء التلقائي بامتلاك دورة حياة النموذج، عطّل خطوة التحميل المسبق في OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### مضيف LM Studio على LAN أو tailnet

استخدم العنوان القابل للوصول لمضيف LM Studio، واحتفظ بـ `/v1`، وتأكد من أن LM Studio مربوط بما يتجاوز loopback على ذلك الجهاز:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

بخلاف مزوّدي OpenAI المتوافقين العامين، يثق `lmstudio` تلقائيًا بنقطة النهاية المحلية/الخاصة المضبوطة له لطلبات النماذج المحمية. كما يتم الوثوق تلقائيًا بمعرّفات المزوّدين المخصصة لـ loopback مثل `localhost` أو `127.0.0.1`؛ وبالنسبة إلى معرّفات المزوّدين المخصصة على LAN أو tailnet أو DNS الخاص، اضبط `models.providers.<id>.request.allowPrivateNetwork: true` صراحةً.

## ذات صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتكوينه
summary: تشغيل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T08:21:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio تطبيق سهل الاستخدام وقوي لتشغيل النماذج مفتوحة الأوزان على عتادك الخاص. يتيح لك تشغيل نماذج llama.cpp (GGUF) أو MLX (Apple Silicon). يأتي كحزمة بواجهة رسومية أو كخدمة بلا واجهة (`llmster`). للاطلاع على وثائق المنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

1. ثبّت LM Studio (سطح المكتب) أو `llmster` (بلا واجهة)، ثم شغّل الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. شغّل الخادم

تأكد من تشغيل تطبيق سطح المكتب أو تشغيل الخدمة باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT للحصول على تجربة سلسة. تعرّف على المزيد في [دليل LM Studio JIT وTTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. إذا كانت مصادقة LM Studio مفعّلة، فعيّن `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت مصادقة LM Studio معطّلة، يمكنك ترك مفتاح API فارغًا أثناء إعداد OpenClaw التفاعلي.

للحصول على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل الإعداد الأولي واختر `LM Studio`:

```bash
openclaw onboard
```

5. في الإعداد الأولي، استخدم موجّه `Default model` لاختيار نموذج LM Studio الخاص بك.

يمكنك أيضًا تعيينه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`). تضيف مراجع نماذج OpenClaw اسم المزوّد في البداية: `lmstudio/qwen/qwen3.5-9b`. يمكنك العثور على المفتاح الدقيق لنموذج عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى حقل `key`.

## الإعداد الأولي غير التفاعلي

استخدم الإعداد الأولي غير التفاعلي عندما تريد كتابة إعداد قابل للتنفيذ آليًا (CI، التهيئة، التمهيد عن بُعد):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

أو حدّد عنوان URL الأساسي والنموذج ومفتاح API الاختياري:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

يأخذ `--custom-model-id` مفتاح النموذج كما يعيده LM Studio (مثل `qwen/qwen3.5-9b`)، بدون بادئة المزوّد `lmstudio/`.

بالنسبة إلى خوادم LM Studio التي تتطلب مصادقة، مرّر `--lmstudio-api-key` أو عيّن `LM_API_TOKEN`.
بالنسبة إلى خوادم LM Studio التي لا تتطلب مصادقة، احذف المفتاح؛ يخزّن OpenClaw علامة محلية غير سرية.

يبقى `--custom-api-key` مدعومًا للتوافق، لكن يُفضّل استخدام `--lmstudio-api-key` مع LM Studio.

يكتب هذا `models.providers.lmstudio` ويعيّن النموذج الافتراضي إلى
`lmstudio/<custom-model-id>`. عند تقديم مفتاح API، يكتب الإعداد أيضًا ملف تعريف المصادقة
`lmstudio:default`.

يمكن للإعداد التفاعلي طلب طول سياق تحميل مفضّل اختياريًا ويطبّقه على نماذج LM Studio المكتشفة التي يحفظها في الإعدادات.
تثق إعدادات Plugin الخاص بـ LM Studio بنقطة نهاية LM Studio المضبوطة لطلبات النماذج، بما في ذلك الاسترجاع المحلي وLAN ومضيفو tailnet. يمكنك إلغاء ذلك بتعيين `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## الإعدادات

### توافق استخدام البث

LM Studio متوافق مع استخدام البث. عندما لا يصدر كائن `usage` على هيئة OpenAI، يستعيد OpenClaw أعداد الرموز من بيانات تعريف نمط llama.cpp
`timings.prompt_n` / `timings.predicted_n` بدلًا من ذلك.

ينطبق سلوك استخدام البث نفسه على هذه الخلفيات المحلية المتوافقة مع OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### توافق التفكير

عندما يبلّغ اكتشاف `/api/v1/models` في LM Studio عن خيارات استدلال خاصة بالنموذج، يحافظ OpenClaw على تلك القيم الأصلية في بيانات توافق النموذج. بالنسبة إلى نماذج التفكير الثنائية التي تعلن `allowed_options: ["off", "on"]`، يربط OpenClaw تعطيل التفكير بـ `off` ومستويات `/think` المفعّلة بـ `on` بدلًا من إرسال قيم خاصة بـ OpenAI فقط مثل `low` أو `medium`.

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

تأكد من أن LM Studio قيد التشغيل. إذا كانت المصادقة مفعّلة، فعيّن أيضًا `LM_API_TOKEN`:

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
- للحصول على تفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان خادمك لا يتطلب مصادقة، فاترك المفتاح فارغًا أثناء الإعداد.

### تحميل النموذج في الوقت المناسب

يدعم LM Studio تحميل النماذج في الوقت المناسب (JIT)، حيث تُحمّل النماذج عند أول طلب. تأكد من تفعيل ذلك لتجنب أخطاء 'Model not loaded'.

### مضيف LM Studio عبر LAN أو tailnet

استخدم العنوان القابل للوصول لمضيف LM Studio، واحتفظ بـ `/v1`، وتأكد من أن LM Studio مرتبط بما يتجاوز الاسترجاع المحلي على ذلك الجهاز:

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

على عكس المزوّدين العامين المتوافقين مع OpenAI، يثق `lmstudio` تلقائيًا بنقطة النهاية المحلية/الخاصة المضبوطة لطلبات النماذج المحمية. كما يتم الوثوق تلقائيًا بمعرّفات المزوّد المخصصة للاسترجاع المحلي مثل `localhost` أو `127.0.0.1`؛ وبالنسبة إلى LAN أو tailnet أو معرّفات المزوّد المخصصة عبر DNS خاص، عيّن `models.providers.<id>.request.allowPrivateNetwork: true` صراحةً.

## ذات صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

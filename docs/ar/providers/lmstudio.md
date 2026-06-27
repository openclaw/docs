---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتكوينه
summary: تشغيل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-27T18:25:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio تطبيق سهل الاستخدام وقوي لتشغيل نماذج open-weight على عتادك الخاص. يتيح لك تشغيل نماذج llama.cpp (GGUF) أو MLX (Apple Silicon). يتوفر كحزمة GUI أو كخدمة daemon بلا واجهة (`llmster`). للاطلاع على وثائق المنتج والإعداد، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

1. ثبّت LM Studio (سطح المكتب) أو `llmster` (بلا واجهة)، ثم شغّل الخادم المحلي:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. شغّل الخادم

تأكد من تشغيل تطبيق سطح المكتب أو تشغيل خدمة daemon باستخدام الأمر التالي:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

إذا كنت تستخدم التطبيق، فتأكد من تفعيل JIT لتجربة سلسة. تعرّف على المزيد في [دليل LM Studio JIT وTTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. إذا كانت مصادقة LM Studio مفعّلة، فعيّن `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

إذا كانت مصادقة LM Studio معطّلة، يمكنك ترك مفتاح API فارغًا أثناء إعداد OpenClaw التفاعلي.

لتفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. شغّل الإعداد الأولي واختر `LM Studio`:

```bash
openclaw onboard
```

5. في الإعداد الأولي، استخدم مطالبة `Default model` لاختيار نموذج LM Studio.

يمكنك أيضًا تعيينه أو تغييره لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تتبع مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`). تسبق مراجع نماذج OpenClaw
اسم المزوّد: `lmstudio/qwen/qwen3.5-9b`. يمكنك العثور على المفتاح الدقيق
لنموذج عبر تشغيل `curl http://localhost:1234/api/v1/models` والنظر إلى حقل `key`.

## الإعداد الأولي غير التفاعلي

استخدم الإعداد الأولي غير التفاعلي عندما تريد تنفيذ الإعداد عبر سكربت (CI أو التجهيز أو التشغيل التمهيدي عن بُعد):

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

يأخذ `--custom-model-id` مفتاح النموذج كما ترجعه LM Studio (مثل `qwen/qwen3.5-9b`)، من دون
بادئة المزوّد `lmstudio/`.

لخوادم LM Studio التي تستخدم المصادقة، مرّر `--lmstudio-api-key` أو عيّن `LM_API_TOKEN`.
لخوادم LM Studio التي لا تستخدم المصادقة، احذف المفتاح؛ يخزّن OpenClaw علامة محلية غير سرية.

يبقى `--custom-api-key` مدعومًا للتوافق، لكن يُفضّل استخدام `--lmstudio-api-key` مع LM Studio.

يكتب هذا `models.providers.lmstudio` ويعيّن النموذج الافتراضي إلى
`lmstudio/<custom-model-id>`. عند تقديم مفتاح API، يكتب الإعداد أيضًا
ملف تعريف المصادقة `lmstudio:default`.

يمكن للإعداد التفاعلي أن يطلب طول سياق تحميل مفضلًا اختياريًا ويطبّقه على نماذج LM Studio المكتشفة التي يحفظها في الإعدادات.
يثق إعداد Plugin الخاص بـ LM Studio بنقطة نهاية LM Studio المضبوطة لطلبات النماذج، بما في ذلك local loopback ومضيفو LAN وtailnet. ما زالت مصادر metadata/link-local تتطلب موافقة صريحة. يمكنك إلغاء الاشتراك بتعيين `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## الإعدادات

### توافق استخدام البث

LM Studio متوافق مع استخدام البث. عندما لا يصدر كائن
`usage` على هيئة OpenAI، يستعيد OpenClaw أعداد الرموز من بيانات التعريف بنمط llama.cpp
`timings.prompt_n` / `timings.predicted_n` بدلًا من ذلك.

ينطبق سلوك استخدام البث نفسه على الخلفيات المحلية المتوافقة مع OpenAI التالية:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### توافق التفكير

عندما يبلّغ اكتشاف `/api/v1/models` في LM Studio عن خيارات استدلال خاصة بالنموذج،
يعرض OpenClaw قيم `reasoning_effort` المتوافقة مع OpenAI المطابقة
في بيانات توافق النموذج الوصفية. يمكن لإصدارات LM Studio الحالية أن تعلن عن خيارات UI ثنائية
مثل `allowed_options: ["off", "on"]` مع رفض تلك القيم
على `/v1/chat/completions`؛ يطبّع OpenClaw شكل الاكتشاف الثنائي هذا إلى
`none` و`minimal` و`low` و`medium` و`high` و`xhigh` قبل إرسال الطلبات.
تُطبّع إعدادات LM Studio المحفوظة القديمة التي تحتوي على خرائط استدلال `off`/`on`
بالطريقة نفسها عند تحميل الكتالوج.

### إعدادات صريحة

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

تأكد من أن LM Studio يعمل. إذا كانت المصادقة مفعّلة، فعيّن أيضًا `LM_API_TOKEN`:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

تحقق من إمكانية الوصول إلى API:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

إذا أبلغ الإعداد عن HTTP 401، فتحقق من مفتاح API:

- تحقق من أن `LM_API_TOKEN` يطابق المفتاح المضبوط في LM Studio.
- لتفاصيل إعداد مصادقة LM Studio، راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان خادمك لا يتطلب مصادقة، فاترك المفتاح فارغًا أثناء الإعداد.

### تحميل النموذج عند الحاجة

يدعم LM Studio تحميل النماذج عند الحاجة (JIT)، حيث تُحمّل النماذج عند أول طلب. يحمّل OpenClaw النماذج مسبقًا عبر نقطة نهاية التحميل الأصلية في LM Studio افتراضيًا، مما يساعد عندما يكون JIT معطّلًا. للسماح لسلوكيات JIT وTTL الخامل والإخلاء التلقائي في LM Studio بامتلاك دورة حياة النموذج، عطّل خطوة التحميل المسبق في OpenClaw:

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

استخدم العنوان القابل للوصول لمضيف LM Studio، واحتفظ بـ `/v1`، وتأكد من أن LM Studio مرتبط بما يتجاوز loopback على ذلك الجهاز:

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

يثق `lmstudio` تلقائيًا بنقطة النهاية المحلية/الخاصة المضبوطة لطلبات النماذج المحمية. تثق إدخالات المزوّد المخصص/المحلي المتوافقة مع OpenAI أيضًا بمصدر `baseUrl` المضبوط بدقة، باستثناء مصادر metadata/link-local؛ ما زالت الطلبات إلى منافذ أو وجهات خاصة مختلفة تتطلب `models.providers.<id>.request.allowPrivateNetwork: true`. عيّن `models.providers.<id>.request.allowPrivateNetwork: false` لإلغاء الثقة بالمصدر المطابق.

## ذات صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

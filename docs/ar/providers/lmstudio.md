---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتهيئته
summary: شغّل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T15:00:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

يشغّل LM Studio نماذج llama.cpp (GGUF) أو MLX محليًا، إما كتطبيق بواجهة رسومية أو كخدمة `llmster`
بلا واجهة. للاطلاع على وثائق التثبيت والمنتج، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

<Steps>
  <Step title="تثبيت الخادم وتشغيله">
    ثبّت LM Studio (للحاسوب المكتبي) أو `llmster` (بلا واجهة)، ثم شغّل الخادم:

    ```bash
    lms server start --port 1234
    ```

    أو شغّل الخدمة بلا واجهة:

    ```bash
    lms daemon up
    ```

    إذا كنت تستخدم تطبيق الحاسوب المكتبي، ففعّل JIT لتحميل النماذج بسلاسة؛ راجع
    [دليل JIT وTTL في LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="تعيين مفتاح API إذا كانت المصادقة مفعّلة">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    إذا كانت مصادقة LM Studio معطّلة، فاترك مفتاح API فارغًا أثناء الإعداد. راجع
    [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard
    ```

    اختر `LM Studio`، ثم حدّد نموذجًا عند مطالبة `Default model`.

    في إعداد إرشادي جديد، يستعلم OpenClaw أولًا من `/api/v1/models` على مضيف
    LM Studio الافتراضي أو المضبوط. يُعرض نموذج LLM موجود عبر مسار الإعداد نفسه في
    CLI/macOS، ويُتحقق منه بإكمال حقيقي قبل حفظ إعداداته. لا ينزّل الفحص التلقائي
    أي نموذج مطلقًا، ويتجاهل إدخالات الفهرس المخصصة للتضمينات فقط.

  </Step>
</Steps>

غيّر النموذج الافتراضي لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تستخدم مفاتيح نماذج LM Studio تنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`)؛ وتضيف مراجع نماذج OpenClaw
المزوّد في البداية: `lmstudio/qwen/qwen3.5-9b`. اعثر على المفتاح الدقيق لنموذج بتشغيل
الأمر أدناه والبحث في حقل `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## الإعداد الأولي غير التفاعلي

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

أو حدّد عنوان URL الأساسي والنموذج ومفتاح API صراحةً:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

يأخذ `--custom-model-id` مفتاح النموذج كما يعيده LM Studio (مثل `qwen/qwen3.5-9b`)، من دون
بادئة المزوّد `lmstudio/`. مرّر `--lmstudio-api-key` (أو عيّن `LM_API_TOKEN`) للخوادم
التي تستخدم المصادقة؛ واحذفه للخوادم التي لا تستخدم المصادقة، وسيخزّن OpenClaw بدلًا منه علامة محلية غير سرية.
لا يزال `--custom-api-key` مقبولًا للتوافق، لكن يُفضّل `--lmstudio-api-key`.

يكتب هذا `models.providers.lmstudio` ويعيّن النموذج الافتراضي إلى `lmstudio/<custom-model-id>`.
كما تؤدي إضافة مفتاح API إلى كتابة ملف تعريف المصادقة `lmstudio:default`.

يمكن للإعداد التفاعلي أيضًا المطالبة بطول سياق تحميل مفضّل وتطبيقه على جميع
النماذج المكتشفة التي يحفظها في الإعدادات.

## الإعداد

### توافق استخدام البث

لا يصدر LM Studio دائمًا كائن `usage` بتنسيق OpenAI ضمن الاستجابات المتدفقة. يستعيد OpenClaw
أعداد الرموز بدلًا من ذلك من بيانات `timings.prompt_n` / `timings.predicted_n` الوصفية
بتنسيق llama.cpp. وتحصل أي نقطة نهاية متوافقة مع OpenAI يجري تحديدها كنقطة نهاية محلية (مضيف استرجاع حلقي) على
آلية الرجوع نفسها، مما يشمل الواجهات الخلفية المحلية الأخرى مثل vLLM وSGLang وllama.cpp وLocalAI وJan وTabbyAPI
وtext-generation-webui.

### توافق التفكير

عندما يعرض اكتشاف `/api/v1/models` في LM Studio خيارات استدلال خاصة بالنموذج، يوفّر OpenClaw
قيم `reasoning_effort` المطابقة (`none` و`minimal` و`low` و`medium` و`high` و`xhigh`) في
بيانات توافق النموذج الوصفية. تعلن بعض إصدارات LM Studio عن خيار ثنائي في واجهة المستخدم (`allowed_options: ["off",
"on"]`) مع رفض هذه القيم الحرفية في `/v1/chat/completions`؛ ويحوّل OpenClaw
هذا الشكل الثنائي إلى مقياس المستويات الستة قبل إرسال الطلبات، بما في ذلك الإعدادات القديمة المحفوظة التي
ما زالت تحتوي على خرائط الاستدلال `off`/`on`.

### الإعداد الصريح

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

### تعطيل التحميل المسبق

يدعم LM Studio تحميل النماذج في الوقت المناسب (JIT)، أي تحميلها عند أول طلب. يحمّل OpenClaw
النماذج مسبقًا عبر نقطة نهاية التحميل الأصلية في LM Studio افتراضيًا، مما يفيد عندما يكون JIT
معطّلًا. ولترك إدارة دورة حياة النموذج إلى JIT وفترة الخمول TTL وسلوك الإخلاء التلقائي في LM Studio،
عطّل خطوة التحميل المسبق في OpenClaw:

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

### مضيف LAN أو tailnet

استخدم عنوان مضيف LM Studio الذي يمكن الوصول إليه، واحتفظ بـ `/v1`، وتأكد من أن LM Studio يستمع إلى ما وراء
واجهة الاسترجاع الحلقي على ذلك الجهاز:

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

يثق `lmstudio` تلقائيًا بنقطة النهاية المضبوطة لطلبات النماذج، بما في ذلك مضيفو الاسترجاع الحلقي
وLAN وtailnet (باستثناء مصادر البيانات الوصفية/الارتباط المحلي). ويحصل أي إدخال مخصّص/محلي لمزوّد متوافق مع OpenAI
على الثقة نفسها المطابقة للمصدر تمامًا. ولا تزال الطلبات إلى مضيف أو منفذ خاص مختلف
تتطلب `models.providers.<id>.request.allowPrivateNetwork: true`؛ عيّنه إلى `false` لإلغاء
الثقة الافتراضية.

## استكشاف الأخطاء وإصلاحها

### لم يُكتشف LM Studio

تأكد من أن LM Studio قيد التشغيل:

```bash
lms server start --port 1234
```

إذا كانت المصادقة مفعّلة، فعيّن أيضًا `LM_API_TOKEN`. تحقّق من إمكانية الوصول إلى API:

```bash
curl http://localhost:1234/api/v1/models
```

### أخطاء المصادقة (HTTP 401)

- تحقّق من أن `LM_API_TOKEN` يطابق المفتاح المضبوط في LM Studio.
- راجع [مصادقة LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- إذا كان الخادم لا يتطلب المصادقة، فاترك المفتاح فارغًا أثناء الإعداد.

## ذو صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

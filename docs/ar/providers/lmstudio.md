---
read_when:
    - تريد تشغيل OpenClaw باستخدام نماذج مفتوحة المصدر عبر LM Studio
    - تريد إعداد LM Studio وتهيئته
summary: شغّل OpenClaw باستخدام LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T06:28:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

يشغّل LM Studio نماذج llama.cpp ‏(GGUF) أو MLX محليًا، إما كتطبيق بواجهة رسومية أو كخدمة `llmster`
من دون واجهة. للحصول على وثائق التثبيت والمنتج، راجع [lmstudio.ai](https://lmstudio.ai/).

## البدء السريع

<Steps>
  <Step title="تثبيت الخادم وتشغيله">
    ثبّت LM Studio (للسطح المكتب) أو `llmster` (من دون واجهة)، ثم شغّل الخادم:

    ```bash
    lms server start --port 1234
    ```

    أو شغّل الخدمة من دون واجهة:

    ```bash
    lms daemon up
    ```

    إذا كنت تستخدم تطبيق سطح المكتب، ففعّل JIT لتحميل النماذج بسلاسة؛ راجع
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

    اختر `LM Studio`، ثم اختر نموذجًا عند مطالبة `Default model`.

  </Step>
</Steps>

غيّر النموذج الافتراضي لاحقًا:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

تستخدم مفاتيح نماذج LM Studio التنسيق `author/model-name` (مثل `qwen/qwen3.5-9b`)؛ وتضيف مراجع نماذج OpenClaw
اسم المزوّد في البداية: `lmstudio/qwen/qwen3.5-9b`. ابحث عن المفتاح الدقيق لنموذج بتشغيل
الأمر أدناه والنظر إلى الحقل `key`:

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
بادئة المزوّد `lmstudio/`. مرّر `--lmstudio-api-key` (أو عيّن `LM_API_TOKEN`) للخوادم التي تتطلب المصادقة؛ واحذفه للخوادم التي لا تتطلب المصادقة، وسيخزّن OpenClaw بدلًا منه علامة محلية غير سرية.
يظل `--custom-api-key` مقبولًا للتوافق، لكن يُفضّل `--lmstudio-api-key`.

يكتب هذا الإعداد `models.providers.lmstudio` ويعيّن النموذج الافتراضي إلى `lmstudio/<custom-model-id>`.
كما تؤدي إضافة مفتاح API إلى كتابة ملف تعريف المصادقة `lmstudio:default`.

يمكن للإعداد التفاعلي أيضًا أن يطالب بطول سياق تحميل مفضّل ويطبّقه على جميع
النماذج المكتشفة التي يحفظها في الإعدادات.

## الإعداد

### توافق استخدام التدفق

لا يصدر LM Studio دائمًا كائن `usage` بالصيغة المتوافقة مع OpenAI في الاستجابات المتدفقة. يستعيد OpenClaw
أعداد الرموز المميّزة من بيانات `timings.prompt_n` / `timings.predicted_n` الوصفية بأسلوب llama.cpp
بدلًا من ذلك. تحصل أي نقطة نهاية متوافقة مع OpenAI ويُحدّد أنها نقطة نهاية محلية (مضيف local loopback) على آلية
الرجوع الاحتياطي نفسها، ما يشمل أنظمة محلية أخرى مثل vLLM وSGLang وllama.cpp وLocalAI وJan وTabbyAPI
وtext-generation-webui.

### توافق الاستدلال

عندما يبلّغ اكتشاف `/api/v1/models` في LM Studio عن خيارات استدلال خاصة بالنموذج، يعرض OpenClaw
قيم `reasoning_effort` المطابقة (`none` و`minimal` و`low` و`medium` و`high` و`xhigh`) في
بيانات توافق النموذج الوصفية. تعلن بعض إصدارات LM Studio عن خيار ثنائي في الواجهة (`allowed_options: ["off",
"on"]`) بينما ترفض هذه القيم الحرفية في `/v1/chat/completions`؛ ويحوّل OpenClaw
هذه الصيغة الثنائية إلى المقياس ذي المستويات الستة قبل إرسال الطلبات، بما في ذلك الإعدادات المحفوظة القديمة التي
لا تزال تحتوي على خرائط استدلال `off`/`on`.

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

يدعم LM Studio تحميل النماذج عند الحاجة (JIT)، بحيث يحمّل النماذج عند أول طلب. يحمّل OpenClaw
النماذج مسبقًا عبر نقطة نهاية التحميل الأصلية في LM Studio افتراضيًا، ما يفيد عندما يكون JIT
معطّلًا. للسماح لـJIT في LM Studio وTTL عند الخمول وسلوك الإخلاء التلقائي بإدارة دورة حياة النموذج بدلًا من ذلك،
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

### مضيف الشبكة المحلية أو شبكة tailnet

استخدم عنوان مضيف LM Studio الذي يمكن الوصول إليه، واحتفظ بـ`/v1`، وتأكد من أن LM Studio مرتبط
بعنوان يتجاوز local loopback على ذلك الجهاز:

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

يثق `lmstudio` تلقائيًا بنقطة النهاية المضبوطة لطلبات النماذج، بما في ذلك مضيفو local loopback
والشبكة المحلية وtailnet (باستثناء مصادر البيانات الوصفية/العناوين المحلية للرابط). يحصل أي
إدخال مخصّص/محلي لمزوّد متوافق مع OpenAI على الثقة نفسها للمصدر المطابق تمامًا. تظل الطلبات إلى مضيف
خاص أو منفذ مختلف تتطلب `models.providers.<id>.request.allowPrivateNetwork: true`؛ عيّنها إلى `false` لإلغاء
الثقة الافتراضية.

## استكشاف الأخطاء وإصلاحها

### لم يُكتشف LM Studio

تأكد من تشغيل LM Studio:

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

## مواضيع ذات صلة

- [اختيار النموذج](/ar/concepts/model-providers)
- [Ollama](/ar/providers/ollama)
- [النماذج المحلية](/ar/gateway/local-models)

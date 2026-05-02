---
read_when:
    - اختيار النماذج أو التبديل بينها، وتهيئة الأسماء المستعارة
    - تصحيح أخطاء التبديل عند فشل النموذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنموذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-02T07:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bf7a6bb4a0e2bf791c73dbb4005ba4628afc2c20e06417f8147f4c65583e884
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو كل ما تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    يُشار إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `openai-codex/gpt-5.5`). إذا حذفت المزوّد، يحاول OpenClaw أولاً استخدام اسم مستعار، ثم مطابقة مزوّد مُهيأ فريد لمعرّف النموذج الدقيق هذا، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُهيأ كمسار توافق قديم. إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المُهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مُهيأ بدلاً من إظهار افتراضي قديم لمزوّد مُزال. ومع ذلك، يجب عليك ضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي توصي به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **للوكلاء الممكّنين بالأدوات أو ذوي المدخلات غير الموثوقة:** أعطِ الأولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج تستطيع تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجاً أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزاً). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّمة بإفراط أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح إعدادي؟">
    استخدم **أوامر النموذج** أو حرّر حقول **النموذج** فقط. تجنّب استبدال الإعداد بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعداد النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - حرّر `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب استخدام `config.apply` مع كائن جزئي ما لم تكن تقصد استبدال الإعداد كله.
    لتعديلات RPC، افحص أولاً باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة lookup المسار المطبّع، ووثائق/قيود المخطط الضحلة، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كتبت فوق الإعداد، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التهيئة](/ar/cli/configure)، [الإعداد](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتياً (llama.cpp، vLLM، Ollama)؟">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجاً محلياً مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضاً، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية إضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمان: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن التعليمات.
    نوصي بقوة باستخدام **نماذج كبيرة** لأي روبوت يستطيع استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، فعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي تستخدمها OpenClaw وFlawd وKrill؟">
    - يمكن أن تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة بمزوّد معيّن.
    - تحقق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحساسين أمنياً/الممكّنين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء التشغيل (من دون إعادة التشغيل)؟">
    استخدم الأمر `/model` كرسالة مستقلة:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    هذه هي الأسماء المستعارة المدمجة. يمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك سرد النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (وكذلك `/model list`) منتقيًا مضغوطاً مرقماً. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضاً فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    تلميح: يعرض `/model status` الوكيل النشط، وأي ملف `auth-profiles.json` يُستخدم، وأي ملف تعريف مصادقة سيُجرّب تالياً.
    كما يعرض نقطة نهاية المزوّد المُهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد الرجوع إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5` و`agents.defaults.agentRuntime.id` على `"codex"`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة عبر PI:** استخدم `/model openai/gpt-5.5` من دون تجاوز وقت تشغيل Codex واضبط `OPENAI_API_KEY`.
    - **Codex OAuth عبر PI:** استخدم `/model openai-codex/gpt-5.5` فقط عندما تريد عمداً مشغّل PI العادي مع Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل مخصص لـ Codex فقط وله نموذجه وإعداد `agentRuntime` الافتراضي الخاص به.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديل جلسة أو إعداداً افتراضياً في الإعداد:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة `openai/gpt-5.5` أو `openai-codex/gpt-5.5`.
    - **كافتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` أو `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` على `true`.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى OpenAI، يُطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب تجاوزات `/fast` الخاصة بالجلسة على افتراضيات الإعداد.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا أتلقى رداً؟'>
    إذا كان `agents.defaults.models` مضبوطاً، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات جلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    يُعاد هذا الخطأ **بدلاً من** رد عادي. الإصلاح: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجاً من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    يعني هذا أن **المزوّد غير مُهيأ** (لم يُعثر على إعداد مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة تحقق للإصلاح:

    1. رقِّ إلى إصدار OpenClaw حالي (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تهيئة MiniMax (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth المخزن لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد
       مفتاح API، أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في الدردشة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    الاحتياطيات مخصصة لـ **الأخطاء**، لا "للمهام الصعبة"، لذلك استخدم `/model` أو وكيلاً منفصلاً.

    **الخيار A: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    ثم:

    ```
    /model gpt
    ```

    **الخيار B: وكلاء منفصلون**

    - الافتراضي للوكيل A: MiniMax
    - الافتراضي للوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يأتي OpenClaw مع بضعة اختصارات افتراضية (تُطبّق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` لإعدادات مفاتيح API، أو `openai-codex/gpt-5.5` عند التهيئة لاستخدام Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا ضبطت اسماً مستعاراً خاصاً بك بالاسم نفسه، فستكون قيمتك هي المعتمدة.

  </Accordion>

  <Accordion title="كيف أعرّف/أتجاوز اختصارات النماذج (الأسماء المستعارة)؟">
    تأتي الأسماء المستعارة من `agents.defaults.models.<modelId>.alias`. مثال:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    بعد ذلك، يُحل `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف النموذج ذلك.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزوّدين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع لكل رمز؛ نماذج كثيرة):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (نماذج GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    إذا أشرت إلى مزوّد/نموذج وكان مفتاح المزوّد المطلوب مفقودًا، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. تكون المصادقة لكل وكيل وتُخزّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة والقابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي دون استنساخ رموز التحديث.

    لا **تعد** استخدام `agentDir` عبر الوكلاء؛ فهو يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="How does failover work?">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** داخل المزوّد نفسه.
    2. **الرجوع الاحتياطي للنموذج** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبّق فترات تهدئة على الملفات الشخصية الفاشلة (تراجع أُسّي)، بحيث يستطيع OpenClaw الاستمرار في الاستجابة حتى عندما يكون المزوّد محدود المعدل أو يفشل مؤقتًا.

    يتضمن دلو حدود المعدل أكثر من استجابات `429` البسيطة. يعامل OpenClaw
    أيضًا رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نافذة الاستخدام الدورية (`weekly/monthly limit reached`) كحدود معدل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، كما أن بعض استجابات HTTP `402`
    تبقى أيضًا في ذلك الدلو العابر. إذا أعاد مزوّد نص فوترة صريحًا مع `401` أو `403`،
    فلا يزال بإمكان OpenClaw إبقاء ذلك في مسار الفوترة، لكن مطابِقات النص الخاصة
    بالمزوّد تظل محصورة في المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). إذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو
    حد إنفاق لمؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، يعاملها OpenClaw على أنها
    `rate_limit`، وليست تعطيل فوترة طويل الأمد.

    أخطاء فيض السياق مختلفة: توقيعات مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدلًا من التقدم في
    الرجوع الاحتياطي للنموذج.

    نصوص أخطاء الخادم العامة أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يعامل OpenClaw الأشكال العابرة المحصورة بالمزوّد
    مثل Anthropic العارية `An unknown error occurred`، وOpenRouter العارية
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تحتوي على نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات مهلة/حمل زائد تستحق تجاوز الفشل عندما يتطابق سياق المزوّد.
    نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` يبقى محافظًا ولا يفعّل الرجوع الاحتياطي للنموذج وحده.

  </Accordion>

  <Accordion title='What does "No credentials found for profile anthropic:default" mean?'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **تأكّد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يهاجره `openclaw doctor`)
    - **تأكّد من تحميل متغير البيئة لديك بواسطة Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكّد من أنك تعدّل الوكيل الصحيح**
      - إعدادات الوكلاء المتعددة تعني أنه قد توجد عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كان المزوّدون مصادقين.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة لديه.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملفًا شخصيًا مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكّد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="Why did it also try Google Gemini and fail?">
    إذا كان ضبط النموذج لديك يتضمن Google Gemini كرجوع احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع الاحتياطي للنموذج. إذا لم تكن قد ضبطت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما وفّر مصادقة Google، أو أزِل/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء البديلة حتى لا يوجّه الرجوع الاحتياطي إليها.

    **رُفض طلب LLM: مطلوب توقيع التفكير (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا توقيعات** (غالبًا من
    بث مُجهض/جزئي). يتطلب Google Antigravity توقيعات لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بمزوّد. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما هي معرّفات ملفات التعريف النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عند عدم وجود هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرّب أولًا؟">
    نعم. يدعم الإعداد بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). هذا **لا** يخزن الأسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويحدد ترتيب التدوير.

    قد يتجاوز OpenClaw مؤقتًا ملف تعريف إذا كان في فترة **تهدئة** قصيرة (حدود معدل/مهلات/إخفاقات مصادقة) أو في حالة **تعطيل** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات التهدئة بسبب حدود المعدل مقيّدة بنموذج. يمكن أن يظل ملف تعريف في فترة تهدئة
    لنموذج واحد صالحًا للاستخدام مع نموذج شقيق لدى المزوّد نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تمنع ملف التعريف بأكمله.

    يمكنك أيضًا ضبط تجاوز ترتيب **لكل وكيل** (مخزن في `auth-state.json` لذلك الوكيل) عبر CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    للتحقق مما سيُجرّب فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا حُذف ملف تعريف مخزن من الترتيب الصريح، فسيبلغ الفحص عن
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - غالبًا ما يستفيد **OAuth** من وصول الاشتراك (حيث ينطبق ذلك).
    - تستخدم **مفاتيح API** فوترة الدفع حسب الرمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

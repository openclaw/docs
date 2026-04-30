---
read_when:
    - اختيار النماذج أو تبديلها، وتكوين الأسماء المستعارة
    - استكشاف أخطاء التبديل الاحتياطي للنموذج وإصلاحها / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-04-30T08:04:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: eaa72bf66d3f1528f95762e2a2763bc2f6bfddbc1d4c24a9ec2df7f943ebc14b
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الافتراضيات، الاختيار، الأسماء المستعارة، التبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تعيّنه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `openai-codex/gpt-5.5`). إذا حذفت المزوّد، يحاول OpenClaw أولاً استخدام اسم مستعار، ثم مطابقة مزوّد مهيّأ فريدة لمعرّف النموذج نفسه، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المهيّأ كمسار توافق قديم. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيّأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيّأ بدلاً من إظهار افتراضي قديم لمزوّد تمت إزالته. مع ذلك، ينبغي لك تعيين `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي توصون به؟">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **للوكلاء المفعّلين بالأدوات أو الذين يتعاملون مع مُدخلات غير موثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للمحادثات الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج يمكنك تحمل تكلفته** للأعمال عالية المخاطر، ونموذجاً أرخص
    للمحادثات الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزاً). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّاة بإفراط أكثر عرضة لحقن الموجّهات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    سياق إضافي: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح إعدادي؟">
    استخدم **أوامر النموذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال الإعداد الكامل.

    خيارات آمنة:

    - `/model` في المحادثة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعداد النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي ما لم تكن تقصد استبدال الإعداد بأكمله.
    لتعديلات RPC، افحص أولاً باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار الموحّد، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كتبت فوق الإعداد، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التكوين](/ar/cli/configure)، [الإعداد](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

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

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - لا تحتاج النماذج السحابية مثل `kimi-k2.5:cloud` إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّاة بشدة أكثر عرضة لحقن الموجّهات.
    نوصي بقوة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت ما زلت تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف عمليات النشر هذه وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقّق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحسّاسين أمنياً/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج فوراً (دون إعادة التشغيل)؟">
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

    يعرض `/model` (و`/model list`) منتقيًا مرقماً ومختصراً. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضاً فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` أي وكيل نشط، وأي ملف `auth-profiles.json` يُستخدم، وأي ملف تعريف مصادقة ستتم تجربته تالياً.
    كما يعرض نقطة نهاية المزوّد المهيّأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف عيّنته باستخدام @profile؟**

    أعد تشغيل `/model` **دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت العودة إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. عيّن أحدهما كافتراضي وبدّل عند الحاجة:

    - **تبديل سريع (لكل جلسة):** `/model openai/gpt-5.5` لمهام مفتاح OpenAI API المباشرة الحالية أو `/model openai-codex/gpt-5.5` لمهام GPT-5.5 Codex OAuth.
    - **الافتراضي:** عيّن `agents.defaults.model.primary` إلى `openai/gpt-5.5` لاستخدام مفتاح API أو `openai-codex/gpt-5.5` لاستخدام GPT-5.5 Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين بنموذج افتراضي مختلف.

    راجع [النماذج](/ar/concepts/models) و[أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيّئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديل جلسة أو افتراضياً في الإعداد:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة لـ `openai/gpt-5.5` أو `openai-codex/gpt-5.5`.
    - **افتراضي لكل نموذج:** عيّن `agents.defaults.models["openai/gpt-5.5"].params.fastMode` أو `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` إلى `true`.

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

    بالنسبة إلى OpenAI، يُطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب تجاوزات `/fast` للجلسة على افتراضيات الإعداد.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصلني رد؟'>
    إذا كان `agents.defaults.models` معيّناً، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يُرجع:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    يُعاد هذا الخطأ **بدلاً من** رد عادي. الإصلاح: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجاً من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    يعني هذا أن **المزوّد غير مهيّأ** (لم يتم العثور على إعداد مزوّد MiniMax أو ملف تعريف مصادقة)، لذلك لا يمكن حلّ النموذج.

    قائمة تحقق للإصلاح:

    1. حدّث إلى إصدار OpenClaw حالي (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تهيئة MiniMax (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في البيئة/ملفات تعريف المصادقة حتى يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth مخزّن لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M2.7` أو `minimax/MiniMax-M2.7-highspeed` لإعداد مفتاح API،
       أو `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` لإعداد OAuth.
    4. شغّل:

       ```bash
       openclaw models list
       ```

       واختر من القائمة (أو `/model list` في المحادثة).

    راجع [MiniMax](/ar/providers/minimax) و[النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="هل يمكنني استخدام MiniMax كافتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كافتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    البدائل مخصصة **للأخطاء**، وليس "للمهام الصعبة"، لذا استخدم `/model` أو وكيلاً منفصلاً.

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

    - افتراضي الوكيل A: MiniMax
    - افتراضي الوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يوفّر OpenClaw بعض الاختصارات الافتراضية (تُطبّق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` لإعدادات مفتاح API، أو `openai-codex/gpt-5.5` عند التهيئة لـ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عيّنت اسمك المستعار بالاسم نفسه، فقيمتك هي التي تسود.

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

    ثم يُحل `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

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

    إذا أشرت إلى مزوّد/نموذج ولكن مفتاح المزوّد المطلوب مفقود، فستحصل على خطأ مصادقة في وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يمكن لـ OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي بدون استنساخ رموز التحديث.

    لا **تُعِد** استخدام `agentDir` عبر الوكلاء؛ فهذا يسبب تضاربًا في المصادقة/الجلسة.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** ضمن المزوّد نفسه.
    2. **الرجوع الاحتياطي للنموذج** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تنطبق فترات التهدئة على ملفات التعريف الفاشلة (تراجع أُسّي)، بحيث يمكن لـ OpenClaw الاستمرار في الاستجابة حتى عندما يكون المزوّد محدود المعدل أو يفشل مؤقتًا.

    تشمل حاوية حدود المعدل أكثر من استجابات `429` الصريحة. يعامل OpenClaw
    أيضًا رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نافذة الاستخدام الدورية (`weekly/monthly limit reached`) كحدود معدل تستحق
    تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، كما أن بعض استجابات HTTP `402`
    تبقى أيضًا في تلك الحاوية العابرة. إذا أعاد مزوّد نصًا صريحًا متعلقًا بالفوترة عند `401` أو `403`، فلا يزال بإمكان OpenClaw إبقاء ذلك في مسار الفوترة، لكن مطابقات النص الخاصة بالمزوّد تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). إذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو حد إنفاق لمؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)، فإن OpenClaw يعاملها كـ
    `rate_limit`، لا كتعطيل فوترة طويل.

    أخطاء تجاوز السياق مختلفة: تبقى بصمات مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من التقدم إلى
    الرجوع الاحتياطي للنموذج.

    نصوص أخطاء الخادم العامة أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يعامل OpenClaw بالفعل الأشكال العابرة المحصورة بالمزوّد
    مثل Anthropic العارية `An unknown error occurred`، وOpenRouter العارية
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تتضمن نص خادم عابرًا
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` كإشارات
    مهلة/تحميل زائد تستحق تجاوز الفشل عندما يطابق سياق المزوّد.
    يبقى نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` محافظًا ولا يفعّل الرجوع الاحتياطي للنموذج بذاته.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يستطع العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **أكّد مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`)
    - **أكّد أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا عيّنت `ANTHROPIC_API_KEY` في صدفتك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددة إمكانية وجود عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كانت المزوّدات مُصادَقًا عليها.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يمكنه العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **أكّد أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز Gateway، لا على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا Google Gemini وفشل؟">
    إذا كان ضبط النموذج لديك يتضمن Google Gemini كرجوع احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع الاحتياطي للنموذج. إذا لم تكن قد ضبطت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما أن توفّر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع الاحتياطي إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بدون توقيعات** (غالبًا من
    تدفق مُجهَض/جزئي). يتطلب Google Antigravity توقيعات لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزوّد. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم الضبط بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). لا يخزّن هذا **أي** أسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويعيّن ترتيب التدوير.

    قد يتجاوز OpenClaw ملف تعريف مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهلات/فشل مصادقة) أو في حالة **معطّل** أطول (فوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل محددة بالنموذج. قد يظل ملف تعريف في فترة تهدئة
    لنموذج واحد قابلًا للاستخدام لنموذج شقيق على المزوّد نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف كاملًا.

    يمكنك أيضًا تعيين تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

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

    للتحقق مما سيُجرَّب فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا أُغفل ملف تعريف مخزّن من الترتيب الصريح، فسيبلغ الفحص عن
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - غالبًا ما يستفيد **OAuth** من وصول الاشتراك (حيثما ينطبق ذلك).
    - تستخدم **مفاتيح API** فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [FAQ](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [FAQ — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء الانتقال الاحتياطي بين النماذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-05T01:48:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e60abcd6aa99121200de0e45cc3efa6334e668cbe6a4b590610c53d17e03a54
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: القيم الافتراضية، الاختيار، الأسماء المستعارة، التبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    نموذج OpenClaw الافتراضي هو أي نموذج تعيّنه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    يُشار إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `openai-codex/gpt-5.5`). إذا حذفت المزوّد، يحاول OpenClaw أولاً استخدام اسم مستعار، ثم مطابقة مزوّد مهيّأ وفريد لمعرّف النموذج الدقيق، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المهيّأ كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيّأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيّأ بدلاً من إظهار قيمة افتراضية قديمة لمزوّد تمت إزالته. مع ذلك، ينبغي أن تعيّن `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي تنصح به؟">
    **القيمة الافتراضية الموصى بها:** استخدم أقوى نموذج من الجيل الأحدث متاح في مجموعة المزوّدين لديك.
    **للوكلاء الذين يستخدمون الأدوات أو يتعاملون مع مدخلات غير موثوقة:** أعطِ الأولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقه الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج تستطيع تحمّل تكلفته** للعمل عالي المخاطر، ونموذجاً أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزاً). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير شديد: النماذج الأضعف أو المكمّمة بإفراط أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح تهيئتي؟">
    استخدم **أوامر النموذج** أو حرّر حقول **النموذج** فقط. تجنّب استبدال التهيئة بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث تهيئة النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - حرّر `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تنوي استبدال التهيئة بالكامل.
    لتعديلات RPC، افحص أولاً باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار المطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كتبت فوق التهيئة، فاستعدها من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التهيئة](/ar/cli/configure)، [الإعدادات](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتياً (llama.cpp، vLLM، Ollama)؟">
    نعم. Ollama هو المسار الأسهل للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجاً محلياً مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضاً، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّمة بكثافة أكثر عرضة لحقن التعليمات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وصارم قوائم السماح للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - يمكن أن تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد معيّن.
    - افحص إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحسّاسين أمنياً/الممكّنين بالأدوات، استخدم أقوى نموذج من الجيل الأحدث متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج فورياً (دون إعادة التشغيل)؟">
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

    هذه هي الأسماء المستعارة المضمّنة. يمكن إضافة أسماء مستعارة مخصّصة عبر `agents.defaults.models`.

    يمكنك سرد النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقياً مدمجاً مرقماً. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضاً فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي سيُجرّب تالياً.
    كما يعرض نقطة نهاية المزوّد المهيّأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف عيّنته باستخدام @profile؟**

    أعد تشغيل `/model` **دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت العودة إلى القيمة الافتراضية، فاخترها من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5` و`agents.defaults.agentRuntime.id` على `"codex"`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة عبر PI:** استخدم `/model openai/gpt-5.5` دون تجاوز وقت تشغيل Codex وهيّئ `OPENAI_API_KEY`.
    - **Codex OAuth عبر PI:** استخدم `/model openai-codex/gpt-5.5` فقط عندما تريد عمداً مشغّل PI العادي مع Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل مخصّص لـ Codex فقط بنموذجه وقيمة `agentRuntime` الافتراضية الخاصة به.

    راجع [النماذج](/ar/concepts/models) و[أوامر Slash](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيّئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديل جلسة أو قيمة تهيئة افتراضية:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.5` أو `openai-codex/gpt-5.5`.
    - **القيمة الافتراضية لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` أو `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` على `true`.

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

    بالنسبة إلى OpenAI، يرتبط الوضع السريع بـ `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتجاوز إعدادات `/fast` للجلسة القيم الافتراضية في التهيئة.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصل رد؟'>
    إذا كان `agents.defaults.models` معيّناً، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد ذلك الخطأ **بدلاً من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجاً من `/model list`.
    إذا كان الأمر يتضمن أيضاً `--runtime codex`، فأضف النموذج أولاً ثم أعد محاولة
    أمر `/model provider/model --runtime codex` نفسه.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    يعني هذا أن **المزوّد غير مهيّأ** (لم يُعثر على تهيئة مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة التحقق للإصلاح:

    1. رقّ إلى إصدار OpenClaw حالي (أو شغّله من مصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تهيئة MiniMax (المعالج أو JSON)، أو من وجود مصادقة MiniMax
       في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزّن من MiniMax
       لـ `minimax-portal`).
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
    الاحتياطيات مخصّصة **للأخطاء**، لا "للمهام الصعبة"، لذا استخدم `/model` أو وكيلاً منفصلاً.

    **الخيار أ: التبديل لكل جلسة**

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

    **الخيار ب: وكلاء منفصلون**

    - الافتراضي للوكيل A: MiniMax
    - الافتراضي للوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يوفّر OpenClaw بضعة اختصارات افتراضية (تُطبّق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` لإعدادات مفتاح API، أو `openai-codex/gpt-5.5` عند التهيئة لـ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عيّنت اسمك المستعار الخاص بالاسم نفسه، فستكون قيمتك هي المعتمدة.

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

    ثم يتحول `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

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

    إذا أشرت إلى موفّر/نموذج لكن مفتاح الموفّر المطلوب مفقود، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للموفّر بعد إضافة وكيل جديد**

    يعني هذا عادة أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل على حدة
    ومخزّنة في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يستطيع OpenClaw القراءة بالمرور إلى الوكيل الافتراضي/الرئيسي دون استنساخ رموز التحديث.

    لا **تعد** استخدام `agentDir` بين الوكلاء؛ فهذا يسبب تضاربات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** داخل الموفّر نفسه.
    2. **الرجوع إلى نموذج احتياطي** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على الملفات الشخصية الفاشلة (تراجع أُسّي)، لذلك يستطيع OpenClaw مواصلة الاستجابة حتى عندما يكون الموفّر محدود المعدل أو يتعطل مؤقتًا.

    يتضمن وعاء حدود المعدل أكثر من استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) كحدود معدل
    تستدعي تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا في ذلك الوعاء العابر. إذا أعاد موفّر نصًا صريحًا متعلقًا بالفوترة
    على `401` أو `403`، فيستطيع OpenClaw إبقاء ذلك في مسار الفوترة، لكن مطابقات
    النص الخاصة بالموفّر تبقى محصورة في الموفّر الذي يملكها (مثل OpenRouter
    `Key limit exceeded`). وإذا بدت رسالة `402` بدلًا من ذلك كنافذة استخدام قابلة
    لإعادة المحاولة أو حد إنفاق للمؤسسة/مساحة العمل (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`)، يتعامل OpenClaw معها على أنها
    `rate_limit`، وليست تعطيل فوترة طويلًا.

    أخطاء تجاوز السياق مختلفة: تبقى تواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    رجوع النموذج الاحتياطي.

    نص أخطاء الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يتعامل OpenClaw مع الأشكال العابرة المحصورة بالموفّر
    مثل Anthropic العارية `An unknown error occurred`، وOpenRouter العارية
    `Provider returned error`، وأخطاء سبب التوقف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` التي تحتوي على نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال الموفّر مثل `ModelNotReadyException` على أنها
    إشارات مهلة/تحميل زائد تستدعي تجاوز الفشل عندما يتطابق سياق الموفّر.
    يبقى نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` محافظًا ولا يفعّل رجوع النموذج الاحتياطي بحد ذاته.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يستطع العثور على بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **أكّد مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يرحّله `openclaw doctor`)
    - **أكّد أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا ضبطت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - إعدادات الوكلاء المتعددة تعني أنه قد توجد ملفات `auth-profiles.json` متعددة.
    - **افحص حالة النموذج/المصادقة سريعًا**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كانت الموفّرات مصادَقًا عليها.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **أكّد أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان ضبط النموذج لديك يتضمن Google Gemini كاحتياطي (أو بدّلت إلى اختصار Gemini)، فسيجرّبه OpenClaw أثناء رجوع النموذج الاحتياطي. إذا لم تضبط بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما توفير مصادقة Google، أو إزالة/تجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الاحتياطي إليها.

    **تم رفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا تواقيع** (غالبًا من
    دفق مُجهَض/جزئي). يتطلب Google Antigravity تواقيع لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل اعتماد مُسمّى (OAuth أو مفتاح API) مرتبط بمزوّد. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص ملفات التعريف المحفوظة دون عرض الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [CLI النماذج](/ar/cli/models#openclaw-models-auth-list) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف النموذجية؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عند عدم وجود هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم الإعداد بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). لا يخزّن هذا **أي** أسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويحدد ترتيب التدوير.

    قد يتجاوز OpenClaw ملف تعريف مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود المعدل/انتهاءات المهلة/إخفاقات المصادقة) أو في حالة **معطّل** أطول (الفوترة/أرصدة غير كافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل مقيّدة بنموذج. يمكن أن يظل ملف تعريف في فترة تهدئة
    لنموذج واحد صالحًا للاستخدام مع نموذج شقيق لدى المزوّد نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف بالكامل.

    يمكنك أيضًا ضبط تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` لذلك الوكيل) عبر CLI:

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

    إذا حُذف ملف تعريف مخزّن من الترتيب الصريح، فسيبلّغ الفحص
    عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - غالبًا ما تستفيد **OAuth** من وصول الاشتراك (حيثما ينطبق).
    - تستخدم **مفاتيح API** فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

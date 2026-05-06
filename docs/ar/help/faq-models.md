---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء التحويل الاحتياطي بين النماذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-05-06T07:57:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8f6d367cf22b9035f75ffcfa641008a015d78b727c4b3d67730fd5286520fb4
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة عن النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما "النموذج الافتراضي"؟'>
    نموذج OpenClaw الافتراضي هو ما تضبطه بوصفه:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `openai-codex/gpt-5.5`). إذا حذفت المزوّد، يحاول OpenClaw أولاً استخدام اسم مستعار، ثم مطابقة مزوّد مهيأ فريد لمعرّف النموذج نفسه بالضبط، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المهيأ كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المهيأ، يعود OpenClaw إلى أول مزوّد/نموذج مهيأ بدلاً من إظهار إعداد افتراضي قديم لمزوّد أزيل. ومع ذلك، ينبغي لك ضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي تنصح به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة مزوّديك.
    **للوكلاء المفعّلين بالأدوات أو ذوي المدخلات غير الموثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقها الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجاً أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (يستهلك كل وكيل فرعي رموزاً). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيين](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّمة بإفراط أكثر عرضة لحقن التعليمات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    مزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح تكويني؟">
    استخدم **أوامر النماذج** أو عدّل حقول **النموذج** فقط. تجنّب استبدال التكوين بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث تكوين النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تنوي استبدال التكوين كله.
    بالنسبة إلى تعديلات RPC، افحص أولاً باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار المطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا كنت قد كتبت فوق التكوين، فاستعده من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [التكوين](/ar/cli/configure)، [التكوين](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتياً (llama.cpp وvLLM وOllama)؟">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجاً محلياً مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضاً، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية إضافةً إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّمة بشدة أكثر عرضة لحقن التعليمات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي روبوت يستطيع استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقق من إعداد وقت التشغيل الحالي على كل gateway باستخدام `openclaw models status`.
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

    يعرض `/model` (و`/model list`) منتقيًا مضغوطاً ومرقماً. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضاً فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` أي وكيل نشط، وأي ملف `auth-profiles.json` قيد الاستخدام، وأي ملف تعريف مصادقة سيُجرّب بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت الرجوع إلى الإعداد الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل على نحو منفصل:

    - **وكيل البرمجة الأصلي Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5` و`agents.defaults.agentRuntime.id` على `"codex"`. سجّل الدخول باستخدام `openclaw models auth login --provider openai-codex` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة عبر PI:** استخدم `/model openai/gpt-5.5` دون تجاوز وقت تشغيل Codex وهيّئ `OPENAI_API_KEY`.
    - **Codex OAuth عبر PI:** استخدم `/model openai-codex/gpt-5.5` فقط عندما تريد عمداً مشغّل PI العادي مع Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل خاص بـ Codex له نموذجه الخاص وإعداد `agentRuntime` الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أهيئ الوضع السريع لـ GPT 5.5؟">
    استخدم إما مفتاح تبديل للجلسة أو إعداداً افتراضياً في التكوين:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.5` أو `openai-codex/gpt-5.5`.
    - **كإعداد افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` أو `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` على `true`.

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

    بالنسبة إلى OpenAI، يُطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتفوق تجاوزات `/fast` الخاصة بالجلسة على إعدادات التكوين الافتراضية.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا يصلني رد؟'>
    إذا كان `agents.defaults.models` مضبوطاً، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات جلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد ذلك الخطأ **بدلاً من** رد عادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجاً من `/model list`.
    إذا تضمّن الأمر أيضاً `--runtime codex`، فأضف النموذج أولاً ثم أعد محاولة
    أمر `/model provider/model --runtime codex` نفسه.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **المزوّد غير مهيأ** (لم يُعثر على تكوين مزوّد MiniMax أو ملف تعريف
    مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة تحقق للإصلاح:

    1. رقِّ إلى إصدار OpenClaw حالي (أو شغّل من مصدر `main`)، ثم أعد تشغيل gateway.
    2. تأكد من تهيئة MiniMax (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في ملفات تعريف env/auth بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth مخزّن لـ `minimax-portal`).
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
    البدائل مخصصة لـ **الأخطاء**، لا "المهام الصعبة"، لذا استخدم `/model` أو وكيلاً منفصلاً.

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

    - الإعداد الافتراضي للوكيل A: MiniMax
    - الإعداد الافتراضي للوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    الوثائق: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مدمجة؟">
    نعم. يوفّر OpenClaw بضعة اختصارات افتراضية (تُطبّق فقط عندما يكون النموذج موجوداً في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` لإعدادات مفتاح API، أو `openai-codex/gpt-5.5` عند التهيئة لـ Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا عيّنت اسماً مستعاراً خاصاً بك بالاسم نفسه، فستسود قيمتك.

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

    عندئذٍ يُحل `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

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

    إذا أشرت إلى موفّر/نموذج وكان مفتاح الموفّر المطلوب مفقودًا، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يُعثر على مفتاح API للموفّر بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات التعريف الثابتة القابلة للنقل `api_key` / `token` من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يمكن لـ OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي دون نسخ رموز التحديث.

    لا تُعد استخدام `agentDir` عبر الوكلاء؛ فهذا يسبب تصادمات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت كل النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملفات تعريف المصادقة** ضمن الموفّر نفسه.
    2. **الرجوع الاحتياطي للنموذج** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف الفاشلة (تراجع أسي)، بحيث يمكن لـ OpenClaw مواصلة الاستجابة حتى عندما يكون الموفّر محدود المعدل أو يفشل مؤقتًا.

    يتضمن صندوق حدود المعدل أكثر من استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نافذة الاستخدام الدورية (`weekly/monthly limit reached`) باعتبارها حدود معدل
    تستحق تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا ضمن ذلك الصندوق العابر. إذا أعاد موفّر نص فوترة صريحًا عند `401` أو `403`،
    فيمكن لـ OpenClaw إبقاء ذلك ضمن مسار الفوترة، لكن مطابقات النص الخاصة بالموفّر
    تبقى محصورة في الموفّر الذي يملكها (على سبيل المثال OpenRouter `Key limit exceeded`). إذا بدت رسالة `402`
    بدلًا من ذلك كأنها نافذة استخدام قابلة لإعادة المحاولة أو حد إنفاق
    لمؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، يتعامل OpenClaw معها على أنها
    `rate_limit`، وليس تعطيل فوترة طويلًا.

    أخطاء تجاوز السياق مختلفة: توقيعات مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` تبقى على مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    رجوع النموذج الاحتياطي.

    نص خطأ الخادم العام أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يتعامل OpenClaw مع الأشكال العابرة المحددة بنطاق الموفّر
    مثل رسالة Anthropic المجردة `An unknown error occurred`، ورسالة OpenRouter المجردة
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON `api_error` ذات نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال الموفّر مثل `ModelNotReadyException` باعتبارها
    إشارات مهلة/تحميل زائد تستحق تجاوز الفشل عندما يتطابق سياق الموفّر.
    النص الاحتياطي الداخلي العام مثل `LLM request failed with an unknown
    error.` يبقى محافظًا ولا يفعّل رجوع النموذج الاحتياطي بمفرده.

  </Accordion>

  <Accordion title='ماذا تعني "No credentials found for profile anthropic:default"؟'>
    تعني أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يجد بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحَّل بواسطة `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا عيّنت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني إعدادات الوكلاء المتعددين أنه قد توجد عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كانت الموفّرات موثّقة.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا أردت استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان ضبط نموذجك يتضمن Google Gemini كخيار رجوع احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء رجوع النموذج الاحتياطي. إذا لم تضبط بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما أن توفر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع الاحتياطي إليها.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا توقيعات** (غالبًا من
    دفق أُجهض/جزئي). يتطلب Google Antigravity توقيعات لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو عيّن `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بموفّر. توجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص ملفات التعريف المحفوظة دون إخراج الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [Models CLI](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف الشائعة؟">
    يستخدم OpenClaw معرّفات مسبوقة بالموفّر مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم الضبط بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل موفّر (`auth.order.<provider>`). هذا لا يخزّن أسرارًا؛ بل يربط المعرّفات بالموفّر/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw ملف تعريف مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهلات/إخفاقات مصادقة) أو حالة **تعطيل** أطول (فوترة/رصيد غير كافٍ). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط الدقيق: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدل محددة بنطاق النموذج. يمكن لملف تعريف في فترة تهدئة
    لنموذج واحد أن يظل قابلًا للاستخدام لنموذج شقيق على الموفّر نفسه،
    بينما تظل نوافذ الفوترة/التعطيل تحظر ملف التعريف بأكمله.

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

    إذا حُذف ملف تعريف مخزّن من الترتيب الصريح، فسيبلغ الفحص
    عن `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **OAuth** غالبًا ما يستفيد من وصول الاشتراك (حيثما ينطبق).
    - **مفاتيح API** تستخدم فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

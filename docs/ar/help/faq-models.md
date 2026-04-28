---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح التبديل عند الفشل للنماذج / "فشلت جميع النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: الإعدادات الافتراضية للنماذج، والاختيار، والأسماء المستعارة، والتبديل، والتبديل عند الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-04-25T18:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e060b48951b76d76a7f613b2abe3fdd845e34ae9eb5cbb36f45544f114edace7
    source_path: help/faq-models.md
    workflow: 15
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد، والجلسات، وGateway، والقنوات،
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الإعدادات الافتراضية، والاختيار، والأسماء المستعارة، والتبديل

  <AccordionGroup>
  <Accordion title='ما "النموذج الافتراضي"؟'>
    النموذج الافتراضي في OpenClaw هو أي نموذج تعيّنه على النحو التالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `openai-codex/gpt-5.5`). إذا حذفت المزوّد، فسيحاول OpenClaw أولًا استخدام اسم مستعار، ثم مطابقة فريدة لمزوّد مُكوَّن لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُكوَّن كمسار توافق قديم. وإذا كان ذلك المزوّد لم يعد يوفّر النموذج الافتراضي المُكوَّن، فسيعود OpenClaw إلى أول `provider/model` مُكوَّن بدلًا من إظهار نموذج افتراضي قديم لمزوّد تمت إزالته. ومع ذلك، يجب عليك **تعيين** `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي تنصح به؟">
    **الإعداد الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في مجموعة المزوّدين لديك.
    **للوكلاء المفعّلة بالأدوات أو الذين يتعاملون مع مدخلات غير موثوقة:** أعطِ الأولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax مستنداته الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    القاعدة العامة: استخدم **أفضل نموذج يمكنك تحمّل تكلفته** للأعمال عالية المخاطر، واستخدم نموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين من أجل
    تنفيذ المهام الطويلة بالتوازي (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير شديد: النماذج الأضعف أو المُفرطة في التكميم أكثر عرضة لحقن
    المطالبات والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    لمزيد من السياق: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج من دون مسح الإعدادات؟">
    استخدم **أوامر النماذج** أو عدّل حقول **النموذج** فقط. تجنب الاستبدال الكامل للإعدادات.

    الخيارات الآمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعدادات النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - عدّل `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنب `config.apply` مع كائن جزئي إلا إذا كنت تنوي استبدال الإعدادات بالكامل.
    بالنسبة إلى تعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`.
    تمنحك حمولة lookup المسار المُطبَّع، ووثائق/قيود schema السطحية، وملخصات العناصر الفرعية المباشرة.
    للتحديثات الجزئية.
    إذا كنت قد استبدلت الإعدادات فعلًا، فاستعدها من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    المستندات: [النماذج](/ar/concepts/models)، [Configure](/ar/cli/configure)، [Config](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp أو vLLM أو Ollama)؟">
    نعم. يُعد Ollama أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية بالإضافة إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المُكمَّمة بشدة أكثر عرضة لحقن
    المطالبات. نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    وإذا كنت لا تزال تريد نماذج صغيرة، ففعّل sandboxing وقوائم سماح صارمة للأدوات.

    المستندات: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [Sandboxing](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ما النماذج التي يستخدمها OpenClaw وFlawd وKrill؟">
    - قد تختلف هذه البيئات وقد تتغير بمرور الوقت؛ ولا توجد توصية ثابتة بشأن المزوّد.
    - تحقّق من إعدادات وقت التشغيل الحالية على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحساسين أمنيًا/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج أثناء العمل (من دون إعادة التشغيل)؟">
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

    هذه هي الأسماء المستعارة المضمّنة. ويمكن إضافة أسماء مستعارة مخصصة عبر `agents.defaults.models`.

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) منتقيًا مختصرًا ومرقمًا. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    نصيحة: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي ستتم تجربته بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المُكوَّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف قمت بتعيينه باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** اللاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا كنت تريد العودة إلى الإعداد الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` للتأكد من ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. عيّن أحدهما كإعداد افتراضي وبدّل حسب الحاجة:

    - **تبديل سريع (لكل جلسة):** استخدم `/model openai/gpt-5.5` لمهام OpenAI الحالية باستخدام مفتاح API المباشر أو `/model openai-codex/gpt-5.5` لمهام GPT-5.5 Codex OAuth.
    - **الإعداد الافتراضي:** عيّن `agents.defaults.model.primary` إلى `openai/gpt-5.5` لاستخدام مفتاح API أو إلى `openai-codex/gpt-5.5` لاستخدام GPT-5.5 Codex OAuth.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكلاء فرعيين باستخدام نموذج افتراضي مختلف.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أضبط الوضع السريع لـ GPT 5.5؟">
    استخدم إما مفتاح تبديل للجلسة أو إعدادًا افتراضيًا في config:

    - **لكل جلسة:** أرسل `/fast on` بينما تستخدم الجلسة `openai/gpt-5.5` أو `openai-codex/gpt-5.5`.
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

    بالنسبة إلى OpenAI، يطابق الوضع السريع `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. وتتغلب إعدادات `/fast` الخاصة بالجلسة على الإعدادات الافتراضية في config.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[الوضع السريع في OpenAI](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا أحصل على رد؟'>
    إذا كان `agents.defaults.models` مُعيّنًا، فإنه يصبح **قائمة السماح** للأمر `/model` وأي
    تجاوزات للجلسة. وعند اختيار نموذج غير موجود في تلك القائمة، فستحصل على:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    يُعاد هذا الخطأ **بدلًا من** الرد العادي. الحل: أضف النموذج إلى
    `agents.defaults.models`، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M2.7"؟'>
    هذا يعني أن **المزوّد غير مُكوَّن** (لم يتم العثور على إعداد لمزوّد MiniMax أو
    ملف تعريف مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة التحقق للحل:

    1. حدّث إلى إصدار حالي من OpenClaw (أو شغّل من المصدر `main`)، ثم أعد تشغيل Gateway.
    2. تأكد من تكوين MiniMax (عبر المعالج أو JSON)، أو من أن مصادقة MiniMax
       موجودة في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو MiniMax
       OAuth المخزن لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (مع مراعاة حالة الأحرف) لمسار المصادقة لديك:
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

  <Accordion title="هل يمكنني استخدام MiniMax كإعداد افتراضي وOpenAI للمهام المعقدة؟">
    نعم. استخدم **MiniMax كإعداد افتراضي** وبدّل النماذج **لكل جلسة** عند الحاجة.
    تُستخدم النماذج الاحتياطية لحالات **الأخطاء**، وليس "المهام الصعبة"، لذا استخدم `/model` أو وكيلًا منفصلًا.

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

    المستندات: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يوفّر OpenClaw بعض الاختصارات الافتراضية (ولا تُطبّق إلا عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5` لإعدادات مفتاح API، أو `openai-codex/gpt-5.5` عند التكوين لاستخدام Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    إذا قمت بتعيين اسم مستعار خاص بك بالاسم نفسه، فستكون الأولوية لقيمتك.

  </Accordion>

  <Accordion title="كيف أحدد/أتجاوز اختصارات النماذج (الأسماء المستعارة)؟">
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

    بعد ذلك، سيجري حل `/model sonnet` (أو `/<alias>` عندما يكون مدعومًا) إلى معرّف ذلك النموذج.

  </Accordion>

  <Accordion title="كيف أضيف نماذج من مزوّدين آخرين مثل OpenRouter أو Z.AI؟">
    OpenRouter (الدفع لكل رمز؛ كثير من النماذج):

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

    إذا أشرت إلى `provider/model` وكان مفتاح المزوّد المطلوب مفقودًا، فستحصل على خطأ مصادقة وقت التشغيل (مثل `No API key found for provider "zai"`).

    **لم يتم العثور على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. تكون المصادقة لكل وكيل
    وتُخزَّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` وقم بتكوين المصادقة أثناء المعالج.
    - أو انسخ `auth-profiles.json` من `agentDir` الخاص بالوكيل الرئيسي إلى `agentDir` الخاص بالوكيل الجديد.

    **لا** تعِد استخدام `agentDir` عبر عدة وكلاء؛ فهذا يسبب تعارضات في المصادقة/الجلسات.

  </Accordion>
</AccordionGroup>

## التبديل عند الفشل للنماذج و"فشلت جميع النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل التبديل عند الفشل؟">
    يحدث التبديل عند الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** داخل المزوّد نفسه.
    2. **النموذج الاحتياطي** إلى النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبَّق فترات تهدئة على ملفات التعريف الفاشلة (تراجع أُسّي)، بحيث يتمكن OpenClaw من مواصلة الرد حتى عندما يكون المزوّد مقيَّد المعدل أو يتعرض لفشل مؤقت.

    يشمل دلو حدود المعدل أكثر من مجرد استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) على أنها
    حدود معدل تستحق التبديل عند الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وبعض استجابات HTTP `402`
    تبقى أيضًا ضمن هذا الدلو المؤقت. إذا أعاد مزوّد ما
    نص فوترة صريحًا على `401` أو `403`، فلا يزال بإمكان OpenClaw إبقاؤه ضمن
    مسار الفوترة، لكن مطابِقات النصوص الخاصة بالمزوّد تبقى محصورة في
    المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك كحد نافذة استخدام قابل لإعادة المحاولة أو
    كحد إنفاق خاص بالمؤسسة/مساحة العمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، فإن OpenClaw يعاملها على أنها
    `rate_limit`، وليس تعطيل فوترة طويل الأمد.

    تختلف أخطاء تجاوز السياق: إذ تبقى التواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` ضمن مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    النموذج الاحتياطي.

    يكون نص الخطأ العام للخادم أضيق عمدًا من "أي شيء يحتوي على
    unknown/error". يتعامل OpenClaw مع الأشكال المؤقتة المحصورة بالمزوّد
    مثل رسالة Anthropic المجردة `An unknown error occurred`، ورسالة OpenRouter المجردة
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON من نوع `api_error` مع نص خادم مؤقت
    (`internal server error`، `unknown error, 520`، `upstream error`، `backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات timeout/تحميل زائد تستحق التبديل عند الفشل عندما تتطابق
    بيئة المزوّد.
    أما نص الاحتياط الداخلي العام مثل `LLM request failed with an unknown
    error.` فيبقى محافظًا ولا يفعّل الاحتياط إلى نموذج آخر بمفرده.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني هذا أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يتمكن من العثور على بيانات الاعتماد الخاصة به في مخزن المصادقة المتوقع.

    **قائمة التحقق للإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُنقل بواسطة `openclaw doctor`)
    - **تأكد من أن متغير env محمَّل بواسطة Gateway**
      - إذا قمت بتعيين `ANTHROPIC_API_KEY` في shell لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - إعدادات الوكلاء المتعددين تعني أنه قد توجد عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المكوّنة وما إذا كانت المزوّدات موثَّقة.

    **قائمة التحقق للإصلاح لعبارة "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف gateway.
    - **إذا كنت تريد استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف gateway**.
      - امسح أي ترتيب مثبت يفرض ملف تعريف مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف gateway**
      - في الوضع البعيد، تعيش ملفات تعريف المصادقة على جهاز gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا Google Gemini وفشل؟">
    إذا كان تكوين النموذج لديك يتضمن Google Gemini كنموذج احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الاحتياط إلى نموذج آخر. وإذا لم تكن قد كوّنت بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما أن توفّر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الاحتياط إليها.

    **تم رفض طلب LLM: توقيع thinking مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل thinking بلا تواقيع** (غالبًا من
    تدفق مُلغى/جزئي). يتطلب Google Antigravity تواقيع لكتل thinking.

    الإصلاح: يقوم OpenClaw الآن بإزالة كتل thinking غير الموقّعة لـ Google Antigravity Claude. وإذا استمر ظهور ذلك، فابدأ **جلسة جديدة** أو عيّن `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيفية إدارتها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، وتخزين الرموز، وأنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمّى (OAuth أو مفتاح API) مرتبط بمزوّد. وتوجد ملفات التعريف في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="ما معرّفات ملفات التعريف المعتادة؟">
    يستخدم OpenClaw معرّفات مسبوقة باسم المزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها أنت (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي يُجرَّب أولًا؟">
    نعم. يدعم config بيانات وصفية اختيارية لملفات التعريف وترتيبًا لكل مزوّد (`auth.order.<provider>`). هذا **لا** يخزّن الأسرار؛ بل يربط المعرّفات بالمزوّد/الوضع ويعيّن ترتيب التدوير.

    قد يتخطى OpenClaw مؤقتًا ملف تعريف إذا كان في **فترة تهدئة** قصيرة (حدود معدل/مهل زمنية/إخفاقات مصادقة) أو في حالة **تعطيل** أطول (فوترة/رصيد غير كافٍ). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات التهدئة الخاصة بحدود المعدل محصورة بالنموذج. وقد يبقى ملف تعريف
    في فترة تهدئة لنموذج واحد قابلًا للاستخدام لنموذج شقيق على المزوّد نفسه،
    بينما تستمر نوافذ الفوترة/التعطيل في حظر ملف التعريف بالكامل.

    يمكنك أيضًا تعيين تجاوز ترتيب **لكل وكيل** (يُخزَّن في `auth-state.json` الخاص بذلك الوكيل) عبر CLI:

    ```bash
    # يستخدم الوكيل الافتراضي المكوَّن افتراضيًا (احذف --agent)
    openclaw models auth order get --provider anthropic

    # اقصر التدوير على ملف تعريف واحد (جرّب هذا فقط)
    openclaw models auth order set --provider anthropic anthropic:default

    # أو عيّن ترتيبًا صريحًا (احتياط داخل المزوّد)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # امسح التجاوز (العودة إلى config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    لاستهداف وكيل محدد:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    وللتحقق مما سيُجرَّب فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا تم حذف ملف تعريف مخزّن من الترتيب الصريح، فإن probe يبلغ عن
    `excluded_by_auth_order` لذلك الملف بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كلا الأمرين:

    - غالبًا ما يستفيد **OAuth** من الوصول عبر الاشتراك (عند انطباق ذلك).
    - تستخدم **مفاتيح API** فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI، وOpenAI Codex OAuth، ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [التبديل عند الفشل للنماذج](/ar/concepts/model-failover)

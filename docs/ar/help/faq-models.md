---
read_when:
    - اختيار النماذج أو التبديل بينها، وتكوين الأسماء المستعارة
    - تصحيح أخطاء تجاوز فشل النماذج / "فشلت كل النماذج"
    - فهم ملفات تعريف المصادقة وكيفية إدارتها
sidebarTitle: Models FAQ
summary: 'الأسئلة الشائعة: إعدادات النموذج الافتراضية، والاختيار، والأسماء المستعارة، والتبديل، وتجاوز الفشل، وملفات تعريف المصادقة'
title: 'الأسئلة الشائعة: النماذج والمصادقة'
x-i18n:
    generated_at: "2026-06-27T17:46:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 048e031bb52d10572527d790fda3b63a0d74d08799e48128ea64c4c16ab1f423
    source_path: help/faq-models.md
    workflow: 16
---

  أسئلة وأجوبة حول النماذج وملفات تعريف المصادقة. للإعداد والجلسات وGateway والقنوات
  واستكشاف الأخطاء وإصلاحها، راجع [الأسئلة الشائعة](/ar/help/faq) الرئيسية.

  ## النماذج: الافتراضيات، الاختيار، الأسماء المستعارة، التبديل

  <AccordionGroup>
  <Accordion title='ما هو "النموذج الافتراضي"؟'>
    نموذج OpenClaw الافتراضي هو أي نموذج تضبطه كالتالي:

    ```
    agents.defaults.model.primary
    ```

    تتم الإشارة إلى النماذج بصيغة `provider/model` (مثال: `openai/gpt-5.5` أو `anthropic/claude-sonnet-4-6`). إذا حذفت المزوّد، يحاول OpenClaw أولًا استخدام اسم مستعار، ثم تطابقًا فريدًا لمزوّد مُعدّ لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط يعود إلى المزوّد الافتراضي المُعدّ كمسار توافق مهمل. إذا لم يعد ذلك المزوّد يوفّر النموذج الافتراضي المُعدّ، يعود OpenClaw إلى أول مزوّد/نموذج مُعدّ بدلًا من إظهار افتراضي قديم لمزوّد مُزال. مع ذلك، يجب أن تضبط `provider/model` **صراحةً**.

  </Accordion>

  <Accordion title="ما النموذج الذي تنصحون به؟">
    **الافتراضي الموصى به:** استخدم أقوى نموذج من أحدث جيل متاح في حزمة المزوّدين لديك.
    **للوكلاء المفعّلين بالأدوات أو مدخلات غير موثوقة:** أعطِ أولوية لقوة النموذج على التكلفة.
    **للدردشة الروتينية/منخفضة المخاطر:** استخدم نماذج احتياطية أرخص ووجّه حسب دور الوكيل.

    لدى MiniMax وثائقها الخاصة: [MiniMax](/ar/providers/minimax) و
    [النماذج المحلية](/ar/gateway/local-models).

    قاعدة عامة: استخدم **أفضل نموذج تستطيع تحمّل تكلفته** للأعمال عالية المخاطر، ونموذجًا أرخص
    للدردشة الروتينية أو الملخصات. يمكنك توجيه النماذج لكل وكيل واستخدام الوكلاء الفرعيين
    لموازاة المهام الطويلة (كل وكيل فرعي يستهلك رموزًا). راجع [النماذج](/ar/concepts/models) و
    [الوكلاء الفرعيون](/ar/tools/subagents).

    تحذير قوي: النماذج الأضعف/المكمّاة بإفراط أكثر عرضة لحقن المطالبات
    والسلوك غير الآمن. راجع [الأمان](/ar/gateway/security).

    سياق إضافي: [النماذج](/ar/concepts/models).

  </Accordion>

  <Accordion title="كيف أبدّل النماذج دون مسح إعدادي؟">
    استخدم **أوامر النموذج** أو حرّر حقول **النموذج** فقط. تجنّب استبدال الإعداد بالكامل.

    خيارات آمنة:

    - `/model` في الدردشة (سريع، لكل جلسة)
    - `openclaw models set ...` (يحدّث إعداد النموذج فقط)
    - `openclaw configure --section model` (تفاعلي)
    - حرّر `agents.defaults.model` في `~/.openclaw/openclaw.json`

    تجنّب `config.apply` مع كائن جزئي إلا إذا كنت تقصد استبدال الإعداد بالكامل.
    لتعديلات RPC، افحص أولًا باستخدام `config.schema.lookup` وفضّل `config.patch`. تمنحك حمولة البحث المسار المطبّع، ووثائق/قيود المخطط السطحية، وملخصات الأبناء المباشرين.
    للتحديثات الجزئية.
    إذا استبدلت الإعداد بالخطأ، فاستعد من نسخة احتياطية أو أعد تشغيل `openclaw doctor` للإصلاح.

    الوثائق: [النماذج](/ar/concepts/models)، [الإعداد](/ar/cli/configure)، [Config](/ar/cli/config)، [Doctor](/ar/gateway/doctor).

  </Accordion>

  <Accordion title="هل يمكنني استخدام نماذج مستضافة ذاتيًا (llama.cpp وvLLM وOllama)؟">
    نعم. Ollama هو أسهل مسار للنماذج المحلية.

    أسرع إعداد:

    1. ثبّت Ollama من `https://ollama.com/download`
    2. اسحب نموذجًا محليًا مثل `ollama pull gemma4`
    3. إذا كنت تريد نماذج سحابية أيضًا، شغّل `ollama signin`
    4. شغّل `openclaw onboard` واختر `Ollama`
    5. اختر `Local` أو `Cloud + Local`

    ملاحظات:

    - يمنحك `Cloud + Local` نماذج سحابية إضافةً إلى نماذج Ollama المحلية لديك
    - النماذج السحابية مثل `kimi-k2.5:cloud` لا تحتاج إلى سحب محلي
    - للتبديل اليدوي، استخدم `openclaw models list` و`openclaw models set ollama/<model>`

    ملاحظة أمنية: النماذج الأصغر أو المكمّاة بشدة أكثر عرضة لحقن المطالبات.
    نوصي بشدة باستخدام **نماذج كبيرة** لأي بوت يمكنه استخدام الأدوات.
    إذا كنت لا تزال تريد نماذج صغيرة، ففعّل العزل وقوائم السماح الصارمة للأدوات.

    الوثائق: [Ollama](/ar/providers/ollama)، [النماذج المحلية](/ar/gateway/local-models)،
    [مزوّدو النماذج](/ar/concepts/model-providers)، [الأمان](/ar/gateway/security)،
    [العزل](/ar/gateway/sandboxing).

  </Accordion>

  <Accordion title="ماذا يستخدم OpenClaw وFlawd وKrill من نماذج؟">
    - قد تختلف هذه النشرات وقد تتغير بمرور الوقت؛ لا توجد توصية ثابتة لمزوّد.
    - تحقق من إعداد وقت التشغيل الحالي على كل Gateway باستخدام `openclaw models status`.
    - للوكلاء الحسّاسين أمنيًا/المفعّلين بالأدوات، استخدم أقوى نموذج من أحدث جيل متاح.

  </Accordion>

  <Accordion title="كيف أبدّل النماذج فورًا (دون إعادة التشغيل)؟">
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

    يمكنك عرض النماذج المتاحة باستخدام `/model` أو `/model list` أو `/model status`.

    يعرض `/model` (و`/model list`) أداة اختيار مدمجة ومرقّمة. اختر بالرقم:

    ```
    /model 3
    ```

    يمكنك أيضًا فرض ملف تعريف مصادقة محدد للمزوّد (لكل جلسة):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    تلميح: يعرض `/model status` الوكيل النشط، وملف `auth-profiles.json` المستخدم، وملف تعريف المصادقة الذي سيُجرّب بعد ذلك.
    كما يعرض نقطة نهاية المزوّد المُعدّة (`baseUrl`) ووضع API (`api`) عند توفرهما.

    **كيف ألغي تثبيت ملف تعريف ضبطته باستخدام @profile؟**

    أعد تشغيل `/model` **من دون** لاحقة `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    إذا أردت العودة إلى الافتراضي، فاختره من `/model` (أو أرسل `/model <default provider/model>`).
    استخدم `/model status` لتأكيد ملف تعريف المصادقة النشط.

  </Accordion>

  <Accordion title="إذا كان مزوّدان يوفّران معرّف النموذج نفسه، فأيهما يستخدم /model؟">
    يختار `/model provider/model` مسار ذلك المزوّد الدقيق للجلسة.

    على سبيل المثال، `qianfan/deepseek-v4-flash` و`deepseek/deepseek-v4-flash` مرجعان مختلفان للنموذج رغم أن كليهما يحتوي على `deepseek-v4-flash`. يجب ألا يبدّل OpenClaw بصمت من مزوّد إلى آخر لمجرد أن معرّف النموذج المجرد يطابق.

    يكون مرجع `/model` الذي اختاره المستخدم صارمًا أيضًا لسياسة الاحتياط. إذا كان ذلك المزوّد/النموذج المختار غير متاح، تفشل الاستجابة بوضوح بدلًا من الرد من `agents.defaults.model.fallbacks`. تظل سلاسل الاحتياط المُعدّة مطبقة على الافتراضيات المُعدّة، وأساسيات مهام Cron، وحالة الاحتياط المختارة تلقائيًا.

    إذا كان تشغيل بدأ من تجاوز غير خاص بالجلسة مسموحًا له باستخدام الاحتياط، يحاول OpenClaw المزوّد/النموذج المطلوب أولًا، ثم الاحتياطات المُعدّة، وبعد ذلك فقط الأساسي المُعدّ. يمنع ذلك معرّفات النماذج المجردة المكررة من القفز مباشرةً إلى المزوّد الافتراضي.

    راجع [النماذج](/ar/concepts/models) و[تجاوز فشل النموذج](/ar/concepts/model-failover).

  </Accordion>

  <Accordion title="هل يمكنني استخدام GPT 5.5 للمهام اليومية وCodex 5.5 للبرمجة؟">
    نعم. تعامل مع اختيار النموذج واختيار وقت التشغيل بشكل منفصل:

    - **وكيل البرمجة الأصلي في Codex:** اضبط `agents.defaults.model.primary` على `openai/gpt-5.5`. سجّل الدخول باستخدام `openclaw models auth login --provider openai` عندما تريد مصادقة اشتراك ChatGPT/Codex.
    - **مهام OpenAI API المباشرة خارج حلقة الوكيل:** اضبط `OPENAI_API_KEY` للصور، والتضمينات، والكلام، والزمن الحقيقي، وغيرها من أسطح OpenAI API غير الخاصة بالوكيل.
    - **مصادقة مفتاح API لوكيل OpenAI:** استخدم `/model openai/gpt-5.5` مع ملف تعريف مفتاح API مرتّب لـ `openai`.
    - **الوكلاء الفرعيون:** وجّه مهام البرمجة إلى وكيل مركّز على Codex مع نموذج `openai/gpt-5.5` الخاص به.

    راجع [النماذج](/ar/concepts/models) و[أوامر الشرطة المائلة](/ar/tools/slash-commands).

  </Accordion>

  <Accordion title="كيف أعدّ الوضع السريع لـ GPT 5.5؟">
    استخدم إما تبديلًا للجلسة أو افتراضي إعداد:

    - **لكل جلسة:** أرسل `/fast on` أثناء استخدام الجلسة `openai/gpt-5.5`.
    - **افتراضي لكل نموذج:** اضبط `agents.defaults.models["openai/gpt-5.5"].params.fastMode` على `true`.
    - **حد تلقائي:** استخدم `/fast auto` أو `params.fastMode: "auto"` لبدء استدعاءات النموذج الجديدة سريعًا حتى الحد التلقائي، ثم بدء استدعاءات إعادة المحاولة أو الاحتياط أو نتائج الأدوات أو المتابعة اللاحقة من دون الوضع السريع. الحد الافتراضي هو 60 ثانية؛ اضبط `params.fastAutoOnSeconds` على النموذج النشط لتغييره.

    مثال:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    بالنسبة إلى OpenAI، يرتبط الوضع السريع بـ `service_tier = "priority"` في طلبات Responses الأصلية المدعومة. تتغلب تجاوزات `/fast` الخاصة بالجلسة على افتراضيات الإعداد. لا يمكن لدورات خادم تطبيق Codex تلقي الطبقة إلا عند بدء الدورة، لذلك ينطبق `auto` على دورة النموذج التالية التي يبدأها OpenClaw بدلًا من داخل دورة خادم تطبيق قيد التشغيل بالفعل.

    راجع [التفكير والوضع السريع](/ar/tools/thinking) و[وضع OpenAI السريع](/ar/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='لماذا أرى "Model ... is not allowed" ثم لا توجد استجابة؟'>
    إذا تم ضبط `agents.defaults.models`، فإنه يصبح **قائمة السماح** لـ `/model` وأي
    تجاوزات للجلسة. اختيار نموذج غير موجود في تلك القائمة يعيد:

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    يُعاد ذلك الخطأ **بدلًا من** استجابة عادية. الإصلاح: أضف النموذج الدقيق إلى
    `agents.defaults.models`، أو أضف حرف بدل للمزوّد مثل `"provider/*": {}` لكتالوجات المزوّدين الديناميكية، أو أزل قائمة السماح، أو اختر نموذجًا من `/model list`.
    إذا كان الأمر يتضمن أيضًا `--runtime codex`، فحدّث قائمة السماح أولًا ثم أعد محاولة
    الأمر نفسه `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='لماذا أرى "Unknown model: minimax/MiniMax-M3"؟'>
    يعني هذا أن **المزوّد غير مُعدّ** (لم يتم العثور على إعداد مزوّد MiniMax أو ملف تعريف مصادقة)، لذلك لا يمكن حل النموذج.

    قائمة التحقق للإصلاح:

    1. رقّ إلى إصدار OpenClaw حالي (أو شغّل من `main` المصدر)، ثم أعد تشغيل Gateway.
    2. تأكد من إعداد MiniMax (المعالج أو JSON)، أو أن مصادقة MiniMax
       موجودة في env/ملفات تعريف المصادقة بحيث يمكن حقن المزوّد المطابق
       (`MINIMAX_API_KEY` لـ `minimax`، أو `MINIMAX_OAUTH_TOKEN` أو OAuth مخزّن لـ MiniMax
       لـ `minimax-portal`).
    3. استخدم معرّف النموذج الدقيق (حساس لحالة الأحرف) لمسار المصادقة لديك:
       `minimax/MiniMax-M3`، أو `minimax/MiniMax-M2.7`، أو
       `minimax/MiniMax-M2.7-highspeed` لإعداد مفتاح API، أو
       `minimax-portal/MiniMax-M3`، أو `minimax-portal/MiniMax-M2.7`، أو
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
    الاحتياطات مخصصة لـ **الأخطاء**، لا "المهام الصعبة"، لذلك استخدم `/model` أو وكيلًا منفصلًا.

    **الخيار أ: التبديل لكل جلسة**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
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

    - افتراضي الوكيل A: MiniMax
    - افتراضي الوكيل B: OpenAI
    - وجّه حسب الوكيل أو استخدم `/agent` للتبديل

    Docs: [النماذج](/ar/concepts/models)، [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)، [MiniMax](/ar/providers/minimax)، [OpenAI](/ar/providers/openai).

  </Accordion>

  <Accordion title="هل opus / sonnet / gpt اختصارات مضمّنة؟">
    نعم. يوفّر OpenClaw بعض الاختصارات الافتراضية (تُطبّق فقط عندما يكون النموذج موجودًا في `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-8`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite`

    إذا عيّنت اسمًا مستعارًا خاصًا بك بالاسم نفسه، فستكون قيمتك هي المستخدمة.

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
          },
        },
      },
    }
    ```

    بعد ذلك يُحلّ `/model sonnet` (أو `/<alias>` عند دعمه) إلى معرّف ذلك النموذج.

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

    **لم يُعثر على مفتاح API للمزوّد بعد إضافة وكيل جديد**

    يعني هذا عادةً أن **الوكيل الجديد** لديه مخزن مصادقة فارغ. المصادقة تكون لكل وكيل وتُخزّن في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    خيارات الإصلاح:

    - شغّل `openclaw agents add <id>` واضبط المصادقة أثناء المعالج.
    - أو انسخ فقط ملفات تعريف `api_key` / `token` الثابتة القابلة للنقل من مخزن مصادقة الوكيل الرئيسي إلى مخزن مصادقة الوكيل الجديد.
    - بالنسبة إلى ملفات تعريف OAuth، سجّل الدخول من الوكيل الجديد عندما يحتاج إلى حسابه الخاص؛ وإلا يمكن لـ OpenClaw القراءة عبر الوكيل الافتراضي/الرئيسي من دون استنساخ رموز التحديث.

    لا تُعد استخدام `agentDir` عبر الوكلاء؛ فهذا يسبّب تعارضات في المصادقة/الجلسة.

  </Accordion>
</AccordionGroup>

## تجاوز فشل النموذج و"فشلت جميع النماذج"

<AccordionGroup>
  <Accordion title="كيف يعمل تجاوز الفشل؟">
    يحدث تجاوز الفشل على مرحلتين:

    1. **تدوير ملف تعريف المصادقة** ضمن المزوّد نفسه.
    2. **الرجوع إلى نموذج بديل** وهو النموذج التالي في `agents.defaults.model.fallbacks`.

    تُطبّق فترات تهدئة على الملفات الشخصية الفاشلة (تراجع أُسّي)، لذلك يمكن لـ OpenClaw مواصلة الاستجابة حتى عندما يكون المزوّد مقيّد المعدّل أو يفشل مؤقتًا.

    لا تقتصر حاوية تقييد المعدّل على استجابات `429` العادية. يتعامل OpenClaw
    أيضًا مع رسائل مثل `Too many concurrent requests`،
    و`ThrottlingException`، و`concurrency limit reached`،
    و`workers_ai ... quota limit exceeded`، و`resource exhausted`، وحدود
    نوافذ الاستخدام الدورية (`weekly/monthly limit reached`) باعتبارها
    حدود معدّل تستدعي تجاوز الفشل.

    بعض الاستجابات التي تبدو متعلقة بالفوترة ليست `402`، وتبقى بعض استجابات HTTP `402`
    أيضًا ضمن تلك الحاوية العابرة. إذا أعاد مزوّد نص فوترة صريحًا مع `401` أو `403`،
    فلا يزال بإمكان OpenClaw إبقاؤه في مسار الفوترة، لكن مطابقات النص الخاصة بالمزوّد
    تبقى محصورة في المزوّد الذي يملكها (مثل OpenRouter `Key limit exceeded`). وإذا بدت رسالة `402`
    بدلًا من ذلك كنافذة استخدام قابلة لإعادة المحاولة أو
    حد إنفاق مؤسسة/مساحة عمل (`daily limit reached, resets tomorrow`،
    `organization spending limit exceeded`)، يعاملها OpenClaw على أنها
    `rate_limit`، وليس تعطيل فوترة طويلًا.

    أخطاء تجاوز السياق مختلفة: تبقى التواقيع مثل
    `request_too_large`، و`input exceeds the maximum number of tokens`،
    و`input token count exceeds the maximum number of input tokens`،
    و`input is too long for the model`، أو `ollama error: context length
    exceeded` على مسار Compaction/إعادة المحاولة بدلًا من الانتقال إلى
    الرجوع إلى نموذج بديل.

    نص خطأ الخادم العام أضيق عمدًا من "أي شيء يحتوي على unknown/error".
    يتعامل OpenClaw فعلًا مع أشكال عابرة محصورة بالمزوّد
    مثل خطأ Anthropic المجرد `An unknown error occurred`، وخطأ OpenRouter المجرد
    `Provider returned error`، وأخطاء سبب الإيقاف مثل `Unhandled stop reason:
    error`، وحمولات JSON `api_error` التي تحتوي على نص خادم عابر
    (`internal server error`، و`unknown error, 520`، و`upstream error`، و`backend
    error`)، وأخطاء انشغال المزوّد مثل `ModelNotReadyException` على أنها
    إشارات انتهاء مهلة/ازدحام تستدعي تجاوز الفشل عندما يطابق سياق المزوّد.
    يبقى نص الرجوع الداخلي العام مثل `LLM request failed with an unknown
    error.` محافظًا ولا يؤدي إلى الرجوع إلى نموذج بديل بمفرده.

  </Accordion>

  <Accordion title='ماذا يعني "No credentials found for profile anthropic:default"؟'>
    يعني ذلك أن النظام حاول استخدام معرّف ملف تعريف المصادقة `anthropic:default`، لكنه لم يجد بيانات اعتماد له في مخزن المصادقة المتوقع.

    **قائمة تحقق الإصلاح:**

    - **تأكد من مكان وجود ملفات تعريف المصادقة** (المسارات الجديدة مقابل القديمة)
      - الحالي: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - القديم: `~/.openclaw/agent/*` (يُرحّل بواسطة `openclaw doctor`)
    - **تأكد من أن متغير البيئة لديك محمّل بواسطة Gateway**
      - إذا عيّنت `ANTHROPIC_API_KEY` في الصدفة لديك لكنك تشغّل Gateway عبر systemd/launchd، فقد لا يرثه. ضعه في `~/.openclaw/.env` أو فعّل `env.shellEnv`.
    - **تأكد من أنك تعدّل الوكيل الصحيح**
      - تعني الإعدادات متعددة الوكلاء أنه قد توجد عدة ملفات `auth-profiles.json`.
    - **تحقق سريعًا من حالة النموذج/المصادقة**
      - استخدم `openclaw models status` لرؤية النماذج المضبوطة وما إذا كان المزوّدون مصادقين.

    **قائمة تحقق الإصلاح لـ "No credentials found for profile anthropic"**

    يعني هذا أن التشغيل مثبّت على ملف تعريف مصادقة Anthropic، لكن Gateway
    لا يستطيع العثور عليه في مخزن المصادقة الخاص به.

    - **استخدم Claude CLI**
      - شغّل `openclaw models auth login --provider anthropic --method cli --set-default` على مضيف Gateway.
    - **إذا أردت استخدام مفتاح API بدلًا من ذلك**
      - ضع `ANTHROPIC_API_KEY` في `~/.openclaw/.env` على **مضيف Gateway**.
      - امسح أي ترتيب مثبّت يفرض ملفًا شخصيًا مفقودًا:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **تأكد من أنك تشغّل الأوامر على مضيف Gateway**
      - في الوضع البعيد، توجد ملفات تعريف المصادقة على جهاز Gateway، وليس على حاسوبك المحمول.

  </Accordion>

  <Accordion title="لماذا حاول أيضًا استخدام Google Gemini وفشل؟">
    إذا كان إعداد نموذجك يتضمن Google Gemini كبديل احتياطي (أو بدّلت إلى اختصار Gemini)، فسيحاول OpenClaw استخدامه أثناء الرجوع إلى نموذج بديل. إذا لم تضبط بيانات اعتماد Google، فسترى `No API key found for provider "google"`.

    الإصلاح: إما أن توفّر مصادقة Google، أو تزيل/تتجنب نماذج Google في `agents.defaults.model.fallbacks` / الأسماء المستعارة حتى لا يوجّه الرجوع إلى هناك.

    **رُفض طلب LLM: توقيع التفكير مطلوب (Google Antigravity)**

    السبب: يحتوي سجل الجلسة على **كتل تفكير بلا توقيعات** (غالبًا من
    تدفق مُجهض/جزئي). يتطلب Google Antigravity توقيعات لكتل التفكير.

    الإصلاح: يزيل OpenClaw الآن كتل التفكير غير الموقعة لـ Google Antigravity Claude. إذا ظلّت تظهر، فابدأ **جلسة جديدة** أو اضبط `/thinking off` لذلك الوكيل.

  </Accordion>
</AccordionGroup>

## ملفات تعريف المصادقة: ما هي وكيف تديرها

ذو صلة: [/concepts/oauth](/ar/concepts/oauth) (تدفقات OAuth، تخزين الرموز، أنماط الحسابات المتعددة)

<AccordionGroup>
  <Accordion title="ما هو ملف تعريف المصادقة؟">
    ملف تعريف المصادقة هو سجل بيانات اعتماد مسمى (OAuth أو مفتاح API) مرتبط بمزوّد. توجد الملفات الشخصية في:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    لفحص الملفات الشخصية المحفوظة من دون كشف الأسرار، شغّل `openclaw models auth list` (اختياريًا `--provider <id>` أو `--json`). راجع [CLI النماذج](/ar/cli/models#auth-profiles) للتفاصيل.

  </Accordion>

  <Accordion title="ما هي معرّفات الملفات الشخصية المعتادة؟">
    يستخدم OpenClaw معرّفات مسبوقة بالمزوّد مثل:

    - `anthropic:default` (شائع عندما لا توجد هوية بريد إلكتروني)
    - `anthropic:<email>` لهويات OAuth
    - معرّفات مخصصة تختارها (مثل `anthropic:work`)

  </Accordion>

  <Accordion title="هل يمكنني التحكم في ملف تعريف المصادقة الذي تتم تجربته أولًا؟">
    نعم. يدعم الإعداد بيانات وصفية اختيارية للملفات الشخصية وترتيبًا لكل مزوّد (`auth.order.<provider>`). هذا لا يخزّن أسرارًا؛ بل يربط المعرّفات بالمزوّد/الوضع ويضبط ترتيب التدوير.

    قد يتخطى OpenClaw ملفًا شخصيًا مؤقتًا إذا كان في **فترة تهدئة** قصيرة (حدود المعدّل/انتهاء المهلة/إخفاقات المصادقة) أو في حالة **تعطيل** أطول (الفوترة/الأرصدة غير الكافية). لفحص ذلك، شغّل `openclaw models status --json` وتحقق من `auth.unusableProfiles`. الضبط: `auth.cooldowns.billingBackoffHours*`.

    يمكن أن تكون فترات تهدئة حدود المعدّل محصورة بالنموذج. قد يظل الملف الشخصي الذي يهدأ
    لنموذج واحد قابلًا للاستخدام لنموذج شقيق لدى المزوّد نفسه،
    بينما لا تزال نوافذ الفوترة/التعطيل تحظر الملف الشخصي بالكامل.

    يمكنك أيضًا تعيين تجاوز ترتيب **لكل وكيل** (مخزّن في `auth-state.json` الخاص بذلك الوكيل) عبر CLI:

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

    للتحقق مما ستتم تجربته فعليًا، استخدم:

    ```bash
    openclaw models status --probe
    ```

    إذا حُذف ملف شخصي مخزّن من الترتيب الصريح، يبلّغ الفحص
    `excluded_by_auth_order` لذلك الملف الشخصي بدلًا من تجربته بصمت.

  </Accordion>

  <Accordion title="OAuth مقابل مفتاح API - ما الفرق؟">
    يدعم OpenClaw كليهما:

    - **تسجيل دخول OAuth / CLI** غالبًا يستفيد من وصول الاشتراك حيث يدعمه
      المزوّد. بالنسبة إلى Anthropic، يستخدم خلفية Claude CLI في OpenClaw
      الأمر Claude Code `claude -p`؛ وتعامل Anthropic هذا حاليًا على أنه استخدام
      Agent SDK/برمجي، مع رصيد Agent SDK شهري منفصل يبدأ
      في 15 يونيو 2026.
    - **مفاتيح API** تستخدم فوترة الدفع لكل رمز.

    يدعم المعالج صراحةً Anthropic Claude CLI وOpenAI Codex OAuth ومفاتيح API.

  </Accordion>
</AccordionGroup>

## ذو صلة

- [الأسئلة الشائعة](/ar/help/faq) — الأسئلة الشائعة الرئيسية
- [الأسئلة الشائعة — البدء السريع وإعداد التشغيل الأول](/ar/help/faq-first-run)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

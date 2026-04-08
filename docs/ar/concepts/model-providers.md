---
read_when:
    - تحتاج إلى مرجع لإعداد النماذج لكل موفر على حدة
    - تريد أمثلة على الإعدادات أو أوامر الإعداد عبر CLI لموفري النماذج
summary: نظرة عامة على موفري النماذج مع أمثلة للإعدادات وتدفقات CLI
title: موفرو النماذج
x-i18n:
    generated_at: "2026-04-08T06:03:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 558ac9e34b67fcc3dd6791a01bebc17e1c34152fa6c5611593d681e8cfa532d9
    source_path: concepts/model-providers.md
    workflow: 15
---

# موفرو النماذج

تغطي هذه الصفحة **موفري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النماذج، راجع [/concepts/models](/ar/concepts/models).

## قواعد سريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- إذا قمت بتعيين `agents.defaults.models`، فستصبح هذه هي قائمة السماح.
- مساعدات CLI: `openclaw onboard` و`openclaw models list` و`openclaw models set <provider/model>`.
- قواعد التشغيل الاحتياطي وقت التشغيل، وفحوصات التهدئة، واستمرارية تجاوزات الجلسة
  موثقة في [/concepts/model-failover](/ar/concepts/model-failover).
- `models.providers.*.models[].contextWindow` هي بيانات تعريف أصلية للنموذج؛
  و`models.providers.*.models[].contextTokens` هو الحد الفعلي وقت التشغيل.
- يمكن لإضافات الموفر حقن فهارس النماذج عبر `registerProvider({ catalog })`؛
  ويقوم OpenClaw بدمج هذا الناتج في `models.providers` قبل كتابة
  `models.json`.
- يمكن لبيانات تعريف الموفر الإعلان عن `providerAuthEnvVars` بحيث لا تحتاج
  فحوصات المصادقة العامة المعتمدة على متغيرات البيئة إلى تحميل وقت تشغيل الإضافة.
  أصبحت خريطة متغيرات البيئة الأساسية المتبقية الآن فقط لموفري
  الإضافات/الأساس غير القائمين على الإضافات وبعض حالات الأولوية العامة
  مثل إعداد Anthropic مع تفضيل مفتاح API أولًا.
- يمكن لإضافات الموفر أيضًا امتلاك سلوك وقت تشغيل الموفر عبر
  `normalizeModelId` و`normalizeTransport` و`normalizeConfig` و
  `applyNativeStreamingUsageCompat` و`resolveConfigApiKey` و
  `resolveSyntheticAuth` و`shouldDeferSyntheticProfileAuth` و
  `resolveDynamicModel` و`prepareDynamicModel` و
  `normalizeResolvedModel` و`contributeResolvedModelCompat` و
  `capabilities` و`normalizeToolSchemas` و
  `inspectToolSchemas` و`resolveReasoningOutputMode` و
  `prepareExtraParams` و`createStreamFn` و`wrapStreamFn` و
  `resolveTransportTurnState` و`resolveWebSocketSessionPolicy` و
  `createEmbeddingProvider` و`formatApiKey` و`refreshOAuth` و
  `buildAuthDoctorHint` و
  `matchesContextOverflowError` و`classifyFailoverReason` و
  `isCacheTtlEligible` و`buildMissingAuthMessage` و`suppressBuiltInModel` و
  `augmentModelCatalog` و`isBinaryThinking` و`supportsXHighThinking` و
  `resolveDefaultThinkingLevel` و`applyConfigDefaults` و`isModernModelRef` و
  `prepareRuntimeAuth` و`resolveUsageAuth` و`fetchUsageSnapshot` و
  `onModelSelected`.
- ملاحظة: `capabilities` الخاصة بوقت تشغيل الموفر هي بيانات تعريف مشتركة
  للمشغل (عائلة الموفر، وخصائص النصوص الأداتية/الأدوات، وتلميحات النقل/التخزين المؤقت).
  وهي ليست نفسها [لنموذج القدرات العام](/ar/plugins/architecture#public-capability-model)
  الذي يصف ما الذي تسجله الإضافة (الاستدلال النصي، والكلام، وما إلى ذلك).

## السلوك المملوك لإضافات الموفر

يمكن لإضافات الموفر الآن امتلاك معظم المنطق الخاص بالموفر، بينما يحتفظ OpenClaw
بحلقة الاستدلال العامة.

التقسيم المعتاد:

- `auth[].run` / `auth[].runNonInteractive`: يمتلك الموفر تدفقات
  الإعداد/تسجيل الدخول الخاصة بـ `openclaw onboard` و`openclaw models auth` والإعداد
  بدون تفاعل
- `wizard.setup` / `wizard.modelPicker`: يمتلك الموفر تسميات خيارات المصادقة،
  والأسماء البديلة القديمة، وتلميحات قائمة السماح أثناء الإعداد، ومدخلات الإعداد
  في أدوات اختيار الإعداد/النموذج
- `catalog`: يظهر الموفر في `models.providers`
- `normalizeModelId`: يقوم الموفر بتطبيع معرّفات النماذج القديمة/المعاينة قبل
  البحث أو التحويل إلى الشكل القياسي
- `normalizeTransport`: يقوم الموفر بتطبيع `api` / `baseUrl` الخاصة بعائلة النقل
  قبل التجميع العام للنموذج؛ يفحص OpenClaw الموفر المطابق أولًا،
  ثم إضافات الموفر الأخرى القادرة على الخطافات حتى تقوم إحداها فعليًا بتغيير
  النقل
- `normalizeConfig`: يقوم الموفر بتطبيع إعداد `models.providers.<id>` قبل أن
  يستخدمه وقت التشغيل؛ يفحص OpenClaw الموفر المطابق أولًا، ثم إضافات
  الموفر الأخرى القادرة على الخطافات حتى تقوم إحداها فعليًا بتغيير الإعداد. إذا لم
  تُعِد أي خطافة من الموفر كتابة الإعداد، تستمر المساعدات المجمعة لعائلة Google
  في تطبيع إدخالات موفر Google المدعومة.
- `applyNativeStreamingUsageCompat`: يطبّق الموفر عمليات إعادة كتابة التوافق مع استخدام البث الأصلي المدفوعة بنقطة النهاية لموفري الإعداد
- `resolveConfigApiKey`: يحل الموفر مصادقة علامات البيئة لموفري الإعداد
  من دون فرض تحميل مصادقة وقت التشغيل الكاملة. يحتوي `amazon-bedrock` أيضًا على
  محلّل مدمج لعلامات بيئة AWS هنا، رغم أن مصادقة وقت تشغيل Bedrock تستخدم
  سلسلة AWS SDK الافتراضية.
- `resolveSyntheticAuth`: يمكن للموفر إظهار توفر المصادقة المحلية/المستضافة ذاتيًا أو غيرها
  من المصادقة المعتمدة على الإعداد من دون حفظ أسرار نصية واضحة
- `shouldDeferSyntheticProfileAuth`: يمكن للموفر وسم عناصر
  النمط الاصطناعي المخزّنة كأولوية أدنى من المصادقة المعتمدة على البيئة/الإعداد
- `resolveDynamicModel`: يقبل الموفر معرّفات نماذج غير موجودة بعد في
  الفهرس الثابت المحلي
- `prepareDynamicModel`: يحتاج الموفر إلى تحديث البيانات التعريفية قبل إعادة محاولة
  الحل الديناميكي
- `normalizeResolvedModel`: يحتاج الموفر إلى إعادة كتابة النقل أو عنوان URL الأساسي
- `contributeResolvedModelCompat`: يضيف الموفر علامات توافق لنماذجه
  الخاصة بالمورّد حتى عندما تصل عبر نقل متوافق آخر
- `capabilities`: ينشر الموفر خصائص النصوص الأداتية/الأدوات/عائلة الموفر
- `normalizeToolSchemas`: ينظف الموفر مخططات الأدوات قبل أن يراها
  المشغل المضمن
- `inspectToolSchemas`: يعرض الموفر تحذيرات المخطط الخاصة بالنقل
  بعد التطبيع
- `resolveReasoningOutputMode`: يختار الموفر عقود مخرجات الاستدلال
  الأصلية مقابل الموسومة
- `prepareExtraParams`: يضبط الموفر القيم الافتراضية أو يطبع معلمات الطلب لكل نموذج
- `createStreamFn`: يستبدل الموفر مسار البث العادي بنقل
  مخصص بالكامل
- `wrapStreamFn`: يطبّق الموفر أغلفة توافق الطلب/الترويسات/الجسم/النموذج
- `resolveTransportTurnState`: يوفّر الموفر
  ترويسات أو بيانات تعريف أصلية للنقل لكل دورة
- `resolveWebSocketSessionPolicy`: يوفّر الموفر
  ترويسات جلسة WebSocket الأصلية أو سياسة تهدئة الجلسة
- `createEmbeddingProvider`: يمتلك الموفر سلوك تضمين الذاكرة عندما
  يكون من الأنسب وضعه مع إضافة الموفر بدلًا من لوحة تحويلات التضمين الأساسية
- `formatApiKey`: ينسّق الموفر ملفات تعريف المصادقة المخزّنة إلى
  سلسلة `apiKey` وقت التشغيل المتوقعة من النقل
- `refreshOAuth`: يمتلك الموفر تحديث OAuth عندما لا تكون
  أدوات التحديث المشتركة في `pi-ai` كافية
- `buildAuthDoctorHint`: يضيف الموفر إرشادات الإصلاح عندما يفشل تحديث OAuth
- `matchesContextOverflowError`: يتعرف الموفر على
  أخطاء تجاوز نافذة السياق الخاصة بالموفر والتي قد تفوتها الاستدلالات العامة
- `classifyFailoverReason`: يربط الموفر أخطاء النقل/API الخام الخاصة بالموفر
  بأسباب التحويل الاحتياطي مثل حد المعدل أو الحمل الزائد
- `isCacheTtlEligible`: يقرر الموفر أي معرّفات النماذج الصاعدة تدعم TTL لذاكرة التخزين المؤقت للمطالبة
- `buildMissingAuthMessage`: يستبدل الموفر خطأ مخزن المصادقة العام
  بتلميح استرداد خاص بالموفر
- `suppressBuiltInModel`: يخفي الموفر الصفوف الصاعدة القديمة ويمكنه إرجاع
  خطأ يملكه المورّد عند فشل الحل المباشر
- `augmentModelCatalog`: يضيف الموفر صفوفًا تركيبية/نهائية إلى الفهرس بعد
  الاكتشاف ودمج الإعداد
- `isBinaryThinking`: يمتلك الموفر تجربة استخدام التفكير الثنائي تشغيل/إيقاف
- `supportsXHighThinking`: يضمّن الموفر نماذج محددة في `xhigh`
- `resolveDefaultThinkingLevel`: يمتلك الموفر سياسة `/think` الافتراضية
  لعائلة نموذج
- `applyConfigDefaults`: يطبّق الموفر إعدادات عامة افتراضية خاصة بالموفر
  أثناء تشكيل الإعداد بناءً على وضع المصادقة أو البيئة أو عائلة النموذج
- `isModernModelRef`: يمتلك الموفر مطابقة النموذج المفضّل في التشغيل الحي/اختبارات smoke
- `prepareRuntimeAuth`: يحوّل الموفر بيانات اعتماد مضبوطة إلى
  رمز وقت تشغيل قصير العمر
- `resolveUsageAuth`: يحل الموفر بيانات اعتماد الاستخدام/الحصة لـ `/usage`
  والأسطح المرتبطة بالحالة/التقارير
- `fetchUsageSnapshot`: يمتلك الموفر جلب/تحليل نقطة نهاية الاستخدام بينما
  لا يزال الأساس يمتلك الغلاف الملخّص والتنسيق
- `onModelSelected`: يشغّل الموفر آثارًا جانبية بعد الاختيار مثل
  القياس عن بُعد أو حفظ سجلات الجلسات المملوكة للموفر

الأمثلة المجمعة الحالية:

- `anthropic`: بديل توافق أمامي لـ Claude 4.6، وتلميحات إصلاح المصادقة، وجلب
  نقطة نهاية الاستخدام، وبيانات تعريف TTL/عائلة الموفر لذاكرة التخزين المؤقت، وإعدادات
  عامة افتراضية تراعي المصادقة
- `amazon-bedrock`: مطابقة تجاوز السياق المملوكة للموفر وتصنيف
  سبب التحويل الاحتياطي لأخطاء Bedrock الخاصة بالاختناق/عدم الجاهزية، بالإضافة إلى
  عائلة إعادة التشغيل المشتركة `anthropic-by-model` لحواجز سياسة إعادة التشغيل
  الخاصة بـ Claude فقط على حركة Anthropic
- `anthropic-vertex`: حواجز سياسة إعادة التشغيل الخاصة بـ Claude فقط على
  حركة رسائل Anthropic
- `openrouter`: معرّفات نماذج تمريرية، وأغلفة طلبات، وتلميحات قدرات الموفر،
  وتنظيف توقيع أفكار Gemini على حركة Gemini الوكيلة، وحقن الاستدلال الوكيلي عبر
  عائلة البث `openrouter-thinking`، وتمرير بيانات تعريف التوجيه، وسياسة
  TTL للتخزين المؤقت
- `github-copilot`: الإعداد/تسجيل دخول الجهاز، وبديل توافق أمامي للنموذج،
  وتلميحات نصوص Claude الخاصة بالتفكير، وتبادل رمز وقت التشغيل، وجلب
  نقطة نهاية الاستخدام
- `openai`: بديل توافق أمامي لـ GPT-5.4، وتطبيع مباشر لنقل OpenAI،
  وتلميحات مصادقة مفقودة تراعي Codex، وإخفاء Spark، وصفوف فهرس
  تركيبية لـ OpenAI/Codex، وسياسة التفكير/النموذج الحي، وتطبيع
  الأسماء البديلة لرموز الاستخدام (`input` / `output` وعائلتا `prompt` / `completion`)، و
  عائلة البث المشتركة `openai-responses-defaults` لأغلفة OpenAI/Codex الأصلية،
  وبيانات تعريف عائلة الموفر، وتسجيل موفر توليد الصور المجمّع
  لـ `gpt-image-1`، وتسجيل موفر توليد الفيديو المجمّع
  لـ `sora-2`
- `google` و`google-gemini-cli`: بديل توافق أمامي لـ Gemini 3.1،
  والتحقق الأصلي من إعادة تشغيل Gemini، وتنظيف إعادة التشغيل عند التمهيد، ووضع
  مخرجات الاستدلال الموسوم، ومطابقة النماذج الحديثة، وتسجيل موفر توليد الصور
  المجمّع لنماذج Gemini image-preview، وتسجيل
  موفر توليد الفيديو المجمّع لنماذج Veo؛ كما أن Gemini CLI OAuth
  يمتلك أيضًا تنسيق رمز ملف تعريف المصادقة، وتحليل رمز الاستخدام، وجلب
  نقطة نهاية الحصة لأسطح الاستخدام
- `moonshot`: نقل مشترك، وتطبيع حمولة التفكير مملوك للإضافة
- `kilocode`: نقل مشترك، وترويسات طلبات مملوكة للإضافة، وتطبيع
  حمولة الاستدلال، وتنظيف توقيع أفكار Gemini الوكيلة، وسياسة
  TTL للتخزين المؤقت
- `zai`: بديل توافق أمامي لـ GLM-5، وقيم افتراضية لـ `tool_stream`، وسياسة
  TTL للتخزين المؤقت، وسياسة التفكير الثنائي/النموذج الحي، ومصادقة الاستخدام + جلب الحصة؛
  وتُنشأ معرّفات `glm-5*` غير المعروفة تركيبيًا من القالب المجمّع `glm-4.7`
- `xai`: تطبيع أصلي لنقل Responses، وإعادة كتابة الأسماء البديلة `/fast` لـ
  متغيرات Grok السريعة، والقيمة الافتراضية `tool_stream`، وتنظيف
  مخطط الأدوات/حمولة الاستدلال الخاص بـ xAI، وتسجيل موفر توليد الفيديو
  المجمّع لـ `grok-imagine-video`
- `mistral`: بيانات تعريف القدرات المملوكة للإضافة
- `opencode` و`opencode-go`: بيانات تعريف القدرات المملوكة للإضافة بالإضافة إلى
  تنظيف توقيع أفكار Gemini الوكيلة
- `alibaba`: فهرس توليد فيديو مملوك للإضافة لمراجع Wan المباشرة
  مثل `alibaba/wan2.6-t2v`
- `byteplus`: فهارس مملوكة للإضافة بالإضافة إلى تسجيل موفر توليد الفيديو
  المجمّع لنماذج Seedance لتحويل النص إلى فيديو/الصورة إلى فيديو
- `fal`: تسجيل موفر توليد الفيديو المجمّع لموفري الطرف الثالث المستضافين
  وتسجيل موفر توليد الصور لنماذج صور FLUX بالإضافة إلى تسجيل
  موفر توليد الفيديو المجمّع لنماذج الفيديو المستضافة من أطراف ثالثة
- `cloudflare-ai-gateway` و`huggingface` و`kimi` و`nvidia` و`qianfan` و
  `stepfun` و`synthetic` و`venice` و`vercel-ai-gateway` و`volcengine`:
  فهارس مملوكة للإضافة فقط
- `qwen`: فهارس مملوكة للإضافة للنماذج النصية بالإضافة إلى
  تسجيلات مشتركة لموفري فهم الوسائط وتوليد الفيديو لأسطحه
  متعددة الوسائط؛ يستخدم توليد فيديو Qwen نقاط نهاية فيديو DashScope القياسية
  مع نماذج Wan المجمعة مثل `wan2.6-t2v` و`wan2.7-r2v`
- `runway`: تسجيل موفر توليد فيديو مملوك للإضافة للنماذج الأصلية
  المعتمدة على المهام في Runway مثل `gen4.5`
- `minimax`: فهارس مملوكة للإضافة، وتسجيل موفر توليد الفيديو
  المجمّع لنماذج فيديو Hailuo، وتسجيل موفر توليد الصور المجمّع
  لـ `image-01`، واختيار هجين لسياسة إعادة التشغيل Anthropic/OpenAI،
  ومنطق مصادقة/لقطة الاستخدام
- `together`: فهارس مملوكة للإضافة بالإضافة إلى تسجيل موفر توليد الفيديو
  المجمّع لنماذج فيديو Wan
- `xiaomi`: فهارس مملوكة للإضافة بالإضافة إلى منطق مصادقة/لقطة الاستخدام

تمتلك إضافة `openai` المجمعة الآن كلا معرّفي الموفر: `openai` و
`openai-codex`.

يغطي ذلك الموفرين الذين ما زالوا يناسبون وسائل النقل العادية في OpenClaw. أما الموفر
الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فهو سطح امتداد منفصل وأعمق.

## تدوير مفاتيح API

- يدعم تدويرًا عامًا لمفاتيح الموفر لبعض الموفرين المحددين.
- يمكنك إعداد مفاتيح متعددة عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفري Google، يتم تضمين `GOOGLE_API_KEY` أيضًا كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- تتم إعادة محاولة الطلبات باستخدام المفتاح التالي فقط عند استجابات حد المعدل (مثل
  `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many
concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو
  `workers_ai ... quota limit exceeded` أو رسائل حد الاستخدام الدورية).
- تفشل الأخطاء غير المتعلقة بحد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عندما تفشل كل المفاتيح المرشحة، يتم إرجاع الخطأ النهائي من آخر محاولة.

## الموفرون المدمجون (فهرس pi-ai)

يأتي OpenClaw مع فهرس pi‑ai. لا تتطلب هذه الموفرات أي إعداد
`models.providers`؛ فقط عيّن المصادقة + اختر نموذجًا.

### OpenAI

- الموفر: `openai`
- المصادقة: `OPENAI_API_KEY`
- التدوير الاختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.4` و`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كخيار احتياطي)
- يمكنك التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تفعيل الإحماء المسبق لـ OpenAI Responses WebSocket افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة إلى `openai/*` بالقيمة `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح التبديل المشترك `/fast`
- تنطبق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس
  على الوكلاء العامين المتوافقين مع OpenAI
- تحتفظ المسارات الأصلية لـ OpenAI أيضًا بـ Responses `store` وتلميحات
  Prompt cache وتشكيل الحمولة المتوافق مع استدلال OpenAI؛ أما المسارات الوكيلة فلا
- يتم إخفاء `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن OpenAI API الحي يرفضه؛ ويُعامل Spark على أنه خاص بـ Codex فقط

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- التدوير الاختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2` بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال على النموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك الحركة المرسلة إلى `api.anthropic.com` بالمصادقة عبر مفتاح API أو OAuth؛ ويحوّل OpenClaw ذلك إلى Anthropic `service_tier` (`auto` مقابل `standard_only`)
- ملاحظة حول Anthropic: أخبرنا فريق Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذا يعامل OpenClaw إعادة استخدام Claude CLI واستعمال `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل رمز إعداد Anthropic متاحًا كمسار رموز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- الموفر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مثال على النموذج: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE كخيار احتياطي)
- يمكنك التجاوز لكل نموذج عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` على طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق ترويسات الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة Codex الأصلية إلى
  `chatgpt.com/backend-api`، وليس على الوكلاء العامين المتوافقين مع OpenAI
- يشارك مفتاح التبديل `/fast` وإعداد `params.fastMode` نفسيهما مع `openai/*` المباشر؛ ويحوّل OpenClaw ذلك إلى `service_tier=priority`
- يظل `openai-codex/gpt-5.3-codex-spark` متاحًا عندما يعرضه فهرس OAuth الخاص بـ Codex؛ ويتوقف ذلك على الاستحقاق
- يحتفظ `openai-codex/gpt-5.4` بالقيم الأصلية `contextWindow = 1050000` وبالحد الافتراضي وقت التشغيل `contextTokens = 272000`؛ ويمكنك تجاوز الحد وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة حول السياسة: OAuth الخاص بـ OpenAI Codex مدعوم صراحةً للأدوات/التدفقات الخارجية مثل OpenClaw.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### خيارات مستضافة أخرى بنمط الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفر Qwen Cloud بالإضافة إلى ربط نقاط نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو نقاط نهاية API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفر وقت تشغيل Zen: `opencode`
- موفر وقت تشغيل Go: `opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفر: `google`
- المصادقة: `GEMINI_API_KEY`
- التدوير الاختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2` وخيار `GOOGLE_API_KEY` الاحتياطي و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) لتمرير
  معرّف `cachedContents/...` أصلي خاص بالموفر؛ وتظهر إصابات ذاكرة Gemini المؤقتة في OpenClaw على أنها `cacheRead`

### Google Vertex وGemini CLI

- الموفران: `google-vertex` و`google-gemini-cli`
- المصادقة: يستخدم Vertex ‏gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تنبيه: إن تكامل Gemini CLI OAuth في OpenClaw غير رسمي. أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من أطراف ثالثة. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من إضافة `google` المجمعة.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التفعيل: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: **لا** تقوم بلصق معرّف عميل أو سر في `openclaw.json`. يخزن تدفق تسجيل دخول CLI
    الرموز في ملفات تعريف المصادقة على مضيف البوابة.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فعيّن `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف البوابة.
  - يتم تحليل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام احتياطيًا إلى
    `stats`، مع تطبيع `stats.cached` إلى OpenClaw `cacheRead`.

### Z.AI (GLM)

- الموفر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على النموذج: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء البديلة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` نقطة نهاية Z.AI المطابقة تلقائيًا؛ بينما يفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- مثال على النموذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على النموذج: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن الفهرس الاحتياطي الثابت بـ `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` الحي توسيع
  فهرس وقت التشغيل أكثر.
- إن التوجيه الصاعد الدقيق خلف `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مشفّرًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### إضافات موفري الخدمة المجمعة الأخرى

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- مثال على النموذج: `openrouter/auto`
- يطبّق OpenClaw ترويسات إسناد التطبيق الموثقة لدى OpenRouter فقط عندما
  يكون الطلب موجّهًا فعلًا إلى `openrouter.ai`
- كما تُقيد علامات `cache_control` الخاصة بـ Anthropic والمميزة لـ OpenRouter
  على مسارات OpenRouter المتحقق منها، وليس على أي عناوين URL وكيلة عشوائية
- يظل OpenRouter على المسار الوكيل المتوافق مع OpenAI، لذا فإن
  تشكيل الطلب الأصلي الخاص بـ OpenAI فقط (`serviceTier` وResponses `store` و
  تلميحات prompt-cache وحمولات التوافق مع استدلال OpenAI) لا يتم تمريره
- تحتفظ مراجع OpenRouter المبنية على Gemini فقط بمسار تنظيف توقيع أفكار Gemini الوكيل؛ وتظل إعادة التحقق الأصلية وإعادة الكتابة عند التمهيد الخاصة بـ Gemini معطلة
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- مثال على النموذج: `kilocode/kilo/auto`
- تحتفظ مراجع Kilo المبنية على Gemini بمسار تنظيف توقيع أفكار Gemini الوكيل نفسه؛ وتتخطى تلميحات `kilocode/kilo/auto` وغيرها من التلميحات غير المدعومة للاستدلال الوكيل حقن الاستدلال الوكيل
- MiniMax: ‏`minimax` (مفتاح API) و`minimax-portal` (OAuth)
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`
- مثال على النموذج: `minimax/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7`
- تؤدي عملية الإعداد/الإعداد عبر مفتاح API لـ MiniMax إلى كتابة تعريفات صريحة لنماذج M2.7 مع
  `input: ["text", "image"]`؛ بينما يحتفظ فهرس الموفر المجمّع بمراجع الدردشة
  كنص فقط إلى أن يتم تشكيل إعداد ذلك الموفر
- Moonshot: ‏`moonshot` (`MOONSHOT_API_KEY`)
- مثال على النموذج: `moonshot/kimi-k2.5`
- Kimi Coding: ‏`kimi` (`KIMI_API_KEY` أو `KIMICODE_API_KEY`)
- مثال على النموذج: `kimi/kimi-code`
- Qianfan: ‏`qianfan` (`QIANFAN_API_KEY`)
- مثال على النموذج: `qianfan/deepseek-v3.2`
- Qwen Cloud: ‏`qwen` (`QWEN_API_KEY` أو `MODELSTUDIO_API_KEY` أو `DASHSCOPE_API_KEY`)
- مثال على النموذج: `qwen/qwen3.5-plus`
- NVIDIA: ‏`nvidia` (`NVIDIA_API_KEY`)
- مثال على النموذج: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: ‏`stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- أمثلة على النماذج: `stepfun/step-3.5-flash` و`stepfun-plan/step-3.5-flash-2603`
- Together: ‏`together` (`TOGETHER_API_KEY`)
- مثال على النموذج: `together/moonshotai/Kimi-K2.5`
- Venice: ‏`venice` (`VENICE_API_KEY`)
- Xiaomi: ‏`xiaomi` (`XIAOMI_API_KEY`)
- مثال على النموذج: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: ‏`vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: ‏`huggingface` (`HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)
- Cloudflare AI Gateway: ‏`cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: ‏`volcengine` (`VOLCANO_ENGINE_API_KEY`)
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- BytePlus: ‏`byteplus` (`BYTEPLUS_API_KEY`)
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- xAI: ‏`xai` (`XAI_API_KEY`)
  - تستخدم طلبات xAI الأصلية المجمعة مسار xAI Responses
  - يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و
    `grok-4` و`grok-4-0709` إلى متغيراتها `*-fast`
  - تكون `tool_stream` مفعلة افتراضيًا؛ عيّن
    `agents.defaults.models["xai/<model>"].params.tool_stream` إلى `false` من أجل
    تعطيلها
- Mistral: ‏`mistral` (`MISTRAL_API_KEY`)
- مثال على النموذج: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: ‏`groq` (`GROQ_API_KEY`)
- Cerebras: ‏`cerebras` (`CEREBRAS_API_KEY`)
  - تستخدم نماذج GLM على Cerebras المعرفين `zai-glm-4.7` و`zai-glm-4.6`.
  - عنوان URL الأساسي المتوافق مع OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: ‏`github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- مثال على نموذج Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`؛ CLI: `openclaw onboard --auth-choice huggingface-api-key`. راجع [Hugging Face (Inference)](/ar/providers/huggingface).

## الموفّرون عبر `models.providers` (عنوان URL مخصص/أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفرين **مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تنشر العديد من إضافات الموفر المجمعة أدناه بالفعل فهرسًا افتراضيًا.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي الافتراضي أو الترويسات أو قائمة النماذج.

### Moonshot AI (Kimi)

يأتي Moonshot كإضافة موفر مجمعة. استخدم الموفر المدمج بشكل
افتراضي، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- الموفر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال على النموذج: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نماذج Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

يستخدم Kimi Coding نقطة نهاية Moonshot AI المتوافقة مع Anthropic:

- الموفر: `kimi`
- المصادقة: `KIMI_API_KEY`
- مثال على النموذج: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

يظل `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يوفر Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى داخل الصين.

- الموفر: `volcengine` (للبرمجة: `volcengine-plan`)
- المصادقة: `VOLCANO_ENGINE_API_KEY`
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

يكون الإعداد الافتراضي أثناء onboarding هو سطح البرمجة، لكن فهرس `volcengine/*`
العام يُسجّل في الوقت نفسه.

في أدوات اختيار النماذج أثناء onboarding/الضبط، يفضّل خيار مصادقة Volcengine
كلًا من صفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن تلك النماذج محمّلة بعد،
فسيعود OpenClaw إلى الفهرس غير المفلتر بدلًا من عرض أداة اختيار
فارغة مقيّدة بالموفر.

النماذج المتاحة:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

نماذج البرمجة (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (الدولي)

يوفر BytePlus ARK الوصول إلى النماذج نفسها التي يوفرها Volcano Engine للمستخدمين الدوليين.

- الموفر: `byteplus` (للبرمجة: `byteplus-plan`)
- المصادقة: `BYTEPLUS_API_KEY`
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

يكون الإعداد الافتراضي أثناء onboarding هو سطح البرمجة، لكن فهرس `byteplus/*`
العام يُسجّل في الوقت نفسه.

في أدوات اختيار النماذج أثناء onboarding/الضبط، يفضّل خيار مصادقة BytePlus
كلًا من صفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن تلك النماذج محمّلة بعد،
فسيعود OpenClaw إلى الفهرس غير المفلتر بدلًا من عرض أداة اختيار
فارغة مقيّدة بالموفر.

النماذج المتاحة:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

نماذج البرمجة (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

يوفر Synthetic نماذج متوافقة مع Anthropic خلف الموفر `synthetic`:

- الموفر: `synthetic`
- المصادقة: `SYNTHETIC_API_KEY`
- مثال على النموذج: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

يتم إعداد MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعداد.

على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تقم بتعيينه صراحةً، كما أن `/fast on` يعيد كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم القدرات المملوكة للإضافة:

- تظل الإعدادات الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- يكون توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- يكون فهم الصور هو `MiniMax-VL-01` المملوك للإضافة على مساري مصادقة MiniMax
- يظل البحث على الويب على معرّف الموفر `minimax`

### Ollama

يأتي Ollama كإضافة موفر مجمعة ويستخدم API الأصلي الخاص بـ Ollama:

- الموفر: `ollama`
- المصادقة: غير مطلوبة (خادم محلي)
- مثال على النموذج: `ollama/llama3.3`
- التثبيت: [https://ollama.com/download](https://ollama.com/download)

```bash
# ثبّت Ollama، ثم اسحب نموذجًا:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

يتم اكتشاف Ollama محليًا على `http://127.0.0.1:11434` عندما تقوم بالاشتراك
باستخدام `OLLAMA_API_KEY`، وتضيف إضافة الموفر المجمعة Ollama مباشرةً إلى
`openclaw onboard` وأداة اختيار النموذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على onboarding ووضع السحابة/المحلي والإعداد المخصص.

### vLLM

يأتي vLLM كإضافة موفر مجمعة للخوادم المحلية/المستضافة ذاتيًا المتوافقة مع OpenAI:

- الموفر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للتفاصيل.

### SGLang

يأتي SGLang كإضافة موفر مجمعة لخوادم OpenAI-compatible
المستضافة ذاتيًا والسريعة:

- الموفر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم عيّن نموذجًا (استبدله بأحد المعرّفات التي يُرجعها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للتفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وغير ذلك)

مثال (متوافق مع OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

ملاحظات:

- بالنسبة إلى الموفرين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: تعيين قيم صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ يكون مضيفه ليس `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء الموفّر 400 الخاصة بأدوار `developer` غير المدعومة.
- تتخطى أيضًا المسارات الوكيلة المتوافقة مع OpenAI التشكيل الأصلي الخاص بـ OpenAI فقط:
  فلا يوجد `service_tier`، ولا Responses `store`، ولا تلميحات prompt-cache، ولا
  تشكيل حمولة التوافق مع استدلال OpenAI، ولا ترويسات إسناد OpenClaw
  المخفية.
- إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- من باب الأمان، ما زال يتم تجاوز `compat.supportsDeveloperRole: true` الصريح على نقاط نهاية `openai-completions` غير الأصلية.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للحصول على أمثلة إعداد كاملة.

## ذو صلة

- [Models](/ar/concepts/models) — إعداد النموذج والأسماء البديلة
- [Model Failover](/ar/concepts/model-failover) — سلاسل التحويل الاحتياطي وسلوك إعادة المحاولة
- [Configuration Reference](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح إعداد النموذج
- [Providers](/ar/providers) — أدلة الإعداد لكل موفر

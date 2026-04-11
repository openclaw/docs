---
read_when:
    - أنت بحاجة إلى مرجع لإعداد النماذج لكل موفّر على حدة
    - أنت تريد إعدادات تهيئة نموذجية أو أوامر تهيئة عبر CLI لموفّري النماذج
summary: نظرة عامة على موفّر النماذج مع إعدادات تهيئة نموذجية + تدفقات CLI
title: موفّرو النماذج
x-i18n:
    generated_at: "2026-04-11T02:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 910ea7895e74c03910757d9d3e02825754b779b204eca7275b28422647ed0151
    source_path: concepts/model-providers.md
    workflow: 15
---

# موفّرو النماذج

تغطي هذه الصفحة **موفّري LLM/النماذج** (وليس قنوات الدردشة مثل WhatsApp/Telegram).
للاطلاع على قواعد اختيار النموذج، راجع [/concepts/models](/ar/concepts/models).

## القواعد السريعة

- تستخدم مراجع النماذج الصيغة `provider/model` (مثال: `opencode/claude-opus-4-6`).
- إذا قمت بتعيين `agents.defaults.models`، فسيصبح قائمة السماح.
- أدوات CLI المساعدة: `openclaw onboard` و`openclaw models list` و`openclaw models set <provider/model>`.
- قواعد وقت التشغيل الاحتياطية، وفحوصات التهدئة، واستمرارية تجاوزات الجلسة
  موثقة في [/concepts/model-failover](/ar/concepts/model-failover).
- `models.providers.*.models[].contextWindow` هي بيانات تعريف النموذج الأصلية؛
  و`models.providers.*.models[].contextTokens` هو الحد الفعلي في وقت التشغيل.
- يمكن لإضافات الموفّرين حقن فهارس النماذج عبر `registerProvider({ catalog })`؛
  ويقوم OpenClaw بدمج هذا الناتج في `models.providers` قبل كتابة
  `models.json`.
- يمكن لبيانات تعريف الموفّر التصريحية إعلان `providerAuthEnvVars` و
  `providerAuthAliases` بحيث لا تحتاج فحوصات المصادقة العامة المعتمدة على
  متغيرات البيئة ومتغيرات الموفّر إلى تحميل وقت تشغيل الإضافة. وأصبحت خريطة
  متغيرات البيئة الأساسية المتبقية الآن مخصصة فقط للموفّرين غير القائمين على
  الإضافات/الأساسيين وبعض حالات الأولوية العامة القليلة مثل إعداد Anthropic
  الذي يفضّل مفتاح API أولًا.
- يمكن لإضافات الموفّرين أيضًا امتلاك سلوك وقت تشغيل الموفّر عبر
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
- ملاحظة: إن `capabilities` الخاصة بوقت تشغيل الموفّر هي بيانات تعريف مشتركة
  للمشغّل (عائلة الموفّر، وخصائص النصوص وأدواتها، وتلميحات النقل/التخزين
  المؤقت). وهي ليست نفسها [نموذج الإمكانات العام](/ar/plugins/architecture#public-capability-model)
  الذي يصف ما الذي تسجّله الإضافة (استدلال نصي، كلام، إلخ).
- يتم إقران الموفّر المضمّن `codex` مع حزمة عامل Codex المضمّنة.
  استخدم `codex/gpt-*` عندما تريد تسجيل دخول مملوكًا لـ Codex، واكتشاف
  النماذج، واستئناف السلاسل أصلًا، والتنفيذ عبر خادم التطبيق. أما مراجع
  `openai/gpt-*` العادية فتستمر في استخدام موفّر OpenAI ونقل الموفّر العادي في OpenClaw.
  ويمكن لعمليات النشر التي تستخدم Codex فقط تعطيل الرجوع الاحتياطي التلقائي
  إلى PI باستخدام
  `agents.defaults.embeddedHarness.fallback: "none"`؛ راجع
  [Codex Harness](/ar/plugins/codex-harness).

## السلوك المملوك لإضافة الموفّر

يمكن لإضافات الموفّرين الآن امتلاك معظم المنطق الخاص بكل موفّر بينما يحتفظ OpenClaw
بحلقة الاستدلال العامة.

التقسيم المعتاد:

- `auth[].run` / `auth[].runNonInteractive`: يمتلك الموفّر تدفقات
  الإعداد/تسجيل الدخول الخاصة بـ `openclaw onboard` و`openclaw models auth` و
  الإعداد غير التفاعلي
- `wizard.setup` / `wizard.modelPicker`: يمتلك الموفّر تسميات خيارات
  المصادقة، والأسماء المستعارة القديمة، وتلميحات قائمة السماح الخاصة بالإعداد، وإدخالات
  الإعداد في منتقيات الإعداد/النموذج
- `catalog`: يظهر الموفّر في `models.providers`
- `normalizeModelId`: يطبع الموفّر معرّفات النماذج القديمة/التجريبية
  قبل البحث أو التحويل إلى الصيغة القياسية
- `normalizeTransport`: يطبع الموفّر `api` / `baseUrl` لعائلة النقل
  قبل التجميع العام للنموذج؛ ويتحقق OpenClaw من الموفّر المطابق أولًا،
  ثم من إضافات الموفّرين الأخرى القادرة على تنفيذ الخطاف حتى تقوم إحداها
  فعليًا بتغيير النقل
- `normalizeConfig`: يطبع الموفّر إعدادات `models.providers.<id>` قبل أن
  يستخدمها وقت التشغيل؛ ويتحقق OpenClaw من الموفّر المطابق أولًا، ثم من إضافات
  الموفّرين الأخرى القادرة على تنفيذ الخطاف حتى تقوم إحداها فعليًا بتغيير الإعدادات. وإذا لم
  يُعِد أي خطاف موفّر كتابة الإعدادات، فستستمر أدوات Google-family
  المضمّنة في تطبيع إدخالات موفّري Google المدعومة.
- `applyNativeStreamingUsageCompat`: يطبّق الموفّر إعادة كتابة توافق استخدام البث الأصلية المعتمدة على نقطة النهاية لموفّري الإعدادات
- `resolveConfigApiKey`: يحل الموفّر مصادقة علامة البيئة لموفّري الإعدادات
  من دون فرض تحميل مصادقة وقت التشغيل الكاملة. ويحتوي `amazon-bedrock` أيضًا على
  محلّل مضمّن لعلامات بيئة AWS هنا، رغم أن مصادقة وقت تشغيل Bedrock تستخدم
  سلسلة AWS SDK الافتراضية.
- `resolveSyntheticAuth`: يمكن للموفّر إتاحة توفر المصادقة المحلية/المستضافة ذاتيًا أو
  المصادقة الأخرى المعتمدة على الإعدادات من دون تخزين أسرار نصية صريحة
- `shouldDeferSyntheticProfileAuth`: يمكن للموفّر وسم العناصر النائبة
  لملفات المصادقة الاصطناعية المخزنة على أنها أقل أولوية من المصادقة المعتمدة
  على البيئة/الإعدادات
- `resolveDynamicModel`: يقبل الموفّر معرّفات نماذج غير موجودة بعد في
  الفهرس المحلي الثابت
- `prepareDynamicModel`: يحتاج الموفّر إلى تحديث للبيانات التعريفية قبل إعادة
  محاولة الحل الديناميكي
- `normalizeResolvedModel`: يحتاج الموفّر إلى إعادة كتابة النقل أو عنوان URL الأساسي
- `contributeResolvedModelCompat`: يساهم الموفّر بعلامات توافق لنماذج
  المورّد الخاصة به حتى عندما تصل عبر نقل متوافق آخر
- `capabilities`: ينشر الموفّر خصائص النصوص/الأدوات/عائلة الموفّر
- `normalizeToolSchemas`: ينظّف الموفّر مخططات الأدوات قبل أن يراها
  المشغّل المضمّن
- `inspectToolSchemas`: يعرض الموفّر تحذيرات المخطط الخاصة بالنقل
  بعد التطبيع
- `resolveReasoningOutputMode`: يختار الموفّر بين عقود مخرجات الاستدلال
  الأصلية أو الموسومة
- `prepareExtraParams`: يضبط الموفّر افتراضيًا أو يطبّع معاملات الطلب
  لكل نموذج
- `createStreamFn`: يستبدل الموفّر مسار البث العادي بنقل
  مخصص بالكامل
- `wrapStreamFn`: يطبّق الموفّر أغلفة توافق
  رؤوس/نص الطلب/النموذج
- `resolveTransportTurnState`: يوفّر الموفّر
  رؤوس النقل الأصلية أو البيانات التعريفية لكل دورة
- `resolveWebSocketSessionPolicy`: يوفّر الموفّر
  رؤوس جلسة WebSocket الأصلية أو سياسة تهدئة الجلسة
- `createEmbeddingProvider`: يمتلك الموفّر سلوك تضمين الذاكرة عندما
  يكون من الأنسب أن يكون ضمن إضافة الموفّر بدلًا من لوحة التحويل الأساسية للتضمين
- `formatApiKey`: ينسّق الموفّر ملفات المصادقة المخزنة إلى
  السلسلة `apiKey` المتوقعة من النقل في وقت التشغيل
- `refreshOAuth`: يمتلك الموفّر تحديث OAuth عندما لا تكون
  أدوات التحديث المشتركة `pi-ai` كافية
- `buildAuthDoctorHint`: يضيف الموفّر إرشادات إصلاح عندما يفشل
  تحديث OAuth
- `matchesContextOverflowError`: يتعرف الموفّر على
  أخطاء تجاوز نافذة السياق الخاصة بالموفّر التي قد لا ترصدها الاستدلالات العامة
- `classifyFailoverReason`: يربط الموفّر أخطاء النقل/API الخام
  الخاصة به بأسباب التحويل الاحتياطي مثل حد المعدل أو الحمل الزائد
- `isCacheTtlEligible`: يقرر الموفّر أي معرّفات النماذج الصادرة تدعم مدة بقاء التخزين المؤقت للموجّه
- `buildMissingAuthMessage`: يستبدل الموفّر خطأ مخزن المصادقة العام
  بتلميح استرداد خاص بالموفّر
- `suppressBuiltInModel`: يخفي الموفّر الصفوف الصادرة القديمة ويمكنه
  إرجاع خطأ مملوك للمورّد عند فشل الحل المباشر
- `augmentModelCatalog`: يضيف الموفّر صفوف فهرس اصطناعية/نهائية بعد
  الاكتشاف ودمج الإعدادات
- `isBinaryThinking`: يمتلك الموفّر تجربة الاستخدام الخاصة بالتفكير الثنائي تشغيل/إيقاف
- `supportsXHighThinking`: يفعّل الموفّر `xhigh`
  لنماذج محددة
- `resolveDefaultThinkingLevel`: يمتلك الموفّر سياسة `/think`
  الافتراضية لعائلة نماذج
- `applyConfigDefaults`: يطبّق الموفّر القيم الافتراضية العامة الخاصة به
  أثناء إنشاء الإعدادات بناءً على وضع المصادقة أو البيئة أو عائلة النموذج
- `isModernModelRef`: يمتلك الموفّر مطابقة النماذج المفضلة
  للاختبارات الحية/اختبارات الدخان
- `prepareRuntimeAuth`: يحوّل الموفّر بيانات الاعتماد المهيأة إلى
  رمز وقت تشغيل قصير العمر
- `resolveUsageAuth`: يحل الموفّر بيانات اعتماد الاستخدام/الحصة لـ `/usage`
  والأسطح ذات الصلة بالحالة/التقارير
- `fetchUsageSnapshot`: يمتلك الموفّر جلب/تحليل نقطة نهاية الاستخدام بينما
  لا تزال النواة تمتلك غلاف الملخص والتنسيق
- `onModelSelected`: يشغّل الموفّر تأثيرات لاحقة للاختيار مثل
  القياس عن بُعد أو حفظ الجلسة المملوك للموفّر

الأمثلة المضمّنة الحالية:

- `anthropic`: الرجوع الاحتياطي للتوافق المستقبلي مع Claude 4.6، وتلميحات إصلاح المصادقة، وجلب
  نقطة نهاية الاستخدام، وبيانات تعريف مدة بقاء التخزين المؤقت/عائلة الموفّر،
  والقيم الافتراضية العامة للإعدادات المرتبطة بالمصادقة
- `amazon-bedrock`: مطابقة تجاوز نافذة السياق المملوكة للموفّر وتصنيف
  أسباب التحويل الاحتياطي لأخطاء Bedrock الخاصة بالاختناق/عدم الجاهزية، بالإضافة إلى
  عائلة إعادة التشغيل المشتركة `anthropic-by-model` لضوابط سياسة إعادة التشغيل
  الخاصة بـ Claude فقط على حركة Anthropic
- `anthropic-vertex`: ضوابط سياسة إعادة التشغيل الخاصة بـ Claude فقط على
  حركة رسائل Anthropic
- `openrouter`: معرّفات نماذج تمريرية، وأغلفة الطلبات، وتلميحات إمكانات
  الموفّر، وتنقية توقيع أفكار Gemini على حركة Gemini الوكيلة، وحقن
  الاستدلال الوكيل عبر عائلة البث `openrouter-thinking`، وتمرير
  بيانات تعريف التوجيه، وسياسة مدة بقاء التخزين المؤقت
- `github-copilot`: التهيئة/تسجيل الدخول عبر الجهاز، والرجوع الاحتياطي للنماذج
  للتوافق المستقبلي، وتلميحات نصوص Claude الخاصة بالتفكير، وتبادل الرموز في وقت التشغيل،
  وجلب نقطة نهاية الاستخدام
- `openai`: الرجوع الاحتياطي للتوافق المستقبلي مع GPT-5.4، وتطبيع
  النقل المباشر لـ OpenAI، وتلميحات غياب المصادقة الواعية بـ Codex، وكبت Spark،
  وصفوف فهرس OpenAI/Codex الاصطناعية، وسياسة التفكير/النموذج الحي، وتطبيع
  الأسماء المستعارة لرموز الاستخدام (`input` / `output` و`prompt` / `completion`)، وعائلة
  البث المشتركة `openai-responses-defaults` لأغلفة OpenAI/Codex الأصلية،
  وبيانات تعريف عائلة الموفّر، وتسجيل موفّر توليد الصور المضمّن
  لـ `gpt-image-1`، وتسجيل موفّر توليد الفيديو المضمّن
  لـ `sora-2`
- `google` و`google-gemini-cli`: الرجوع الاحتياطي للتوافق المستقبلي مع Gemini 3.1،
  والتحقق الأصلي من إعادة تشغيل Gemini، وتنقية إعادة التشغيل عند الإقلاع، ووضع
  مخرجات الاستدلال الموسوم، ومطابقة النماذج الحديثة، وتسجيل موفّر توليد الصور المضمّن
  لنماذج Gemini image-preview، وتسجيل
  موفّر توليد الفيديو المضمّن لنماذج Veo؛ كما أن OAuth الخاص بـ Gemini CLI
  يمتلك أيضًا تنسيق رموز ملف المصادقة، وتحليل رموز الاستخدام، وجلب
  نقطة نهاية الحصة لأسطح الاستخدام
- `moonshot`: نقل مشترك، وتطبيع حمولة التفكير مملوك للإضافة
- `kilocode`: نقل مشترك، ورؤوس طلبات مملوكة للإضافة، وتطبيع حمولة الاستدلال،
  وتنقية توقيع أفكار Gemini الوكيل، وسياسة مدة بقاء التخزين المؤقت
- `zai`: الرجوع الاحتياطي للتوافق المستقبلي مع GLM-5، والقيم الافتراضية لـ `tool_stream`، وسياسة مدة بقاء التخزين المؤقت،
  وسياسة التفكير الثنائي/النموذج الحي، ومصادقة الاستخدام + جلب الحصة؛
  وتُولَّد معرّفات `glm-5*` غير المعروفة اصطناعيًا من القالب المضمّن `glm-4.7`
- `xai`: تطبيع النقل الأصلي لـ Responses، وإعادة كتابة الاسم المستعار `/fast` من أجل
  متغيرات Grok السريعة، و`tool_stream` الافتراضي، وتنظيف مخطط الأدوات /
  حمولة الاستدلال الخاص بـ xAI، وتسجيل موفّر توليد الفيديو المضمّن
  لـ `grok-imagine-video`
- `mistral`: بيانات تعريف إمكانات مملوكة للإضافة
- `opencode` و`opencode-go`: بيانات تعريف إمكانات مملوكة للإضافة بالإضافة إلى
  تنقية توقيع أفكار Gemini الوكيل
- `alibaba`: فهرس توليد الفيديو مملوك للإضافة لمراجع نماذج Wan المباشرة
  مثل `alibaba/wan2.6-t2v`
- `byteplus`: فهارس مملوكة للإضافة بالإضافة إلى تسجيل موفّر توليد الفيديو المضمّن
  لنماذج Seedance لتحويل النص إلى فيديو/الصورة إلى فيديو
- `fal`: تسجيل موفّر توليد الفيديو المضمّن لنماذج الطرف الثالث المستضافة
  وتسجيل موفّر توليد الصور المضمّن لنماذج صور FLUX بالإضافة إلى تسجيل
  موفّر توليد الفيديو المضمّن لنماذج الفيديو المستضافة من طرف ثالث
- `cloudflare-ai-gateway` و`huggingface` و`kimi` و`nvidia` و`qianfan` و
  `stepfun` و`synthetic` و`venice` و`vercel-ai-gateway` و`volcengine`:
  فهارس مملوكة للإضافة فقط
- `qwen`: فهارس مملوكة للإضافة للنماذج النصية بالإضافة إلى تسجيلات
  موفّر فهم الوسائط وتوليد الفيديو المشتركة لأسطحه متعددة الوسائط؛ ويستخدم
  توليد الفيديو في Qwen نقاط نهاية الفيديو القياسية في DashScope مع
  نماذج Wan المضمّنة مثل `wan2.6-t2v` و`wan2.7-r2v`
- `runway`: تسجيل موفّر توليد الفيديو مملوك للإضافة لنماذج Runway
  الأصلية المعتمدة على المهام مثل `gen4.5`
- `minimax`: فهارس مملوكة للإضافة، وتسجيل موفّر توليد الفيديو المضمّن
  لنماذج فيديو Hailuo، وتسجيل موفّر توليد الصور المضمّن
  لـ `image-01`، واختيار سياسة إعادة تشغيل هجينة بين Anthropic/OpenAI،
  ومنطق مصادقة/لقطة الاستخدام
- `together`: فهارس مملوكة للإضافة بالإضافة إلى تسجيل موفّر توليد الفيديو المضمّن
  لنماذج فيديو Wan
- `xiaomi`: فهارس مملوكة للإضافة بالإضافة إلى منطق مصادقة/لقطة الاستخدام

تمتلك الإضافة المضمّنة `openai` الآن معرّفي الموفّر كليهما: `openai` و
`openai-codex`.

وهذا يغطي الموفّرين الذين ما زالوا ينسجمون مع وسائل النقل العادية في OpenClaw. أما الموفّر
الذي يحتاج إلى منفّذ طلبات مخصص بالكامل فهو سطح توسيع منفصل وأعمق.

## تدوير مفاتيح API

- يدعم التدوير العام للمفاتيح لموفّرين محددين.
- قم بتهيئة عدة مفاتيح عبر:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (تجاوز حي واحد، أعلى أولوية)
  - `<PROVIDER>_API_KEYS` (قائمة مفصولة بفواصل أو فواصل منقوطة)
  - `<PROVIDER>_API_KEY` (المفتاح الأساسي)
  - `<PROVIDER>_API_KEY_*` (قائمة مرقمة، مثل `<PROVIDER>_API_KEY_1`)
- بالنسبة إلى موفّري Google، يتم أيضًا تضمين `GOOGLE_API_KEY` كخيار احتياطي.
- يحافظ ترتيب اختيار المفاتيح على الأولوية ويزيل القيم المكررة.
- تتم إعادة محاولة الطلبات بالمفتاح التالي فقط عند استجابات حد المعدل (على
  سبيل المثال `429` أو `rate_limit` أو `quota` أو `resource exhausted` أو `Too many
concurrent requests` أو `ThrottlingException` أو `concurrency limit reached` أو
  `workers_ai ... quota limit exceeded` أو رسائل حد الاستخدام الدورية).
- تفشل الإخفاقات غير المرتبطة بحد المعدل فورًا؛ ولا تتم محاولة تدوير المفاتيح.
- عند فشل جميع المفاتيح المرشحة، يُعاد الخطأ النهائي من آخر محاولة.

## الموفّرون المضمّنون (فهرس pi-ai)

يشحن OpenClaw مع فهرس pi‑ai. لا تتطلب هذه الموفّرات أي إعداد
`models.providers`؛ فقط اضبط المصادقة + اختر نموذجًا.

### OpenAI

- الموفّر: `openai`
- المصادقة: `OPENAI_API_KEY`
- تدوير اختياري: `OPENAI_API_KEYS` و`OPENAI_API_KEY_1` و`OPENAI_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_OPENAI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `openai/gpt-5.4` و`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- يمكنك التجاوز لكل نموذج عبر `agents.defaults.models["openai/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم تمكين الإحماء المسبق لـ OpenAI Responses WebSocket افتراضيًا عبر `params.openaiWsWarmup` (`true`/`false`)
- يمكن تمكين المعالجة ذات الأولوية في OpenAI عبر `agents.defaults.models["openai/<model>"].params.serviceTier`
- يربط `/fast` و`params.fastMode` طلبات Responses المباشرة `openai/*` بـ `service_tier=priority` على `api.openai.com`
- استخدم `params.serviceTier` عندما تريد مستوى صريحًا بدلًا من مفتاح التبديل المشترك `/fast`
- تُطبَّق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة OpenAI الأصلية إلى `api.openai.com`، وليس على
  الوكلاء العامة المتوافقة مع OpenAI
- تحتفظ المسارات الأصلية لـ OpenAI أيضًا بـ `store` الخاصة بـ Responses، وتلميحات التخزين المؤقت للموجّه،
  وتشكيل حمولة توافق الاستدلال في OpenAI؛ أما مسارات الوكيل فلا تحتفظ بذلك
- يتم كبت `openai/gpt-5.3-codex-spark` عمدًا في OpenClaw لأن واجهة OpenAI API الحية ترفضه؛ ويتم التعامل مع Spark على أنه خاص بـ Codex فقط

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- الموفّر: `anthropic`
- المصادقة: `ANTHROPIC_API_KEY`
- تدوير اختياري: `ANTHROPIC_API_KEYS` و`ANTHROPIC_API_KEY_1` و`ANTHROPIC_API_KEY_2`، بالإضافة إلى `OPENCLAW_LIVE_ANTHROPIC_KEY` (تجاوز واحد)
- مثال على النموذج: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- تدعم طلبات Anthropic العامة المباشرة أيضًا مفتاح التبديل المشترك `/fast` و`params.fastMode`، بما في ذلك الحركة المرسلة إلى `api.anthropic.com` والمصادق عليها عبر مفتاح API أو OAuth؛ ويحوّل OpenClaw ذلك إلى `service_tier` في Anthropic (`auto` مقابل `standard_only`)
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مجددًا، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما مسموحان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- لا يزال رمز إعداد Anthropic متاحًا كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- الموفّر: `openai-codex`
- المصادقة: OAuth (ChatGPT)
- مثال على النموذج: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` أو `openclaw models auth login --provider openai-codex`
- النقل الافتراضي هو `auto` (WebSocket أولًا، ثم SSE احتياطيًا)
- يمكنك التجاوز لكل نموذج عبر `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"` أو `"websocket"` أو `"auto"`)
- يتم أيضًا تمرير `params.serviceTier` في طلبات Codex Responses الأصلية (`chatgpt.com/backend-api`)
- تُرفق رؤوس الإسناد المخفية الخاصة بـ OpenClaw (`originator` و`version` و
  `User-Agent`) فقط على حركة Codex الأصلية إلى
  `chatgpt.com/backend-api`، وليس على الوكلاء العامة المتوافقة مع OpenAI
- يشترك في نفس مفتاح التبديل `/fast` وإعداد `params.fastMode` مثل `openai/*` المباشر؛ ويحوّل OpenClaw ذلك إلى `service_tier=priority`
- يظل `openai-codex/gpt-5.3-codex-spark` متاحًا عندما يكشف فهرس OAuth الخاص بـ Codex عنه؛ وذلك يعتمد على الاستحقاق
- يحتفظ `openai-codex/gpt-5.4` بقيمة أصلية `contextWindow = 1050000` وقيمة افتراضية في وقت التشغيل `contextTokens = 272000`؛ ويمكنك تجاوز الحد في وقت التشغيل عبر `models.providers.openai-codex.models[].contextTokens`
- ملاحظة السياسة: دعم OAuth الخاص بـ OpenAI Codex مدعوم صراحةً للأدوات/سير العمل الخارجية مثل OpenClaw.

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

### خيارات أخرى مستضافة بأسلوب الاشتراك

- [Qwen Cloud](/ar/providers/qwen): سطح موفّر Qwen Cloud بالإضافة إلى تعيين نقاط نهاية Alibaba DashScope وCoding Plan
- [MiniMax](/ar/providers/minimax): وصول MiniMax Coding Plan عبر OAuth أو مفتاح API
- [GLM Models](/ar/providers/glm): نقاط نهاية Z.AI Coding Plan أو API العامة

### OpenCode

- المصادقة: `OPENCODE_API_KEY` (أو `OPENCODE_ZEN_API_KEY`)
- موفّر وقت تشغيل Zen: `opencode`
- موفّر وقت تشغيل Go: `opencode-go`
- أمثلة على النماذج: `opencode/claude-opus-4-6` و`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` أو `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (مفتاح API)

- الموفّر: `google`
- المصادقة: `GEMINI_API_KEY`
- تدوير اختياري: `GEMINI_API_KEYS` و`GEMINI_API_KEY_1` و`GEMINI_API_KEY_2` وخيار `GOOGLE_API_KEY` الاحتياطي و`OPENCLAW_LIVE_GEMINI_KEY` (تجاوز واحد)
- أمثلة على النماذج: `google/gemini-3.1-pro-preview` و`google/gemini-3-flash-preview`
- التوافق: يتم تطبيع إعداد OpenClaw القديم الذي يستخدم `google/gemini-3.1-flash-preview` إلى `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- تقبل عمليات Gemini المباشرة أيضًا `agents.defaults.models["google/<model>"].params.cachedContent`
  (أو `cached_content` القديم) لتمرير
  مقبض `cachedContents/...` أصلي خاص بالموفّر؛ وتظهر إصابات ذاكرة Gemini المؤقتة كقيمة OpenClaw `cacheRead`

### Google Vertex وGemini CLI

- الموفّرات: `google-vertex` و`google-gemini-cli`
- المصادقة: يستخدم Vertex بيانات اعتماد gcloud ADC؛ ويستخدم Gemini CLI تدفق OAuth الخاص به
- تحذير: إن Gemini CLI OAuth في OpenClaw تكامل غير رسمي. وقد أبلغ بعض المستخدمين عن قيود على حسابات Google بعد استخدام عملاء من جهات خارجية. راجع شروط Google واستخدم حسابًا غير حرج إذا اخترت المتابعة.
- يتم شحن Gemini CLI OAuth كجزء من الإضافة المضمّنة `google`.
  - ثبّت Gemini CLI أولًا:
    - `brew install gemini-cli`
    - أو `npm install -g @google/gemini-cli`
  - التمكين: `openclaw plugins enable google`
  - تسجيل الدخول: `openclaw models auth login --provider google-gemini-cli --set-default`
  - النموذج الافتراضي: `google-gemini-cli/gemini-3-flash-preview`
  - ملاحظة: **لا** تقم بلصق معرّف عميل أو سر في `openclaw.json`. يخزّن تدفق تسجيل الدخول عبر CLI
    الرموز في ملفات المصادقة على مضيف البوابة.
  - إذا فشلت الطلبات بعد تسجيل الدخول، فاضبط `GOOGLE_CLOUD_PROJECT` أو `GOOGLE_CLOUD_PROJECT_ID` على مضيف البوابة.
  - يتم تحليل ردود Gemini CLI بصيغة JSON من `response`؛ ويعود الاستخدام إلى
    `stats`، مع تطبيع `stats.cached` إلى OpenClaw `cacheRead`.

### Z.AI (GLM)

- الموفّر: `zai`
- المصادقة: `ZAI_API_KEY`
- مثال على النموذج: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - الأسماء المستعارة: يتم تطبيع `z.ai/*` و`z-ai/*` إلى `zai/*`
  - يكتشف `zai-api-key` تلقائيًا نقطة نهاية Z.AI المطابقة؛ بينما يفرض `zai-coding-global` و`zai-coding-cn` و`zai-global` و`zai-cn` سطحًا محددًا

### Vercel AI Gateway

- الموفّر: `vercel-ai-gateway`
- المصادقة: `AI_GATEWAY_API_KEY`
- مثال على النموذج: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- الموفّر: `kilocode`
- المصادقة: `KILOCODE_API_KEY`
- مثال على النموذج: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- عنوان URL الأساسي: `https://api.kilo.ai/api/gateway/`
- يشحن فهرس احتياطي ثابت `kilocode/kilo/auto`؛ ويمكن لاكتشاف
  `https://api.kilo.ai/api/gateway/models` الحي توسيع فهرس
  وقت التشغيل بشكل أكبر.
- إن التوجيه الصادر الدقيق وراء `kilocode/kilo/auto` مملوك لـ Kilo Gateway،
  وليس مضمّنًا بشكل ثابت في OpenClaw.

راجع [/providers/kilocode](/ar/providers/kilocode) للحصول على تفاصيل الإعداد.

### إضافات موفّرين مضمّنة أخرى

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- مثال على النموذج: `openrouter/auto`
- يطبّق OpenClaw رؤوس إسناد التطبيق الموثقة من OpenRouter فقط عندما
  يستهدف الطلب فعليًا `openrouter.ai`
- وبالمثل، لا تُفعّل علامات `cache_control` الخاصة بـ Anthropic والمميزة لـ OpenRouter إلا على
  مسارات OpenRouter المتحقق منها، وليس على عناوين URL الوكيلة الاعتباطية
- يظل OpenRouter على مسار الوكيل ذي النمط المتوافق مع OpenAI، لذا فإن
  تشكيل الطلب الأصلي الخاص بـ OpenAI فقط (`serviceTier` و`store` في Responses،
  وتلميحات التخزين المؤقت للموجّه، وحمولات توافق الاستدلال في OpenAI) لا يتم تمريره
- تحتفظ مراجع OpenRouter المعتمدة على Gemini فقط بمسار تنقية توقيع أفكار Gemini الوكيل؛
  أما التحقق الأصلي من إعادة تشغيل Gemini وإعادة الكتابة عند الإقلاع فيبقيان معطلين
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- مثال على النموذج: `kilocode/kilo/auto`
- تحتفظ مراجع Kilo المعتمدة على Gemini بنفس مسار
  تنقية توقيع أفكار Gemini الوكيل؛ بينما تتخطى `kilocode/kilo/auto` وغيرها من
  التلميحات الوكيلة غير الداعمة للاستدلال حقن الاستدلال الوكيل
- MiniMax: `minimax` (مفتاح API) و`minimax-portal` (OAuth)
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو `MINIMAX_API_KEY` لـ `minimax-portal`
- مثال على النموذج: `minimax/MiniMax-M2.7` أو `minimax-portal/MiniMax-M2.7`
- تكتب عملية تهيئة MiniMax/إعداد مفتاح API تعريفات صريحة لنموذج M2.7 مع
  `input: ["text", "image"]`؛ بينما يبقي فهرس الموفّر المضمّن مراجع الدردشة
  نصية فقط إلى أن تتحقق إعدادات ذلك الموفّر
- Moonshot: `moonshot` (`MOONSHOT_API_KEY`)
- مثال على النموذج: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi` (`KIMI_API_KEY` أو `KIMICODE_API_KEY`)
- مثال على النموذج: `kimi/kimi-code`
- Qianfan: `qianfan` (`QIANFAN_API_KEY`)
- مثال على النموذج: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen` (`QWEN_API_KEY` أو `MODELSTUDIO_API_KEY` أو `DASHSCOPE_API_KEY`)
- مثال على النموذج: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia` (`NVIDIA_API_KEY`)
- مثال على النموذج: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan` (`STEPFUN_API_KEY`)
- أمثلة على النماذج: `stepfun/step-3.5-flash` و`stepfun-plan/step-3.5-flash-2603`
- Together: `together` (`TOGETHER_API_KEY`)
- مثال على النموذج: `together/moonshotai/Kimi-K2.5`
- Venice: `venice` (`VENICE_API_KEY`)
- Xiaomi: `xiaomi` (`XIAOMI_API_KEY`)
- مثال على النموذج: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway` (`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` أو `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway` (`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine` (`VOLCANO_ENGINE_API_KEY`)
- مثال على النموذج: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus` (`BYTEPLUS_API_KEY`)
- مثال على النموذج: `byteplus-plan/ark-code-latest`
- xAI: `xai` (`XAI_API_KEY`)
  - تستخدم طلبات xAI الأصلية المضمّنة مسار xAI Responses
  - يعيد `/fast` أو `params.fastMode: true` كتابة `grok-3` و`grok-3-mini` و
    `grok-4` و`grok-4-0709` إلى المتغيرات الخاصة بها `*-fast`
  - يتم تفعيل `tool_stream` افتراضيًا؛ اضبط
    `agents.defaults.models["xai/<model>"].params.tool_stream` إلى `false` من أجل
    تعطيله
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- مثال على النموذج: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - تستخدم نماذج GLM على Cerebras المعرّفات `zai-glm-4.7` و`zai-glm-4.6`.
  - عنوان URL الأساسي المتوافق مع OpenAI: `https://api.cerebras.ai/v1`.
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- مثال على نموذج Hugging Face Inference: `huggingface/deepseek-ai/DeepSeek-R1`؛ CLI: `openclaw onboard --auth-choice huggingface-api-key`. راجع [Hugging Face (Inference)](/ar/providers/huggingface).

## الموفّرون عبر `models.providers` (مخصص/عنوان URL أساسي)

استخدم `models.providers` (أو `models.json`) لإضافة موفّرين **مخصصين** أو
وكلاء متوافقين مع OpenAI/Anthropic.

تقوم العديد من إضافات الموفّرين المضمّنة أدناه بالفعل بنشر فهرس افتراضي.
استخدم إدخالات `models.providers.<id>` الصريحة فقط عندما تريد تجاوز
عنوان URL الأساسي أو الرؤوس أو قائمة النماذج الافتراضية.

### Moonshot AI (Kimi)

يأتي Moonshot كإضافة موفّر مضمّنة. استخدم الموفّر المضمّن
افتراضيًا، وأضف إدخال `models.providers.moonshot` صريحًا فقط عندما
تحتاج إلى تجاوز عنوان URL الأساسي أو بيانات تعريف النموذج:

- الموفّر: `moonshot`
- المصادقة: `MOONSHOT_API_KEY`
- مثال على النموذج: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` أو `openclaw onboard --auth-choice moonshot-api-key-cn`

معرّفات نموذج Kimi K2:

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

- الموفّر: `kimi`
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

لا يزال `kimi/k2p5` القديم مقبولًا كمعرّف نموذج للتوافق.

### Volcano Engine (Doubao)

يتيح Volcano Engine (火山引擎) الوصول إلى Doubao ونماذج أخرى في الصين.

- الموفّر: `volcengine` (الترميز: `volcengine-plan`)
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

يُفَعَّل الإعداد الأولي افتراضيًا على سطح البرمجة، ولكن يتم في الوقت نفسه
تسجيل فهرس `volcengine/*` العام.

في منتقيات الإعداد الأولي/تهيئة النموذج، يفضّل خيار مصادقة Volcengine كلاً من
الصفوف `volcengine/*` و`volcengine-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من إظهار منتقٍ فارغ
مقيّد بنطاق الموفّر.

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

يوفّر BytePlus ARK الوصول إلى نفس النماذج التي يوفّرها Volcano Engine للمستخدمين الدوليين.

- الموفّر: `byteplus` (البرمجة: `byteplus-plan`)
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

يُفَعَّل الإعداد الأولي افتراضيًا على سطح البرمجة، ولكن يتم في الوقت نفسه
تسجيل فهرس `byteplus/*` العام.

في منتقيات الإعداد الأولي/تهيئة النموذج، يفضّل خيار مصادقة BytePlus كلاً من
الصفوف `byteplus/*` و`byteplus-plan/*`. وإذا لم تكن هذه النماذج محمّلة بعد،
فإن OpenClaw يعود إلى الفهرس غير المصفّى بدلًا من إظهار منتقٍ فارغ
مقيّد بنطاق الموفّر.

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

يقدّم Synthetic نماذج متوافقة مع Anthropic خلف الموفّر `synthetic`:

- الموفّر: `synthetic`
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

يتم تهيئة MiniMax عبر `models.providers` لأنه يستخدم نقاط نهاية مخصصة:

- MiniMax OAuth (عالمي): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (الصين): `--auth-choice minimax-cn-oauth`
- مفتاح API لـ MiniMax (عالمي): `--auth-choice minimax-global-api`
- مفتاح API لـ MiniMax (الصين): `--auth-choice minimax-cn-api`
- المصادقة: `MINIMAX_API_KEY` لـ `minimax`؛ و`MINIMAX_OAUTH_TOKEN` أو
  `MINIMAX_API_KEY` لـ `minimax-portal`

راجع [/providers/minimax](/ar/providers/minimax) للحصول على تفاصيل الإعداد وخيارات النماذج ومقتطفات الإعدادات.

على مسار البث المتوافق مع Anthropic في MiniMax، يعطّل OpenClaw التفكير
افتراضيًا ما لم تقم بتعيينه صراحةً، كما أن `/fast on` يعيد كتابة
`MiniMax-M2.7` إلى `MiniMax-M2.7-highspeed`.

تقسيم الإمكانات المملوك للإضافة:

- تظل القيم الافتراضية للنص/الدردشة على `minimax/MiniMax-M2.7`
- توليد الصور هو `minimax/image-01` أو `minimax-portal/image-01`
- فهم الصور هو `MiniMax-VL-01` مملوك للإضافة على مساري مصادقة MiniMax كليهما
- يظل البحث على الويب على معرّف الموفّر `minimax`

### Ollama

يأتي Ollama كإضافة موفّر مضمّنة ويستخدم API الأصلية الخاصة بـ Ollama:

- الموفّر: `ollama`
- المصادقة: لا شيء مطلوب (خادم محلي)
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

يتم اكتشاف Ollama محليًا عند `http://127.0.0.1:11434` عندما تختار الاشتراك عبر
`OLLAMA_API_KEY`، وتضيف إضافة الموفّر المضمّنة Ollama مباشرةً إلى
`openclaw onboard` ومنتقي النماذج. راجع [/providers/ollama](/ar/providers/ollama)
للاطلاع على الإعداد الأولي، ووضع السحابة/الوضع المحلي، والإعدادات المخصصة.

### vLLM

يأتي vLLM كإضافة موفّر مضمّنة للخوادم المحلية/المستضافة ذاتيًا المتوافقة مع OpenAI
:

- الموفّر: `vllm`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:8000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا يفرض المصادقة):

```bash
export VLLM_API_KEY="vllm-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

راجع [/providers/vllm](/ar/providers/vllm) للحصول على التفاصيل.

### SGLang

يأتي SGLang كإضافة موفّر مضمّنة للخوادم الذاتية الاستضافة السريعة
المتوافقة مع OpenAI:

- الموفّر: `sglang`
- المصادقة: اختيارية (بحسب خادمك)
- عنوان URL الأساسي الافتراضي: `http://127.0.0.1:30000/v1`

للاشتراك في الاكتشاف التلقائي محليًا (أي قيمة تعمل إذا كان خادمك لا
يفرض المصادقة):

```bash
export SGLANG_API_KEY="sglang-local"
```

ثم اضبط نموذجًا (استبدله بأحد المعرّفات التي يعيدها `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

راجع [/providers/sglang](/ar/providers/sglang) للحصول على التفاصيل.

### الوكلاء المحليون (LM Studio وvLLM وLiteLLM وما إلى ذلك)

مثال (متوافق مع OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "محلي" } },
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
            name: "النموذج المحلي",
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

- بالنسبة إلى الموفّرين المخصصين، تكون `reasoning` و`input` و`cost` و`contextWindow` و`maxTokens` اختيارية.
  وعند حذفها، يستخدم OpenClaw القيم الافتراضية التالية:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- الموصى به: تعيين قيم صريحة تطابق حدود الوكيل/النموذج لديك.
- بالنسبة إلى `api: "openai-completions"` على نقاط النهاية غير الأصلية (أي `baseUrl` غير فارغ يكون مضيفه غير `api.openai.com`)، يفرض OpenClaw القيمة `compat.supportsDeveloperRole: false` لتجنب أخطاء 400 من الموفّر عند عدم دعم أدوار `developer`.
- كما تتخطى المسارات الوكيلة المتوافقة مع OpenAI تشكيل الطلب الأصلي الخاص بـ OpenAI فقط:
  لا `service_tier`، ولا `store` في Responses، ولا تلميحات للتخزين المؤقت للموجّه، ولا
  تشكيل لحمولة توافق الاستدلال في OpenAI، ولا رؤوس إسناد مخفية خاصة بـ OpenClaw.
- إذا كان `baseUrl` فارغًا/محذوفًا، يحتفظ OpenClaw بسلوك OpenAI الافتراضي (الذي يُحل إلى `api.openai.com`).
- من أجل الأمان، تتم أيضًا إعادة تجاوز القيمة الصريحة `compat.supportsDeveloperRole: true` على نقاط النهاية غير الأصلية `openai-completions`.

## أمثلة CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

راجع أيضًا: [/gateway/configuration](/ar/gateway/configuration) للاطلاع على أمثلة إعدادات كاملة.

## ذو صلة

- [النماذج](/ar/concepts/models) — إعدادات النماذج والأسماء المستعارة
- [التحويل الاحتياطي للنموذج](/ar/concepts/model-failover) — سلاسل التراجع وسلوك إعادة المحاولة
- [مرجع الإعدادات](/ar/gateway/configuration-reference#agent-defaults) — مفاتيح إعدادات النموذج
- [الموفّرون](/ar/providers) — أدلة الإعداد الخاصة بكل موفّر

---
read_when:
    - أنت بصدد إنشاء Plugin جديد لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة محوّل ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لإنشاء Plugin لقناة مراسلة في OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-07-16T14:43:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c6398dd0b4789b9f4aaf7ad2d1786a7e6388cb8fbb74e8ecaecae7ac0a5eb90
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يبني هذا الدليل Plugin قناة يربط OpenClaw بمنصة
مراسلة: أمان الرسائل المباشرة، والإقران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  هل Plugins ‏OpenClaw جديدة عليك؟ اقرأ [دليل البدء](/ar/plugins/building-plugins)
  أولًا للتعرّف على بنية الحزمة وإعداد البيان.
</Info>

## ما يملكه Plugin الخاص بك

لا تنفّذ Plugins القنوات أدوات الإرسال/التحرير/التفاعل؛ إذ توفّر النواة أداة
`message` مشتركة واحدة. يملك Plugin الخاص بك ما يلي:

- **الإعداد** - تحديد الحساب ومعالج الإعداد
- **الأمان** - سياسة الرسائل المباشرة وقوائم السماح
- **الإقران** - مسار الموافقة على الرسائل المباشرة
- **قواعد الجلسة** - كيفية تعيين معرّفات المحادثات الخاصة بموفّر معيّن إلى
  المحادثات الأساسية ومعرّفات سلاسل المحادثات والبدائل الأصلية
- **الصادر** - إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **تسلسل المحادثات** - كيفية تنظيم الردود في سلاسل
- **مؤشر الكتابة لـ Heartbeat** - إشارات اختيارية للكتابة/الانشغال لأهداف تسليم Heartbeat

تملك النواة أداة الرسائل المشتركة، وربط المطالبات، والشكل الخارجي لمفتاح الجلسة،
ومسك دفاتر `:thread:` العام، والتوجيه.

## محوّل الرسائل

اكشف محوّل `message` يتضمن `defineChannelMessageAdapter` من
`openclaw/plugin-sdk/channel-outbound`. لا تعلن إلا إمكانات الإرسال النهائي الدائمة
التي تدعمها وسيلة النقل الأصلية فعليًا، مع إسنادها إلى اختبار عقد
يثبت الأثر الجانبي الأصلي وإيصال الاستلام المُعاد. وجّه عمليات إرسال النصوص/الوسائط
إلى وظائف النقل نفسها التي يستخدمها محوّل `outbound` القديم. للاطلاع على
عقد API الكامل، ومصفوفة الإمكانات، وقواعد الإيصالات، وإنهاء المعاينة المباشرة،
وسياسة إقرار الاستلام، والاختبارات، وجدول الترحيل، راجع
[API الصادر للقناة](/ar/plugins/sdk-channel-outbound).

إذا كان محوّل `outbound` الحالي يتضمن بالفعل وسائل الإرسال الصحيحة
والبيانات الوصفية للإمكانات، فاشتق محوّل `message` باستخدام
`createChannelMessageAdapterFromOutbound(...)` بدلًا من كتابة جسر آخر
يدويًا. تعيد عمليات إرسال المحوّل قيم `MessageReceipt`. بالنسبة إلى المعرّفات القديمة، اشتقها
باستخدام `listMessageReceiptPlatformIds(...)` أو
`resolveMessageReceiptPrimaryId(...)` بدلًا من الاحتفاظ بحقول `messageIds`
متوازية.

أعلن إمكانات البث المباشر والإنهاء بدقة - تستخدم النواة هذه الإمكانات لتحديد
ما يمكن للقناة فعله، ويُعدّ التباين بين السلوك المعلن والفعلي
فشلًا في اختبار العقد:

| السطح                                 | القيم                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `message.live.capabilities`           | `draftPreview`، `previewFinalization`، `progressUpdates`، `nativeStreaming`، `quietFinalization` |
| `message.live.finalizer.capabilities` | `finalEdit`، `normalFallback`، `discardPending`، `previewReceipt`، `retainOnAmbiguousFailure`    |

ينبغي للقنوات التي تنهي معاينة مسودة في موضعها أن توجّه منطق وقت التشغيل
عبر `defineFinalizableLivePreviewAdapter(...)` إلى جانب
`deliverWithFinalizableLivePreviewAdapter(...)`، وأن تُبقي الإمكانات المعلنة
مدعومة باختبارات `verifyChannelMessageLiveCapabilityAdapterProofs(...)`
و`verifyChannelMessageLiveFinalizerProofs(...)` كي لا ينحرف سلوك المعاينة الأصلية،
والتقدم، والتحرير، والبديل/الاحتفاظ، والتنظيف، والإيصال
بصمت.

ينبغي لمستقبِلات الوارد التي تؤجل إقرارات المنصة أن تعلن
`message.receive.defaultAckPolicy` و`supportedAckPolicies` بدلًا من إخفاء
توقيت الإقرار في حالة محلية للمراقب. غطِّ كل سياسة معلنة باستخدام
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

تظل أدوات الرد المساعدة القديمة مثل `dispatchInboundReplyWithBase` و
`recordInboundSessionAndDispatchReply` متاحة لأغراض توافق
أدوات التوجيه. لا تستخدمها في تعليمات القنوات البرمجية الجديدة؛ ابدأ بمحوّل `message`
والإيصالات وأدوات دورة حياة الاستقبال/الإرسال المساعدة في
`openclaw/plugin-sdk/channel-outbound` بدلًا منها.

### دخول الوارد (تجريبي)

يمكن للقنوات التي تُرحّل تفويض الوارد استخدام المسار الفرعي التجريبي
`openclaw/plugin-sdk/channel-ingress-runtime` من مسارات الاستقبال في وقت التشغيل.
وهو يقبل حقائق المنصة وقوائم السماح الأولية وواصفات المسارات وحقائق الأوامر
وإعداد مجموعة الوصول، ثم يعيد إسقاطات المرسل/المسار/الأمر/التنشيط
بالإضافة إلى مخطط الدخول المرتب، بينما يظل البحث في المنصة والآثار
الجانبية داخل Plugin. احتفظ بتسوية الهوية الخاصة بـ Plugin في
الواصف الذي تمرره إلى المحلّل؛ ولا تسلسل قيم المطابقة الأولية من
الحالة أو القرار الناتج. راجع
[API دخول القناة](/ar/plugins/sdk-channel-ingress) للتعرّف على تصميم API،
وحدود الملكية، وتوقعات الاختبار.

### مؤشرات الكتابة

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاكشف
`heartbeat.sendTyping(...)` في Plugin القناة. تستدعيها النواة باستخدام
هدف تسليم Heartbeat المحدد قبل بدء تشغيل نموذج Heartbeat،
وتستخدم دورة الحياة المشتركة لإبقاء مؤشر الكتابة فعالًا وتنظيفه. أضف
`heartbeat.clearTyping(...)` عندما تحتاج المنصة إلى إشارة توقف صريحة.

### معاملات مصدر الوسائط

إذا كانت قناتك تضيف معاملات لأداة الرسائل تحمل مصادر وسائط، فاكشف
أسماء تلك المعاملات من خلال `plugin.actions.describeMessageTool(...).mediaSourceParams`.
تستخدم النواة تلك القائمة الصريحة لتسوية مسارات صندوق الحماية وسياسة
الوصول إلى الوسائط الصادرة، بحيث لا تحتاج Plugins إلى حالات خاصة في
النواة المشتركة لمعاملات الصور الرمزية أو المرفقات أو صور الغلاف الخاصة بالموفّر.

فضّل خريطة مفهرسة حسب الإجراء مثل `{ "set-profile": ["avatarUrl", "avatarPath"] }`
كي لا ترث الإجراءات غير المرتبطة معاملات الوسائط لإجراء آخر. وتظل المصفوفة المسطحة
صالحة للمعاملات التي تُشارك عمدًا بين كل إجراء مكشوف.

يمكن للقنوات التي يجب أن تكشف عنوان URL عامًا مؤقتًا لجلب الوسائط
من جانب المنصة استخدام `createHostedOutboundMediaStore(...)` من
`openclaw/plugin-sdk/outbound-media` مع مخازن حالة Plugin. احتفظ بتحليل
مسارات المنصة وإنفاذ الرمز المميز داخل Plugin القناة؛ إذ لا يملك المساعد المشترك
إلا تحميل الوسائط، والبيانات الوصفية لانتهاء الصلاحية، وصفوف الأجزاء، والتنظيف.

### تشكيل الحمولة الأصلية

إذا كانت قناتك تحتاج إلى تشكيل خاص بالموفّر لـ `message(action="send")`،
ففضّل `actions.prepareSendPayload(...)`. ضع البطاقات أو الكتل أو التضمينات
الأصلية أو غيرها من البيانات الدائمة ضمن `payload.channelData.<channel>`، ودع النواة ترسل
عبر محوّل الصادر/الرسائل. استخدم `actions.handleAction(...)` للإرسال
فقط كبديل توافق للحمولات التي لا يمكن تسلسلها وإعادة محاولة إرسالها.

### قواعد محادثة الجلسة

إذا كانت منصتك تخزّن نطاقًا إضافيًا داخل معرّفات المحادثات، فاحتفظ بتحليل ذلك
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذه هي
نقطة الربط الأساسية لتعيين `rawId` إلى معرّف المحادثة الأساسي، ومعرّف
سلسلة محادثة اختياري، و`baseConversationId` صريح، وأي
`parentConversationCandidates`. عندما تعيد `parentConversationCandidates`،
رتّبها من الأصل الأضيق إلى المحادثة الأوسع/الأساسية.

يُعد `messaging.resolveParentConversationCandidates(...)` بديل توافق
مهملًا لـ Plugins التي لا تحتاج إلا إلى بدائل أصلية فوق
المعرّف العام/الأولي. إذا وُجدت نقطتا الربط، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا، ولا
تلجأ إلى `resolveParentConversationCandidates(...)` إلا عندما تحذفها نقطة الربط
الأساسية.

يمكن لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل بدء تشغيل سجل القناة
أن تكشف ملف `session-key-api.ts` في المستوى الأعلى مع تصدير
`resolveSessionConversation(...)` مطابق (راجع Plugins ‏Feishu وTelegram).
لا تستخدم النواة هذا السطح الآمن للتهيئة الأولية إلا عندما لا يكون سجل Plugin
الخاص بوقت التشغيل متاحًا بعد.

استخدم `openclaw/plugin-sdk/channel-route` عندما تحتاج تعليمات Plugin البرمجية إلى تسوية
الحقول الشبيهة بالمسارات، أو مقارنة سلسلة محادثة فرعية بمسارها الأصلي، أو إنشاء
مفتاح ثابت لإزالة التكرار من `{ channel, to, accountId, threadId }`. تسوّي الأداة المساعدة
معرّفات سلاسل المحادثات الرقمية بالطريقة نفسها التي تتبعها النواة، لذا فضّلها على
مقارنات `String(threadId)` المخصصة. ينبغي لـ Plugins ذات قواعد الأهداف الخاصة
بالموفّر أن تكشف `messaging.resolveOutboundSessionRoute(...)` كي تحصل النواة على
هوية الجلسة وسلسلة المحادثة الأصلية للموفّر دون محوّلات تحليل.

### دعم ربط المحادثات على نطاق الحساب

عيّن `conversationBindings.supportsCurrentConversationBinding` عندما تدعم القناة
عمليات ربط المحادثة الحالية العامة. يعيّن `createChatChannelPlugin(...)`
هذه الإمكانية الثابتة إلى `true` افتراضيًا.

إذا اختلف الدعم بحسب الحساب المضبوط، فنفّذ أيضًا
`conversationBindings.isCurrentConversationBindingSupported({ accountId })`.
لا تقيّم النواة نقطة الربط المتزامنة هذه إلا بعد تمكين الإمكانية الثابتة.
تؤدي إعادة `false` إلى جعل عمليات الإمكانية العامة للمحادثة الحالية،
والربط، والبحث، والسرد، والتحديث، وإلغاء الربط غير متاحة لذلك الحساب.
يؤدي حذف نقطة الربط إلى تطبيق الإمكانية الثابتة على كل حساب.

استخرج الإجابة من إعداد الحساب المحمّل مسبقًا أو حالة وقت التشغيل. لا تضبط
نقطة الربط هذه إلا عمليات ربط المحادثة الحالية العامة؛ فهي لا تستبدل
قواعد الربط المضبوطة أو توجيه الجلسات الذي يملكه Plugin. ينبغي أن
تغطي اختبارات العقد حسابًا واحدًا مدعومًا وآخر غير مدعوم على الأقل عبر
عقد `ChannelPlugin["conversationBindings"]` الذي تصدّره
`openclaw/plugin-sdk/channel-core`.

## الموافقات وإمكانات القناة

لا تحتاج معظم Plugins القنوات إلى تعليمات برمجية خاصة بالموافقات. تملك النواة
`/approve` للمحادثة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم البديل العام.
أزيل `ChannelPlugin.approvals`؛ ضع حقائق تسليم الموافقة/الأصلية/العرض/المصادقة
في كائن `approvalCapability` واحد بدلًا منه. يقتصر `plugin.auth` على تسجيل الدخول/الخروج
فقط - لم تعد النواة تقرأ نقاط ربط مصادقة الموافقات من ذلك الكائن.

استخدم `approvalCapability.delivery` فقط لتوجيه الموافقات الأصلي أو منع
البديل، و`approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى
حمولات موافقة مخصصة بدلًا من العارض المشترك.

### مصادقة الموافقات

- `approvalCapability.authorizeActorAction` و
  `approvalCapability.getActionAvailabilityState` هما نقطة الربط الأساسية
  لمصادقة الموافقات.
- استخدم `getActionAvailabilityState` لتوافر مصادقة الموافقات في المحادثة نفسها.
  أبقِ المعتمدين المضبوطين متاحين لـ `/approve` حتى عند تعطيل التسليم
  الأصلي؛ واستخدم حالة سطح البدء الأصلي لإرشادات التسليم/الإعداد
  بدلًا من ذلك.
- إذا كانت قناتك تكشف موافقات تنفيذ أصلية، فاستخدم
  `approvalCapability.getExecInitiatingSurfaceState` لحالة
  سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقات في المحادثة نفسها.
  تستخدم النواة نقطة الربط الخاصة بالتنفيذ لتمييز `enabled` عن
  `disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات التنفيذ
  الأصلية، وتضمين القناة في إرشادات بديل العميل الأصلي.
  يملأ `createApproverRestrictedNativeApprovalCapability(...)` ذلك في
  الحالة الشائعة.
- إذا كانت القناة تستطيع استنتاج هويات مستقرة شبيهة بالمالك في الرسائل المباشرة من الإعداد الحالي،
  فاستخدم `createResolvedApproverActionAuthAdapter` من
  `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` في المحادثة نفسها
  دون إضافة منطق خاص بالموافقات إلى النواة.
- إذا كانت مصادقة الموافقات المخصصة لا تسمح عمدًا إلا بالبديل في المحادثة نفسها، فأعد
  `markImplicitSameChatApprovalAuthorization({ authorized: true })` من
  `openclaw/plugin-sdk/approval-auth-runtime`؛ وإلا تعامل النواة
  النتيجة على أنها تفويض صريح للمعتَمِد.
- إذا قامت معاودة اتصال أصلية تملكها القناة بحسم الموافقات مباشرةً، فاستخدم
  `isImplicitSameChatApprovalAuthorization(...)` قبل الحسم حتى يظل
  البديل الضمني يمر عبر تفويض الفاعل المعتاد للقناة.

### دورة حياة الحمولة وإرشادات الإعداد

- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو
  `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة،
  مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة
  قبل التسليم.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة
  أن يشرح رد مسار التعطيل مفاتيح الإعداد الدقيقة اللازمة لتمكين
  موافقات التنفيذ الأصلية. تتلقى نقطة الربط `{ channel, channelLabel, accountId }`؛
  وينبغي للقنوات ذات الحسابات المسماة عرض مسارات على نطاق الحساب مثل
  `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية
  للمستوى الأعلى.
- استخدم `approvalCapability.describePluginApprovalSetup` عندما تكون إرشادات فشل موافقة
  Plugin آمنة للعرض عند حالات فشل عدم وجود مسار وانتهاء مهلة موافقات Plugin.
  لا يستنتج `createApproverRestrictedNativeApprovalCapability(...)`
  ذلك من `describeExecApprovalSetup`؛ مرّر المساعد نفسه صراحةً
  فقط عندما تستخدم موافقات Plugin وموافقات التنفيذ الإعداد الأصلي نفسه فعلًا.

### تسليم الموافقات الأصلي

إذا كانت القناة تحتاج إلى تسليم موافقات أصلي، فاجعل تعليماتها البرمجية مركزة على
تسوية الهدف بالإضافة إلى حقائق النقل/العرض. استخدم
`createChannelExecApprovalProfile`، و`createChannelNativeOriginTargetResolver`،
و`createChannelApproverDmTargetResolver`، و
`createApproverRestrictedNativeApprovalCapability` من
`openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف
`approvalCapability.nativeRuntime`، ويُفضّل أن يكون ذلك عبر
`createChannelApprovalNativeRuntimeAdapter(...)` أو
`createLazyChannelApprovalNativeRuntimeAdapter(...)`، كي تتمكن النواة من تجميع
المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، وانتهاء الصلاحية، والاشتراك في
Gateway، وإشعارات التوجيه إلى مكان آخر.

ينقسم `nativeRuntime` إلى عدة نقاط ربط أصغر:

- `availability` - ما إذا كان الحساب مُهيّأً وما إذا كان ينبغي التعامل مع الطلب
- `presentation` - تعيين نموذج عرض الموافقة المشترك إلى
  حمولات أصلية معلّقة/محسومة/منتهية الصلاحية أو إجراءات نهائية
- `transport` - إعداد الأهداف وإرسال/تحديث/حذف رسائل الموافقة
  الأصلية
- `interactions` - خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار
  أو التفاعلات الأصلية، بالإضافة إلى خطاف `cancelDelivered` اختياري. نفّذ
  `cancelDelivered` عندما تسجّل `deliverPending` حالة داخل العملية أو حالة
  دائمة (مثل مخزن أهداف التفاعلات)، بحيث يمكن تحرير تلك الحالة إذا ألغى
  إيقاف المعالج التسليم قبل تشغيل `bindPending`، أو عندما
  لا تُرجع `bindPending` أي مقبض
- `observe` - خطافات اختيارية لتشخيصات التسليم

مساعدات الموافقة الأخرى:

- استخدم `createNativeApprovalChannelRouteGates` من
  `openclaw/plugin-sdk/approval-native-runtime` عندما تدعم القناة كلاً من
  التسليم الأصلي الناشئ من الجلسة وأهداف إعادة توجيه الموافقات الصريحة. يوحّد
  المساعد اختيار إعدادات الموافقة، والتعامل مع `mode`، ومرشحات الوكيل/الجلسة،
  وربط الحساب، ومطابقة هدف الجلسة، ومطابقة قائمة الأهداف،
  بينما يظل المتصلون مسؤولين عن معرّف القناة، ووضع إعادة التوجيه الافتراضي، والبحث
  عن الحساب، والتحقق من تمكين النقل، وتوحيد الأهداف، وحل
  هدف مصدر دورة التفاعل. لا تستخدمه لإنشاء إعدادات افتراضية لسياسة القناة
  مملوكة للنواة؛ مرّر الوضع الافتراضي الموثّق للقناة صراحةً.
- تستخدم `createChannelNativeOriginTargetResolver` مطابق مسارات القنوات
  المشترك افتراضيًا لأهداف `{ to, accountId, threadId }`. مرّر
  `targetsMatch` فقط عندما تكون للقناة قواعد تكافؤ خاصة بالموفّر،
  مثل مطابقة بادئة الطابع الزمني في Slack. مرّر `normalizeTargetForMatch` عندما
  تحتاج القناة إلى توحيد معرّفات الموفّر قبل تشغيل مطابق المسارات
  الافتراضي أو رد نداء `targetsMatch` مخصّص، مع الحفاظ على
  الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما ينبغي توحيد
  هدف التسليم المحسوم نفسه.
- إذا احتاجت القناة إلى كائنات مملوكة لوقت التشغيل مثل عميل، أو رمز مميّز، أو تطبيق Bolt،
  أو مستقبِل webhook، فسجّلها عبر
  `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل
  العام للنواة تمهيد معالجات موجّهة بالقدرات انطلاقًا من حالة
  بدء تشغيل القناة من دون إضافة شيفرة ربط مغلّفة خاصة بالموافقة.
- استخدم `createChannelApprovalHandler` أو
  `createChannelNativeApprovalRuntime` منخفضَي المستوى فقط عندما لا تكون الوصلة
  الموجّهة بالقدرات معبّرة بما يكفي بعد.
- يجب أن توجّه قنوات الموافقة الأصلية كلاً من `accountId` و`approvalKind`
  عبر تلك المساعدات. تُبقي `accountId` سياسة الموافقة متعددة الحسابات
  محصورة في حساب الروبوت الصحيح، وتُبقي `approvalKind` سلوك الموافقة
  على التنفيذ مقابل المكوّن الإضافي متاحًا للقناة من دون فروع ثابتة الترميز في
  النواة.
- تمتلك النواة أيضًا إشعارات إعادة توجيه الموافقات. ينبغي ألا ترسل مكوّنات القنوات الإضافية
  رسائل متابعة خاصة بها من نوع "انتقلت الموافقة إلى الرسائل الخاصة / قناة أخرى" من
  `createChannelNativeApprovalRuntime`؛ بل ينبغي كشف توجيه دقيق للمنشأ +
  الرسائل الخاصة بالموافِق عبر مساعدات قدرات الموافقة المشتركة، وترك
  النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار في
  المحادثة التي بدأت الطلب.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. ينبغي ألا
  تخمّن العملاء الأصلية توجيه موافقة التنفيذ مقابل المكوّن الإضافي أو تعيد كتابته استنادًا إلى
  حالة محلية للقناة.
- مرّر قيمة `approvalKind` الصريحة هذه إلى `resolveApprovalOverGateway`. يستخدم هذا
  خدمة `approval.resolve` القياسية ويُرجع الفائز المسجّل عندما
  تجيب واجهة أخرى أولاً. يظل إدخال `resolveMethod` الصريح الأقدم
  متاحًا لعناصر التحكم المدعومة بالأوامر؛ ويجب ألا تستخدمه الإجراءات الأصلية الجديدة أو
  تستنتج النوع من معرّف.
- يمكن لأنواع الموافقة المختلفة أن تعرض عمدًا واجهات أصلية مختلفة.
  الأمثلة المضمّنة الحالية: تحافظ Matrix على التوجيه الأصلي نفسه عبر الرسائل الخاصة/القنوات
  وتجربة التفاعلات نفسها لموافقات التنفيذ والمكوّنات الإضافية، مع السماح في الوقت نفسه
  باختلاف المصادقة حسب نوع الموافقة؛ وتحافظ Slack على إتاحة توجيه الموافقات الأصلي
  لكل من معرّفات التنفيذ والمكوّنات الإضافية.
- لا تزال `createApproverRestrictedNativeApprovalAdapter` موجودة بوصفها
  غلاف توافق، لكن ينبغي للشيفرة الجديدة تفضيل منشئ القدرات
  وكشف `approvalCapability` على المكوّن الإضافي.

### مسارات وقت تشغيل فرعية أضيق للموافقة

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل هذه المسارات الفرعية الأضيق على
برميل `approval-runtime` الأوسع عندما تحتاج إلى جزء واحد فقط من تلك العائلة:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-reference-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

وبالمثل، فضّل `openclaw/plugin-sdk/reply-runtime`،
و`openclaw/plugin-sdk/reply-dispatch-runtime`،
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` على الواجهات المظلّية الأوسع عندما
لا تحتاج إليها جميعًا.

### مسارات الإعداد الفرعية

- تغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  `createSetupTranslator`، ومهايئات رقع الإعداد الآمنة للاستيراد
  (`createPatchedAccountSetupAdapter`، و`createEnvPatchedAccountSetupAdapter`،
  و`createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، ومنشئات
  وكلاء الإعداد المفوّضة.
- تغطي `openclaw/plugin-sdk/channel-setup` منشئات إعداد
  التثبيت الاختياري بالإضافة إلى بعض البدائيات الآمنة للإعداد: `createOptionalChannelSetupSurface`،
  و`createOptionalChannelSetupAdapter`، و`createOptionalChannelSetupWizard`،
  و`DEFAULT_ACCOUNT_ID`، و`createTopLevelChannelDmPolicy`،
  و`setSetupChannelEnabled`، و`splitSetupEntries`.
- استخدم وصلة `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`.

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا المكوّن الإضافي أولاً" في واجهات
الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المهايئ/المعالج الإرشادي المُنشأ بشكل مغلق عند كتابة الإعدادات والإنهاء، ويعيد استخدام
رسالة ضرورة التثبيت نفسها عبر التحقق، والإنهاء، ونص
رابط الوثائق.

إذا كانت قناتك تدعم الإعداد أو المصادقة الموجّهين بمتغيرات البيئة، وكان ينبغي
لتدفقات بدء التشغيل/التهيئة العامة معرفة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل، فأعلن عنها في
بيان المكوّن الإضافي باستخدام `channelEnvVars`. احتفظ بقيمة `envVars` لوقت تشغيل القناة أو
الثوابت المحلية للنص الموجّه إلى المشغّل فقط.

إذا كان يمكن أن تظهر قناتك في `status`، أو `channels list`، أو `channels status`، أو
عمليات فحص SecretRef قبل بدء وقت تشغيل المكوّن الإضافي، فأضف `openclaw.setupEntry` في
`package.json`. ينبغي أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات أوامر
القراءة فقط، وأن تُرجع بيانات القناة الوصفية، ومهايئ الإعدادات الآمن للإعداد،
ومهايئ الحالة، وبيانات وصف هدف أسرار القناة اللازمة لتلك
الملخصات. لا تبدأ العملاء أو المستمعين أو أوقات تشغيل النقل من
مدخل الإعداد.

أبقِ أيضًا مسار استيراد مدخل القناة الرئيسي ضيقًا. يمكن للاكتشاف تقييم
المدخل ووحدة المكوّن الإضافي للقناة لتسجيل القدرات من دون
تنشيط القناة. ينبغي لملفات مثل `channel-plugin-api.ts` تصدير
كائن المكوّن الإضافي للقناة من دون استيراد معالجات الإعداد الإرشادية، أو عملاء
النقل، أو مستمعي المقابس، أو مشغّلات العمليات الفرعية، أو وحدات بدء تشغيل الخدمات.
ضع أجزاء وقت التشغيل هذه في وحدات تُحمّل من `registerFull(...)`، أو محددات
وقت التشغيل، أو مهايئات القدرات الكسولة.

### مسارات القنوات الفرعية الضيقة الأخرى

بالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على الواجهات
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`، و`openclaw/plugin-sdk/account-id`،
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` لربط المسار/المغلف الوارد
  والتسجيل ثم الإرسال
- `openclaw/plugin-sdk/channel-targets` لمساعدات تحليل الهدف
- `openclaw/plugin-sdk/outbound-media` لتحميل الوسائط و
  `openclaw/plugin-sdk/channel-outbound` لمفوّضي هوية الإرسال/الإرسال الصادر
  وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما ينبغي لمسار صادر الحفاظ على
  قيمة `replyToId`/`threadId` صريحة أو استعادة جلسة `:thread:`
  الحالية بعد استمرار تطابق مفتاح الجلسة الأساسي. يمكن لمكوّنات الموفّر الإضافية
  تجاوز الأولوية، وسلوك اللاحقة، وتوحيد معرّف سلسلة الرسائل عندما
  تتضمن منصتها دلالات أصلية للتسليم ضمن سلاسل الرسائل.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط سلسلة الرسائل
  وتسجيل المهايئ
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تنسيق قديم
  لحقول حمولة الوكيل/الوسائط مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` (مهمل: لا يستخدمه أي مكوّن
  إضافي مضمّن في الإنتاج) لتوحيد أوامر Telegram المخصّصة،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر مستقر عند الرجوع؛
  فضّل معالجة إعداد الأوامر محليًا داخل المكوّن الإضافي في شيفرة المكوّنات الإضافية الجديدة

يمكن للقنوات المخصّصة للمصادقة فقط أن تتوقف عادةً عند المسار الافتراضي: تتولى النواة
الموافقات، ولا يكشف المكوّن الإضافي سوى قدرات الإرسال الصادر/المصادقة. ينبغي لقنوات
الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائل نقل المحادثة المخصّصة
استخدام المساعدات الأصلية المشتركة بدلاً من إنشاء دورة حياة الموافقة
الخاصة بها.

## سياسة الإشارات الواردة

أبقِ التعامل مع الإشارات الواردة مقسّمًا إلى طبقتين:

- جمع الأدلة المملوك للمكوّن الإضافي
- تقييم السياسة المشترك

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارات.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى برميل
المساعدات الواردة الأوسع.

مناسب للمنطق المحلي داخل المكوّن الإضافي:

- اكتشاف الرد على الروبوت
- اكتشاف اقتباس الروبوت
- التحقق من المشاركة في سلسلة الرسائل
- استثناءات رسائل الخدمة/النظام
- ذاكرات التخزين المؤقت الأصلية للمنصة اللازمة لإثبات مشاركة الروبوت

مناسب للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح بالإشارات الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الإشارة المحلية.
2. مرّر تلك الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned`، و`decision.shouldBypassMention`، و
   `decision.shouldSkip` في بوابة الاستقبال لديك.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const wasMentioned = matchesMentionWithExplicit({
  text,
  mentionRegexes,
  explicit: {
    hasAnyMention,
    isExplicitlyMentioned,
    canResolveExplicit,
  },
});

const facts = {
  canDetectMention: true,
  wasMentioned,
  hasAnyMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

تُرجع `matchesMentionWithExplicit(...)` قيمة منطقية. تأتي `hasAnyMention`،
و`isExplicitlyMentioned`، و`canResolveExplicit` من بيانات الإشارة الوصفية
الأصلية الخاصة بالقناة (كيانات الرسائل، وأعلام الرد على الروبوت، وما شابه)؛
وفّر قيم `false`/`undefined` عندما يتعذر على منصتك اكتشافها.

تكشف `api.runtime.channel.mentions` مساعدات الإشارات المشتركة نفسها
لمكوّنات القنوات الإضافية المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:
`buildMentionRegexes`، و`matchesMentionPatterns`، و`matchesMentionWithExplicit`،
و`implicitMentionKindWhen`، و`resolveInboundMentionDecision`.

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و`resolveInboundMentionDecision`،
فاستورد من `openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل
مساعدات وقت التشغيل الواردة غير ذات الصلة.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات Plugin القياسية. الحقل `channels` في
    `openclaw.plugin.json` (وليس الحقل `kind`) هو ما يحدد أن البيان
    يملك قناة. للاطلاع على جميع بيانات تعريف الحزمة، راجع
    [إعداد Plugin وتهيئته](/ar/plugins/sdk-setup#openclaw-channel):

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "دردشة Acme",
          "blurb": "اربط OpenClaw بدردشة Acme."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "channels": ["acme-chat"],
      "name": "دردشة Acme",
      "description": "Plugin قناة دردشة Acme",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "رمز البوت",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    يتحقق `configSchema` من `plugins.entries.acme-chat.config`. استخدمه
    للإعدادات التي يملكها Plugin وليست تهيئة حساب القناة.
    يتحقق `channelConfigs.acme-chat.schema` من `channels.acme-chat`، وهو
    مصدر المسار البارد الذي تستخدمه مخططات التهيئة والإعداد وواجهات المستخدم قبل
    تحميل وقت تشغيل Plugin. راجع [بيان Plugin](/ar/plugins/manifest) للاطلاع على
    مرجع جميع الحقول عالية المستوى.

  </Step>

  <Step title="إنشاء كائن Plugin القناة">
    تتضمن واجهة `ChannelPlugin` العديد من أسطح المحولات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`config` و`setup` — وأضف المحولات حسب
    الحاجة.

    أنشئ `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // عميل واجهة API لمنصتك

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: الرمز مطلوب");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        // مكان تحليل الحساب وفحصه هو `config`، وليس `setup`.
        // يشمل `setup` عمليات كتابة الإعداد الأولي (applyAccountConfig وvalidateInput).
        config: {
          listAccountIds: () => ["default"],
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
        setup: {
          applyAccountConfig: ({ cfg, input }) => ({
            ...cfg,
            channels: {
              ...cfg.channels,
              "acme-chat": { ...(cfg.channels as any)?.["acme-chat"], ...input },
            },
          }),
        },
      }),

      // أمان الرسائل المباشرة: من يمكنه مراسلة البوت
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // الاقتران: مسار الموافقة لجهات اتصال الرسائل المباشرة الجديدة
      pairing: {
        text: {
          idLabel: "اسم مستخدم دردشة Acme",
          message: "أرسل هذا الرمز للتحقق من هويتك:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `رمز الاقتران: ${code}`);
          },
        },
      },

      // تسلسل المحادثات: كيفية تسليم الردود
      threading: { topLevelReplyToMode: "reply" },

      // الصادر: إرسال الرسائل إلى المنصة
      outbound: {
        attachedResults: {
          channel: "acme-chat",
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    للقنوات التي تقبل مفاتيح الرسائل المباشرة الأساسية ذات المستوى الأعلى والمفاتيح المتداخلة القديمة معًا، استخدم الدوال المساعدة من `plugin-sdk/channel-config-helpers`: تحافظ `resolveChannelDmAccess` و`resolveChannelDmPolicy` و`resolveChannelDmAllowFrom` و`normalizeChannelDmPolicy` على أولوية القيم المحلية للحساب على قيم الجذر الموروثة. اربط المحلل نفسه بإصلاح doctor عبر `normalizeLegacyDmAliases` كي يقرأ وقت التشغيل والترحيل العقد نفسه.

    <Accordion title="ما الذي تنجزه createChatChannelPlugin نيابةً عنك">
      بدلًا من تنفيذ واجهات المحولات منخفضة المستوى يدويًا، تمرر
      خيارات تصريحية، ويتولى المنشئ تركيبها:

      | الخيار | ما يوصّله |
      | --- | --- |
      | `security.dm` | محلل أمان الرسائل المباشرة المحدد النطاق من حقول التهيئة |
      | `pairing.text` | مسار اقتران للرسائل المباشرة قائم على النص مع تبادل الرمز |
      | `threading` | محلل وضع الرد (ثابت أو محدد النطاق بالحساب أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرّفات الرسائل)؛ تتطلب معرّف `channel` شقيقًا كي يتمكن النواة من وسم نتيجة التسليم المعادة |

      يمكنك أيضًا تمرير كائنات محولات أولية بدلًا من الخيارات التصريحية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تعرّف محولات الصادر الأولية دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم،
      مثل `maxLinesPerMessage`؛ طبّقه قبل الإرسال كي يُحسم تسلسل الردود
      وحدود الأجزاء مرة واحدة بواسطة تسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضًا `replyToIdSource` ‏(`implicit` أو `explicit`)
      عند تحليل هدف رد أصلي، كي تتمكن دوال حمولات البيانات المساعدة من الحفاظ
      على وسوم الرد الصريحة دون استهلاك خانة رد ضمنية أحادية الاستخدام.
    </Accordion>

  </Step>

  <Step title="توصيل نقطة الدخول">
    أنشئ `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "دردشة Acme",
      description: "Plugin قناة دردشة Acme",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("إدارة دردشة Acme");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "إدارة دردشة Acme",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    ضع واصفات CLI التي تملكها القناة في `registerCliMetadata(...)` كي يتمكن OpenClaw
    من عرضها في مساعدة الجذر دون تنشيط وقت تشغيل القناة الكامل،
    بينما تستمر عمليات التحميل الكامل العادية في التقاط الواصفات نفسها لتسجيل الأوامر
    فعليًا. أبقِ `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيًا.
    إذا كان `registerFull(...)` يسجل أساليب RPC في Gateway، فاستخدم
    بادئة خاصة بالـPlugin. تظل نطاقات الإدارة الأساسية (`config.*`
    و`exec.approvals.*` و`wizard.*` و`update.*`) محجوزة، وتُحل دائمًا
    إلى `operator.admin`. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) للاطلاع على جميع
    الخيارات.

  </Step>

  <Step title="إضافة نقطة دخول للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطلة
    أو غير مهيأة. ويجنّب تحميل شيفرة وقت التشغيل الثقيلة أثناء مسارات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) للاطلاع على التفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل الصادرات الآمنة للإعداد في وحدات
    جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    أداة ضبط صريحة لوقت التشغيل في أثناء الإعداد.

  </Step>

  <Step title="معالجة الرسائل الواردة">
    يحتاج Plugin إلى تلقي الرسائل من المنصة وإعادة توجيهها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب
    ويوجهه عبر معالج الرسائل الواردة في قناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // مصادقة يديرها Plugin (تحقق من التوقيعات بنفسك)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // يرسل معالج الرسائل الواردة لديك الرسالة إلى OpenClaw.
          // تعتمد التوصيلات الدقيقة على SDK الخاص بمنصتك -
          // راجع مثالًا فعليًا في حزمة Plugin المضمّنة لـMicrosoft Teams أو Google Chat.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      معالجة الرسائل الواردة خاصة بكل قناة. يملك كل Plugin قناة
      مسار معالجة الرسائل الواردة الخاص به. راجع Plugins القنوات المضمّنة
      (مثل حزمة Plugin الخاصة بـMicrosoft Teams أو Google Chat) للاطلاع على أنماط فعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات متجاورة في `src/channel.test.ts`:

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.config.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.config.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test <bundled-plugin-root>/acme-chat/
    ```

    للاطّلاع على أدوات الاختبار المساعدة المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

</Step>
</Steps>

## بنية الملفات

```text
<bundled-plugin-root>/acme-chat/
├── package.json              # بيانات openclaw.channel الوصفية
├── openclaw.plugin.json      # البيان مع مخطط الإعدادات
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # التصديرات العامة (اختياري)
├── runtime-api.ts            # تصديرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # الاختبارات
    ├── client.ts             # عميل API للمنصة
    └── runtime.ts            # مخزن وقت التشغيل (عند الحاجة)
```

## موضوعات متقدمة

<CardGroup cols={2}>
  <Card title="خيارات سلاسل المحادثات" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة أو محددة النطاق بالحساب أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="تحديد الهدف" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType وlooksLikeId وreservedLiterals وresolveTarget
  </Card>
  <Card title="أدوات وقت التشغيل المساعدة" icon="settings" href="/ar/plugins/sdk-runtime">
    تحويل النص إلى كلام وتحويل الكلام إلى نص والوسائط والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="API الوارد للقناة" icon="bolt" href="/ar/plugins/sdk-channel-inbound">
    دورة حياة الحدث الوارد المشتركة: الاستيعاب والتحديد والتسجيل والتوجيه والإنهاء
  </Card>
</CardGroup>

<Note>
لا تزال بعض واجهات الأدوات المساعدة المجمّعة موجودة لصيانة المكوّنات الإضافية
المجمّعة وللتوافق. وهي ليست النمط الموصى به للمكوّنات الإضافية الجديدة للقنوات؛
ويُفضّل استخدام المسارات الفرعية العامة للقناة والإعداد والرد ووقت التشغيل من
واجهة SDK المشتركة، ما لم تكن تصون عائلة ذلك المكوّن الإضافي المجمّع مباشرةً.
</Note>

## الخطوات التالية

- [المكوّنات الإضافية لموفّري الخدمة](/ar/plugins/sdk-provider-plugins) - إذا كان المكوّن الإضافي يوفّر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) - أدوات الاختبار واختبارات العقود
- [بيان المكوّن الإضافي](/ar/plugins/manifest) - مخطط البيان الكامل

## ذو صلة

- [إعداد SDK للمكوّنات الإضافية](/ar/plugins/sdk-setup)
- [إنشاء المكوّنات الإضافية](/ar/plugins/building-plugins)
- [المكوّنات الإضافية لأداة تشغيل الوكيل](/ar/plugins/sdk-agent-harness)

---
read_when:
    - أنت تبني Plugin قناة مراسلة جديد
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم سطح محوّل ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin قناة مراسلة لـ OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-06-27T18:17:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2148141910d4a275ee800d084d60d7174146140f57ecc5c57cc12824115238be
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin قناة يربط OpenClaw بمنصة مراسلة. في النهاية ستكون لديك قناة عاملة مع أمان الرسائل المباشرة، والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تبن أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لفهم بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات إرسال/تحرير/تفاعل خاصة بها. يحتفظ OpenClaw بأداة
`message` مشتركة واحدة في النواة. يمتلك الـ Plugin الخاص بك:

- **الإعدادات** - حل الحساب ومعالج الإعداد
- **الأمان** - سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** - تدفق الموافقة عبر الرسائل المباشرة
- **قواعد الجلسة** - كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالمحادثات الأساسية، ومعرّفات السلاسل، والبدائل الاحتياطية للأصل
- **الصادر** - إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **تسلسل الردود** - كيفية تنظيم الردود في سلاسل
- **كتابة Heartbeat** - إشارات كتابة/انشغال اختيارية لأهداف تسليم Heartbeat

تمتلك النواة أداة الرسائل المشتركة، وتوصيل المطالبات، وشكل مفتاح الجلسة الخارجي،
وتسجيل `:thread:` العام، والتوجيه.

ينبغي أن تعرض Plugins القنوات الجديدة أيضًا محوّل `message` باستخدام
`defineChannelMessageAdapter` من `openclaw/plugin-sdk/channel-outbound`. يعلن
المحوّل قدرات الإرسال النهائي الدائم التي يدعمها النقل الأصلي فعليًا، ويوجه إرسال النصوص/الوسائط إلى دوال النقل نفسها التي يستخدمها محوّل `outbound` القديم. لا تعلن عن قدرة إلا عندما يثبت اختبار عقد الأثر الجانبي الأصلي والإيصال المُعاد.
للاطلاع على عقد API الكامل، والأمثلة، ومصفوفة القدرات، وقواعد الإيصالات، وإنهاء المعاينة المباشرة، وسياسة إقرار الاستلام، والاختبارات، وجدول الترحيل، راجع
[API الصادر للقناة](/ar/plugins/sdk-channel-outbound).
إذا كان محوّل `outbound` الحالي يمتلك بالفعل طرق الإرسال وبيانات القدرات الوصفية المناسبة، فاستخدم `createChannelMessageAdapterFromOutbound(...)`
لاشتقاق محوّل `message` بدلًا من كتابة جسر آخر يدويًا.
ينبغي أن تعيد عمليات إرسال المحوّل قيم `MessageReceipt`. عندما لا تزال شيفرة التوافق
تحتاج إلى معرّفات قديمة، فاشتقها باستخدام `listMessageReceiptPlatformIds(...)`
أو `resolveMessageReceiptPrimaryId(...)` بدلًا من الاحتفاظ بحقول `messageIds`
موازية في شيفرة دورة الحياة الجديدة.
ينبغي للقنوات القادرة على المعاينة أن تعلن أيضًا `message.live.capabilities` مع
دورة الحياة المباشرة الدقيقة التي تمتلكها، مثل `draftPreview`،
`previewFinalization`، أو `progressUpdates`، أو `nativeStreaming`، أو
`quietFinalization`. ينبغي للقنوات التي تنهي معاينة مسودة في مكانها أن تعلن
أيضًا `message.live.finalizer.capabilities`، مثل `finalEdit`،
`normalFallback`، و`discardPending`، و`previewReceipt`، و
`retainOnAmbiguousFailure`، وأن توجه منطق وقت التشغيل عبر
`defineFinalizableLivePreviewAdapter(...)` بالإضافة إلى
`deliverWithFinalizableLivePreviewAdapter(...)`. أبقِ هذه القدرات مدعومة
باختبارات `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` حتى لا تنحرف سلوكيات المعاينة
الأصلية، والتقدم، والتحرير، والاحتفاظ/البديل الاحتياطي، والتنظيف، والإيصالات بصمت.
ينبغي للمستقبلات الواردة التي تؤجل إقرارات المنصة أن تعلن
`message.receive.defaultAckPolicy` و`supportedAckPolicies` بدلًا من إخفاء
توقيت الإقرار في حالة محلية للمراقب. غطِّ كل سياسة معلنة باستخدام
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

تظل مساعدات الرد القديمة مثل `createChannelTurnReplyPipeline`،
و`dispatchInboundReplyWithBase`، و`recordInboundSessionAndDispatchReply`
متاحة لمرسلات التوافق. لا تستخدم هذه الأسماء لشيفرة القنوات الجديدة؛ ينبغي أن تبدأ Plugins الجديدة بمحوّل `message`، والإيصالات، ومساعدات دورة حياة الاستلام/الإرسال على `openclaw/plugin-sdk/channel-outbound`.

يمكن للقنوات التي ترحّل التفويض الوارد استخدام المسار الفرعي التجريبي
`openclaw/plugin-sdk/channel-ingress-runtime` من مسارات الاستلام وقت التشغيل.
يبقي المسار الفرعي البحث في المنصة والآثار الجانبية داخل الـ Plugin، مع مشاركة
حل حالة قائمة السماح، وقرارات المسار/المرسل/الأمر/الحدث/التفعيل، والتشخيصات
المحجوبة، وربط قبول الدور. أبقِ تسوية هوية الـ Plugin في الواصف الذي تمرره إلى
المحلل؛ لا تسلسل قيم المطابقة الخام من الحالة أو القرار المحلول. راجع
[API دخول القناة](/ar/plugins/sdk-channel-ingress) لتصميم API،
وحدود الملكية، وتوقعات الاختبار.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاعرض
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع هدف تسليم Heartbeat
المحلول قبل بدء تشغيل نموذج Heartbeat، وتستخدم دورة حياة الإبقاء والتنظيف المشتركة للكتابة. أضف `heartbeat.clearTyping(...)`
عندما تحتاج المنصة إلى إشارة إيقاف صريحة.

إذا أضافت قناتك معاملات لأداة الرسائل تحمل مصادر وسائط، فاعرض أسماء تلك
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتسوية مسارات الصندوق الرملي وسياسة وصول الوسائط الصادرة،
لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصورة الرمزية، أو المرفق، أو صورة الغلاف الخاصة بالمزوّد.
يفضل إرجاع خريطة مفهرسة بمفاتيح الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
ذات الصلة وسيطات وسائط إجراء آخر. لا تزال المصفوفة المسطحة تعمل للمعاملات
المشتركة عمدًا عبر كل إجراء معروض.
يمكن للقنوات التي يجب أن تعرض عنوان URL عامًا مؤقتًا لجلب وسائط من جانب المنصة
استخدام `createHostedOutboundMediaStore(...)` من
`openclaw/plugin-sdk/outbound-media` مع مخازن حالة الـ Plugin. أبقِ تحليل
مسارات المنصة وفرض الرموز داخل Plugin القناة؛ لا يمتلك المساعد المشترك إلا
تحميل الوسائط، وبيانات انتهاء الصلاحية الوصفية، وصفوف المقاطع، والتنظيف.

إذا كانت قناتك تحتاج إلى تشكيل خاص بالمزوّد لـ `message(action="send")`،
ففضّل `actions.prepareSendPayload(...)`. ضع البطاقات الأصلية، أو الكتل، أو
التضمينات، أو غيرها من البيانات الدائمة تحت `payload.channelData.<channel>`
ودع النواة تنفذ الإرسال الفعلي عبر محوّل الصادر/الرسائل. استخدم
`actions.handleAction(...)` للإرسال فقط كبديل توافق للحمولات التي لا يمكن
تسلسلها وإعادة المحاولة عليها.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل الـ Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو
الخطاف المعياري لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
عندما تعيد `parentConversationCandidates`، أبقها مرتبة من الأصل الأضيق إلى
المحادثة الأوسع/الأساسية.

استخدم `openclaw/plugin-sdk/channel-route` عندما تحتاج شيفرة الـ Plugin إلى تسوية
حقول شبيهة بالمسارات، أو مقارنة سلسلة فرعية بمسار أصلها، أو بناء مفتاح إزالة
تكرار ثابت من `{ channel, to, accountId, threadId }`. يطبّع المساعد معرّفات
السلاسل الرقمية بالطريقة نفسها التي تفعلها النواة، لذلك ينبغي أن تفضله Plugins
على مقارنات `String(threadId)` المخصصة.
ينبغي للـ Plugins ذات قواعد الأهداف الخاصة بالمزوّد أن تعرض
`messaging.resolveOutboundSessionRoute(...)` حتى تحصل النواة على هوية الجلسة
والسلسلة الأصلية للمزوّد من دون استخدام طبقات تحليل توافقية.

يمكن للـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل بدء سجل القنوات أن
تعرض أيضًا ملف `session-key-api.ts` في المستوى الأعلى مع تصدير مطابق
`resolveSessionConversation(...)`. تستخدم النواة هذا السطح الآمن للتمهيد
فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل توافق
قديم عندما يحتاج Plugin فقط إلى بدائل أصل احتياطية فوق المعرّف العام/الخام.
إذا كان الخطافان موجودين، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ولا تعود
إلى `resolveParentConversationCandidates(...)` إلا عندما يحذفها الخطاف المعياري.

## الموافقات وقدرات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقة.

- تمتلك النواة `/approve` في نفس المحادثة، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلية/عرض/مصادقة الموافقة على `approvalCapability`.
- `plugin.auth` مخصص لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` هما موضع التماس القانوني لمصادقة الموافقة.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة في نفس المحادثة.
- إذا كانت قناتك تعرض موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة في نفس المحادثة. تستخدم النواة ذلك الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة البادئة تدعم موافقات التنفيذ الأصلية، وإدراج القناة في إرشادات الاحتياط للعميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو منع الاحتياط.
- استخدم `approvalCapability.nativeRuntime` لحقائق الموافقة الأصلية المملوكة للقناة. أبقه كسولًا على نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدل العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعداد الدقيقة المطلوبة لتمكين موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ يجب على قنوات الحسابات المسماة عرض مسارات محددة بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدل الإعدادات الافتراضية ذات المستوى الأعلى.
- إذا كان بإمكان القناة استنتاج هويات الرسائل المباشرة الشبيهة بالمالك والمستقرة من الإعدادات الحالية، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` في نفس المحادثة دون إضافة منطق نواة خاص بالموافقة.
- إذا كانت مصادقة الموافقة المخصصة تسمح عمدًا بالاحتياط في نفس المحادثة فقط، فأعد `markImplicitSameChatApprovalAuthorization({ authorized: true })` من `openclaw/plugin-sdk/approval-auth-runtime`؛ وإلا فستعامل النواة النتيجة كتفويض صريح للموافق.
- إذا كانت معاودة اتصال أصلية مملوكة للقناة تحل الموافقات مباشرة، فاستخدم `isImplicitSameChatApprovalAuthorization(...)` قبل الحل حتى يظل الاحتياط الضمني يمر عبر تفويض الممثل العادي للقناة.
- إذا احتاجت القناة إلى تسليم موافقة أصلية، فأبق كود القناة مركزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك ترشيح الطلبات، والتوجيه، وإزالة التكرار، والانتهاء، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى بضع مواضع تماس أصغر:
- استخدم `createNativeApprovalChannelRouteGates` من `openclaw/plugin-sdk/approval-native-runtime` عندما تدعم القناة كلًا من التسليم الأصلي من منشأ الجلسة وأهداف تحويل الموافقة الصريحة. يركز المساعد اختيار إعداد الموافقة، ومعالجة `mode`، ومرشحات الوكيل/الجلسة، وربط الحساب، ومطابقة هدف الجلسة، ومطابقة قائمة الأهداف، بينما يظل المتصلون يملكون معرف القناة، ووضع التحويل الافتراضي، والبحث عن الحساب، وفحص تمكين النقل، وتطبيع الهدف، وحل هدف مصدر الدور. لا تستخدمه لإنشاء افتراضات سياسة قناة مملوكة للنواة؛ مرر الوضع الافتراضي الموثق للقناة صراحة.
- يستخدم `createChannelNativeOriginTargetResolver` مطابق مسار القناة المشترك افتراضيًا لأهداف `{ to, accountId, threadId }`. مرر `targetsMatch` فقط عندما تملك القناة قواعد تكافؤ خاصة بالمزود، مثل مطابقة بادئة الطابع الزمني في Slack.
- مرر `normalizeTargetForMatch` إلى `createChannelNativeOriginTargetResolver` عندما تحتاج القناة إلى تحويل معرفات المزود إلى شكل قانوني قبل تشغيل مطابق المسار الافتراضي أو معاودة اتصال `targetsMatch` مخصصة، مع الحفاظ على الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما يجب تحويل هدف التسليم المحلول نفسه إلى شكل قانوني.
- `availability` - ما إذا كان الحساب مهيأً وما إذا كان يجب التعامل مع الطلب
- `presentation` - تحويل نموذج عرض الموافقة المشترك إلى حمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` - إعداد الأهداف ثم إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` - خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية، بالإضافة إلى خطاف `cancelDelivered` اختياري. نفذ `cancelDelivered` عندما يسجل `deliverPending` حالة داخل العملية أو دائمة (مثل مخزن أهداف تفاعل) حتى يمكن تحرير تلك الحالة إذا ألغى توقف المعالج التسليم قبل تشغيل `bindPending` أو عندما لا يعيد `bindPending` أي مقبض
- `observe` - خطافات تشخيص تسليم اختيارية
- إذا احتاجت القناة إلى كائنات مملوكة لوقت التشغيل مثل عميل، أو رمز، أو تطبيق Bolt، أو مستقبل Webhook، فسجلها من خلال `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة تمهيد المعالجات المدفوعة بالإمكانات من حالة بدء القناة دون إضافة غراء تغليف خاص بالموافقة.
- استخدم `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا يكون موضع التماس المدفوع بالإمكانات معبرًا بما يكفي بعد.
- يجب أن تمرر قنوات الموافقة الأصلية كلًا من `accountId` و`approvalKind` عبر هؤلاء المساعدين. يبقي `accountId` سياسة الموافقة متعددة الحسابات محددة النطاق على حساب البوت الصحيح، ويبقي `approvalKind` سلوك موافقة التنفيذ مقابل موافقة Plugin متاحًا للقناة دون تفريعات ثابتة في النواة.
- تمتلك النواة الآن إشعارات إعادة توجيه الموافقة أيضًا. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "ذهبت الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بدلًا من ذلك، اعرض توجيه المنشأ + الرسائل المباشرة للموافق بدقة عبر مساعدي إمكانات الموافقة المشتركة، ودع النواة تجمع التسليمات الفعلية قبل نشر أي إشعار عائد إلى المحادثة البادئة.
- حافظ على نوع معرف الموافقة المسلم من البداية إلى النهاية. يجب ألا
  تخمن العملاء الأصلية أو تعيد كتابة توجيه موافقة التنفيذ مقابل Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقة المختلفة أن تعرض عمدًا أسطحًا أصلية مختلفة.
  الأمثلة المضمنة الحالية:
  - يبقي Slack توجيه الموافقة الأصلية متاحًا لكل من معرفات التنفيذ وPlugin.
  - يبقي Matrix توجيه الرسائل المباشرة/القنوات الأصلي وتجربة تفاعلات المستخدم نفسها للتنفيذ
    وموافقات Plugin، مع السماح في الوقت نفسه باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن يفضل الكود الجديد باني الإمكانات ويعرض `approvalCapability` على Plugin.

لنقاط دخول القناة الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما تحتاج
إلى جزء واحد فقط من تلك العائلة:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

وبالمثل، فضّل `openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/setup-runtime`,
`openclaw/plugin-sdk/reply-runtime`,
`openclaw/plugin-sdk/reply-dispatch-runtime`,
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى سطح المظلة الأوسع.

للإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدي الإعداد الآمنين لوقت التشغيل:
  `createSetupTranslator`، ومهايئات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات ملاحظة البحث،
  `promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  وكيل الإعداد المفوض
- يتضمن `openclaw/plugin-sdk/setup-runtime` موضع تماس المهايئ المدرك للبيئة لـ
  `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة إعداد التثبيت الاختياري
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`، و`createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعة بالبيئة ويجب أن تعرف تدفقات
البدء/الإعداد العامة أسماء تلك المتغيرات البيئية قبل تحميل وقت التشغيل، فصرح بها في
بيان Plugin باستخدام `channelEnvVars`. أبق `envVars` وقت تشغيل القناة أو
الثوابت المحلية للنسخة النصية الموجهة للمشغل فقط.

إذا كان يمكن أن تظهر قناتك في `status`، أو `channels list`، أو `channels status`، أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات أوامر القراءة فقط
ويجب أن تعيد بيانات تعريف القناة، ومهايئ الإعداد الآمن للتكوين، ومهايئ الحالة،
وبيانات تعريف هدف سر القناة اللازمة لتلك الملخصات. لا تبدأ العملاء، أو المستمعين، أو أوقات تشغيل النقل من مدخل الإعداد.

أبق مسار استيراد مدخل القناة الرئيسي ضيقًا أيضًا. يمكن للاكتشاف تقييم
المدخل ووحدة Plugin القناة لتسجيل الإمكانات دون تنشيط
القناة. يجب أن تصدر ملفات مثل `channel-plugin-api.ts` كائن Plugin
القناة دون استيراد معالجات الإعداد، أو عملاء النقل، أو مستمعي المقابس،
أو مشغلات العمليات الفرعية، أو وحدات بدء الخدمة. ضع تلك القطع الخاصة بوقت التشغيل
في وحدات محملة من `registerFull(...)`، أو محددات وقت التشغيل، أو مهايئات
إمكانات كسولة.

`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم موضع تماس `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدي الإعداد/التكوين المشتركين الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبت هذا Plugin أولًا" في أسطح
الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المهايئ/المعالج المُنشأ بإغلاق عند عمليات كتابة التكوين والإنهاء، ويعيد استخدام
رسالة طلب التثبيت نفسها عبر التحقق، والإنهاء، ونسخة رابط
الوثائق.

لمسارات القنوات الساخنة الأخرى، فضّل المساعدين الضيقين على الأسطح القديمة
الأوسع:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لتكوين الحسابات المتعددة
  والرجوع الاحتياطي إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` للمسار/المغلف الوارد
  وتوصيل التسجيل والإرسال
- `openclaw/plugin-sdk/channel-targets` لمساعدات تحليل الأهداف
- `openclaw/plugin-sdk/outbound-media` لتحميل الوسائط و
  `openclaw/plugin-sdk/channel-outbound` لمفوّضي هوية الإرسال الصادر/الإرسال
  وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ مسار صادر على
  `replyToId`/`threadId` صريح أو يستعيد جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. يمكن لـ provider plugins تجاوز
  الأولوية، وسلوك اللاحقة، وتطبيع معرّف السلسلة عندما تكون لدى منصتهم
  دلالات تسليم سلاسل أصلية.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المحوّلات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل مخطط حقل حمولة
  agent/media القديم مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram
  والتحقق من التكرار/التعارض، وعقد تكوين أوامر مستقر عند الرجوع الاحتياطي

يمكن للقنوات الخاصة بالمصادقة فقط عادةً التوقف عند المسار الافتراضي: يتولى القلب الموافقات، ولا يعرض الـ plugin إلا قدرات الإرسال الصادر/المصادقة. يجب على قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ونواقل الدردشة المخصصة استخدام المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة موافقة خاصة بها.

## سياسة الإشارة الواردة

أبقِ معالجة الإشارة الواردة مقسمة إلى طبقتين:

- جمع الأدلة المملوك للـ plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى حزمة المساعدات
الواردة الأوسع.

مناسب جيدًا للمنطق المحلي للـ plugin:

- اكتشاف الرد على الروبوت
- اكتشاف اقتباس الروبوت
- فحوصات مشاركة السلسلة
- استثناءات رسائل الخدمة/النظام
- التخزينات المؤقتة الأصلية للمنصة اللازمة لإثبات مشاركة الروبوت

مناسب جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح بالإشارة الضمنية
- تجاوز الأمر
- قرار التخطي النهائي

التدفق المفضل:

1. احسب حقائق الإشارة المحلية.
2. مرّر تلك الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned` و`decision.shouldBypassMention` و`decision.shouldSkip` في بوابة الوارد لديك.

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
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

يعرض `api.runtime.channel.mentions` مساعدات الإشارة المشتركة نفسها
لـ bundled channel plugins التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت التشغيل
الواردة غير ذات الصلة.

استخدم `resolveInboundMentionDecision({ facts, policy })` لبوابة الإشارة.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات الـ plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا channel plugin. للاطلاع على سطح بيانات تعريف الحزمة الكامل،
    راجع [إعداد Plugin وتكوينه](/ar/plugins/sdk-setup#openclaw-channel):

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
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
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
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    يتحقق `configSchema` من `plugins.entries.acme-chat.config`. استخدمه
    للإعدادات المملوكة للـ plugin التي ليست تكوين حساب القناة. يتحقق `channelConfigs`
    من `channels.acme-chat` وهو مصدر المسار البارد المستخدم بواسطة مخطط التكوين
    والإعداد وأسطح واجهة المستخدم قبل تحميل وقت تشغيل الـ plugin.

  </Step>

  <Step title="بناء كائن channel plugin">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المحوّل الاختيارية. ابدأ
    بالحد الأدنى - `id` و`setup` - وأضف المحوّلات حسب حاجتك إليها.

    أنشئ `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // your platform API client

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
      if (!token) throw new Error("acme-chat: token is required");
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
        setup: {
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
      }),

      // DM security: who can message the bot
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: approval flow for new DM contacts
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: how replies are delivered
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: send messages to the platform
      outbound: {
        attachedResults: {
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

    بالنسبة إلى القنوات التي تقبل مفاتيح الرسائل المباشرة العلوية القياسية والمفاتيح المتداخلة القديمة معًا، استخدم المساعدات من `plugin-sdk/channel-config-helpers`: تحافظ `resolveChannelDmAccess` و`resolveChannelDmPolicy` و`resolveChannelDmAllowFrom` و`normalizeChannelDmPolicy` على القيم المحلية للحساب قبل القيم الجذرية الموروثة. اقرن المحلل نفسه بإصلاح doctor من خلال `normalizeLegacyDmAliases` بحيث يقرأ وقت التشغيل والهجرة العقد نفسه.

    <Accordion title="ما الذي يفعله createChatChannelPlugin لك">
      بدلًا من تنفيذ واجهات المحوّل منخفضة المستوى يدويًا، تمرر
      خيارات تصريحية ويؤلفها الباني:

      | الخيار | ما يوصله |
      | --- | --- |
      | `security.dm` | محلل أمان الرسائل المباشرة محدود النطاق من حقول التكوين |
      | `pairing.text` | تدفق إقران الرسائل المباشرة النصي مع تبادل الرمز |
      | `threading` | محلل وضع الرد على (ثابت، محدود بنطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات محوّل خام بدلًا من الخيارات التصريحية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تعرّف محوّلات الإرسال الصادر الخام دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم
      مثل `maxLinesPerMessage`؛ طبّقه قبل الإرسال بحيث يتم حل سلاسل الرد
      وحدود المقاطع مرة واحدة بواسطة التسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضًا `replyToIdSource` (`implicit` أو `explicit`)
      عندما يتم حل هدف رد أصلي، بحيث يمكن لمساعدات الحمولة الحفاظ على
      وسوم الرد الصريحة دون استهلاك خانة رد ضمنية أحادية الاستخدام.
    </Accordion>

  </Step>

  <Step title="توصيل نقطة الإدخال">
    أنشئ `index.ts`:

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
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

    ضع واصفات CLI المملوكة للقناة في `registerCliMetadata(...)` بحيث يستطيع OpenClaw
    عرضها في مساعدة الجذر دون تفعيل وقت تشغيل القناة الكامل،
    بينما تظل عمليات التحميل الكاملة العادية تلتقط الواصفات نفسها لتسجيل الأوامر
    الفعلي. أبقِ `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل طرق Gateway RPC، فاستخدم بادئة
    خاصة بالـ Plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) محجوزة دائمًا وتُحل
    دائمًا إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) للاطلاع على كل
    الخيارات.

  </Step>

  <Step title="Add a setup entry">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مهيأة. وهو يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء مسارات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل الصادرات الآمنة للإعداد إلى وحدات
    جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    واضع وقت تشغيل صريح أثناء الإعداد.

  </Step>

  <Step title="Handle inbound messages">
    يحتاج الـ Plugin إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب
    ويوجهه عبر معالج الوارد الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK -
          // see a real example in the bundled Microsoft Teams or Google Chat plugin package.
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
      مسار الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin Microsoft Teams أو Google Chat) للاطلاع على أنماط فعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
اكتب اختبارات موضوعة بجانب الشيفرة في `src/channel.test.ts`:

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
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    للمساعدات المشتركة للاختبارات، راجع [الاختبار](/ar/plugins/sdk-testing).

</Step>
</Steps>

## بنية الملفات

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel metadata
├── openclaw.plugin.json      # Manifest with config schema
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # Public exports (optional)
├── runtime-api.ts            # Internal runtime exports (optional)
└── src/
    ├── channel.ts            # ChannelPlugin via createChatChannelPlugin
    ├── channel.test.ts       # Tests
    ├── client.ts             # Platform API client
    └── runtime.ts            # Runtime store (if needed)
```

## موضوعات متقدمة

<CardGroup cols={2}>
  <Card title="Threading options" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة أو محددة النطاق بالحساب أو مخصصة
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, reservedLiterals, resolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/ar/plugins/sdk-channel-inbound">
    دورة حياة حدث الوارد المشتركة: الاستيعاب، الحل، التسجيل، الإرسال، الإنهاء
  </Card>
</CardGroup>

<Note>
لا تزال بعض مواضع الربط المساعدة المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك، ما لم تكن تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Provider Plugins](/ar/plugins/sdk-provider-plugins) - إذا كان الـ Plugin لديك يوفر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيرادات المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) - أدوات الاختبار واختبارات العقد
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان الكامل

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins حاضنة الوكلاء](/ar/plugins/sdk-agent-harness)

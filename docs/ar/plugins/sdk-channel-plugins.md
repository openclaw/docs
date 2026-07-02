---
read_when:
    - أنت تبني plugin قناة مراسلة جديد
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم سطح محوّل ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل تفصيلي لبناء Plugin قناة مراسلة لـ OpenClaw
title: بناء Plugins للقنوات
x-i18n:
    generated_at: "2026-07-02T22:34:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84490ebdd482d1f09827af38274d06beea6d7fd72071e66beb79fcc12c86656a
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin قناة يربط OpenClaw بمنصة
مراسلة. في النهاية سيكون لديك قناة عاملة مع أمان الرسائل المباشرة،
والإقران، وترابط الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولاً لمعرفة بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات إرسال/تحرير/تفاعل خاصة بها. يحتفظ OpenClaw بأداة
`message` مشتركة واحدة في النواة. يمتلك Plugin الخاص بك:

- **التكوين** - حل الحساب ومعالج الإعداد
- **الأمان** - سياسة الرسائل المباشرة وقوائم السماح
- **الإقران** - تدفق الموافقة عبر الرسائل المباشرة
- **قواعد الجلسة** - كيفية ربط معرّفات المحادثة الخاصة بالمزوّد بالمحادثات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الصادر** - إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **ترابط الردود** - كيفية تنظيم الردود في سلاسل
- **كتابة Heartbeat** - إشارات كتابة/انشغال اختيارية لأهداف تسليم Heartbeat

تمتلك النواة أداة الرسائل المشتركة، وربط المطالبات، وشكل مفتاح الجلسة الخارجي،
وحفظ السجلات العام لـ `:thread:`، والتوجيه.

ينبغي أن تكشف Plugins القنوات الجديدة أيضاً عن محوّل `message` باستخدام
`defineChannelMessageAdapter` من `openclaw/plugin-sdk/channel-outbound`. يعلن
المحوّل عن قدرات الإرسال النهائي الدائمة التي يدعمها النقل الأصلي فعلياً
ويوجه إرسال النصوص/الوسائط إلى دوال النقل نفسها التي يستخدمها محوّل
`outbound` القديم. لا تعلن عن قدرة إلا عندما يثبت اختبار عقد الأثر الجانبي
الأصلي والإيصال المُعاد.
للاطلاع على عقد API الكامل، والأمثلة، ومصفوفة القدرات، وقواعد الإيصالات، وإنهاء
المعاينة الحية، وسياسة إقرار الاستلام، والاختبارات، وجدول الترحيل، راجع
[API الصادر للقنوات](/ar/plugins/sdk-channel-outbound).
إذا كان محوّل `outbound` الحالي يحتوي بالفعل على طرائق الإرسال الصحيحة
وبيانات تعريف القدرات، فاستخدم `createChannelMessageAdapterFromOutbound(...)`
لاشتقاق محوّل `message` بدلاً من كتابة جسر آخر يدوياً.
ينبغي أن تعيد عمليات إرسال المحوّل قيماً من نوع `MessageReceipt`. عندما تظل
شفرة التوافق بحاجة إلى معرّفات قديمة، فاشتقها باستخدام `listMessageReceiptPlatformIds(...)`
أو `resolveMessageReceiptPrimaryId(...)` بدلاً من الاحتفاظ بحقول
`messageIds` موازية في شفرة دورة الحياة الجديدة.
ينبغي للقنوات القادرة على المعاينة أن تعلن أيضاً عن `message.live.capabilities` مع
دورة الحياة الحية الدقيقة التي تمتلكها، مثل `draftPreview` أو
`previewFinalization` أو `progressUpdates` أو `nativeStreaming` أو
`quietFinalization`. وينبغي للقنوات التي تنهي معاينة مسودة في مكانها أن
تعلن أيضاً عن `message.live.finalizer.capabilities`، مثل `finalEdit` و
`normalFallback` و `discardPending` و `previewReceipt` و
`retainOnAmbiguousFailure`، وأن توجه منطق وقت التشغيل عبر
`defineFinalizableLivePreviewAdapter(...)` إضافة إلى
`deliverWithFinalizableLivePreviewAdapter(...)`. أبقِ تلك القدرات مدعومة
باختبارات `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` حتى لا تنحرف سلوكيات المعاينة
الأصلية، والتقدم، والتحرير، والبديل/الاحتفاظ، والتنظيف، والإيصالات بصمت.
ينبغي للمستقبِلات الواردة التي تؤجل إقرارات المنصة أن تعلن
`message.receive.defaultAckPolicy` و `supportedAckPolicies` بدلاً من إخفاء
توقيت الإقرار في حالة محلية للمراقب. غطِّ كل سياسة معلنة باستخدام
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

تظل مساعدات الرد القديمة مثل `createChannelTurnReplyPipeline` و
`dispatchInboundReplyWithBase` و `recordInboundSessionAndDispatchReply`
متاحة لمرسِلات التوافق. لا تستخدم تلك الأسماء في شفرة القنوات الجديدة؛ ينبغي
أن تبدأ Plugins الجديدة بمحوّل `message`، والإيصالات، ومساعدات دورة حياة
الاستقبال/الإرسال على `openclaw/plugin-sdk/channel-outbound`.

يمكن للقنوات التي ترحّل التفويض الوارد استخدام المسار الفرعي التجريبي
`openclaw/plugin-sdk/channel-ingress-runtime` من مسارات الاستقبال في وقت
التشغيل. يُبقي المسار الفرعي البحث عن المنصة والآثار الجانبية داخل Plugin، مع
مشاركة حل حالة قائمة السماح، وقرارات المسار/المرسل/الأمر/الحدث/التنشيط،
والتشخيصات المنقحة، وربط قبول الدور. أبقِ تطبيع هوية Plugin في الواصف الذي
تمرره إلى المحلل؛ لا تسلسل قيم المطابقة الخام من الحالة أو القرار المحلول.
راجع [API دخول القنوات](/ar/plugins/sdk-channel-ingress) للاطلاع على تصميم API،
وحدود الملكية، وتوقعات الاختبار.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاكشف
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع هدف تسليم
Heartbeat المحلول قبل بدء تشغيل نموذج Heartbeat وتستخدم دورة حياة إبقاء
الكتابة/التنظيف المشتركة. أضف `heartbeat.clearTyping(...)` عندما تحتاج
المنصة إلى إشارة توقف صريحة.

إذا أضافت قناتك معاملات لأداة الرسائل تحمل مصادر وسائط، فاكشف أسماء تلك
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
تلك القائمة الصريحة لتطبيع مسارات صندوق الحماية وسياسة وصول الوسائط الصادرة،
لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصورة
الشخصية، أو المرفق، أو صورة الغلاف الخاصة بالمزوّد.
يفضل إرجاع خريطة مفهرسة بمفاتيح الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
المرتبطة وسائط إجراء آخر. لا تزال المصفوفة المسطحة تعمل للمعاملات التي
تُشارك عمداً عبر كل إجراء مكشوف.
يمكن للقنوات التي يجب أن تكشف URL عاماً مؤقتاً لجلب وسائط من جانب المنصة أن
تستخدم `createHostedOutboundMediaStore(...)` من
`openclaw/plugin-sdk/outbound-media` مع مخازن حالة Plugin. أبقِ تحليل مسار
المنصة وفرض الرمز المميز في Plugin القناة؛ لا يمتلك المساعد المشترك إلا تحميل
الوسائط، وبيانات تعريف انتهاء الصلاحية، وصفوف الأجزاء، والتنظيف.

إذا احتاجت قناتك إلى تشكيل خاص بالمزوّد لـ `message(action="send")`،
ففضّل `actions.prepareSendPayload(...)`. ضع البطاقات الأصلية أو الكتل أو
التضمينات أو غيرها من البيانات الدائمة تحت `payload.channelData.<channel>`
ودع النواة تنفذ الإرسال الفعلي عبر محوّل الصادر/الرسائل. استخدم
`actions.handleAction(...)` للإرسال فقط كبديل توافق للحمولات التي لا يمكن
تسلسلها وإعادة المحاولة عليها.

إذا كانت منصتك تخزن نطاقاً إضافياً داخل معرّفات المحادثة، فأبقِ ذلك التحليل
في Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو
الخطاف القياسي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة
الاختياري، و `baseConversationId` الصريح، وأي `parentConversationCandidates`.
عندما تعيد `parentConversationCandidates`، أبقِها مرتبة من الأصل الأضيق إلى
المحادثة الأوسع/الأساسية.

استخدم `openclaw/plugin-sdk/channel-route` عندما تحتاج شفرة Plugin إلى تطبيع
حقول شبيهة بالمسارات، أو مقارنة سلسلة فرعية بمسارها الأصل، أو بناء مفتاح
إزالة تكرار ثابت من `{ channel, to, accountId, threadId }`. يطبع المساعد
معرّفات السلاسل الرقمية بالطريقة نفسها التي تفعلها النواة، لذلك ينبغي
لـ Plugins تفضيله على مقارنات `String(threadId)` المخصصة.
ينبغي لـ Plugins ذات قواعد الأهداف الخاصة بالمزوّد أن تكشف
`messaging.resolveOutboundSessionRoute(...)` حتى تحصل النواة على هوية الجلسة
والسلسلة الأصلية للمزوّد من دون استخدام حشوات تحليل.

يمكن لـ Plugins المضمنة التي تحتاج إلى التحليل نفسه قبل تشغيل سجل القنوات أن
تكشف أيضاً ملف `session-key-api.ts` على المستوى الأعلى مع تصدير مطابق باسم
`resolveSessionConversation(...)`. تستخدم النواة هذا السطح الآمن للتمهيد فقط
عندما لا يكون سجل Plugins في وقت التشغيل متاحاً بعد.

يظل `messaging.resolveParentConversationCandidates(...)` متاحاً كبديل توافق
قديم عندما لا يحتاج Plugin إلا إلى بدائل الأصل فوق المعرّف العام/الخام. إذا
وجد الخطافان معاً، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولاً ولا
تعود إلى `resolveParentConversationCandidates(...)` إلا عندما يحذفها الخطاف
القياسي.

## الموافقات وقدرات القنوات

لا تحتاج معظم Plugins القنوات إلى شفرة خاصة بالموافقات.

- تملك النواة `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقات.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلية/عرض/مصادقة الموافقة على `approvalCapability`.
- `plugin.auth` مخصص لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` هما سطح مصادقة الموافقة المعياري.
- استخدم `approvalCapability.getActionAvailabilityState` لتوافر مصادقة الموافقة داخل المحادثة نفسها. أبقِ الموافقين المهيئين متاحين لـ `/approve` حتى عندما يكون التسليم الأصلي معطلًا؛ واستخدم حالة سطح البدء الأصلي لإرشادات التسليم/الإعداد بدلًا من ذلك.
- إذا كانت قناتك تعرض موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. تستخدم النواة ذلك الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتقرير ما إذا كانت قناة البدء تدعم موافقات exec الأصلية، وتضمين القناة في إرشادات الاحتياط للعميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلي أو قمع الاحتياط.
- استخدم `approvalCapability.nativeRuntime` لحقائق الموافقة الأصلية المملوكة للقناة. أبقه كسولًا في نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع الاستمرار في السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات exec الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على قنوات الحسابات المسماة عرض مسارات مقيّدة بالحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الافتراضات على المستوى الأعلى.
- استخدم `approvalCapability.describePluginApprovalSetup` عندما تكون إرشادات فشل موافقة Plugin آمنة للعرض عند فشل موافقة Plugin بسبب عدم وجود مسار أو انتهاء المهلة. لا يستنتج `createApproverRestrictedNativeApprovalCapability(...)` هذا من `describeExecApprovalSetup`؛ مرّر المساعد نفسه صراحةً فقط عندما تستخدم موافقات Plugin وexec الإعداد الأصلي نفسه فعلًا.
- إذا كانت القناة تستطيع استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعداد الحالي، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها دون إضافة منطق نواة خاص بالموافقات.
- إذا كانت مصادقة الموافقة المخصصة تسمح عمدًا بالاحتياط داخل المحادثة نفسها فقط، فأعد `markImplicitSameChatApprovalAuthorization({ authorized: true })` من `openclaw/plugin-sdk/approval-auth-runtime`؛ وإلا تعامل النواة النتيجة كتفويض صريح للموافق.
- إذا كان رد نداء أصلي مملوك للقناة يحلّ الموافقات مباشرة، فاستخدم `isImplicitSameChatApprovalAuthorization(...)` قبل الحل بحيث يظل الاحتياط الضمني يمر عبر تفويض الفاعل الطبيعي للقناة.
- إذا احتاجت القناة إلى تسليم موافقة أصلي، فأبقِ كود القناة مركزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، والانتهاء، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى بضعة أسطح أصغر:
- استخدم `createNativeApprovalChannelRouteGates` من `openclaw/plugin-sdk/approval-native-runtime` عندما تدعم القناة كلًا من التسليم الأصلي من أصل الجلسة وأهداف تمرير الموافقات الصريحة. يركز المساعد اختيار إعداد الموافقة، ومعالجة `mode`، ومرشحات الوكيل/الجلسة، وربط الحساب، ومطابقة هدف الجلسة، ومطابقة قائمة الأهداف، بينما يظل المتصلون يملكون معرف القناة، ووضع التمرير الافتراضي، والبحث عن الحساب، وفحص تمكين النقل، وتطبيع الهدف، وحل هدف مصدر الدور. لا تستخدمه لإنشاء افتراضات سياسة قناة مملوكة للنواة؛ مرّر الوضع الافتراضي الموثق للقناة صراحةً.
- يستخدم `createChannelNativeOriginTargetResolver` مطابِق مسار القناة المشترك افتراضيًا لأهداف `{ to, accountId, threadId }`. مرّر `targetsMatch` فقط عندما تكون لدى القناة قواعد تكافؤ خاصة بالمزوّد، مثل مطابقة بادئة الطابع الزمني في Slack.
- مرّر `normalizeTargetForMatch` إلى `createChannelNativeOriginTargetResolver` عندما تحتاج القناة إلى جعل معرفات المزوّد معيارية قبل تشغيل مطابِق المسار الافتراضي أو رد نداء `targetsMatch` مخصص، مع الحفاظ على الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما يجب جعل هدف التسليم المحلول نفسه معياريًا.
- `availability` - ما إذا كان الحساب مهيأً وما إذا كان يجب التعامل مع الطلب
- `presentation` - تعيين نموذج عرض الموافقة المشترك إلى حمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` - تحضير الأهداف وإرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` - خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية، إضافة إلى خطاف `cancelDelivered` اختياري. نفّذ `cancelDelivered` عندما يسجل `deliverPending` حالة داخل العملية أو مستمرة (مثل مخزن أهداف التفاعل) بحيث يمكن تحرير تلك الحالة إذا أوقف توقف المعالج التسليم قبل تشغيل `bindPending` أو عندما لا يعيد `bindPending` أي مقبض
- `observe` - خطافات اختيارية لتشخيص التسليم
- إذا احتاجت القناة إلى كائنات مملوكة لوقت التشغيل مثل عميل أو رمز أو تطبيق Bolt أو مستقبل Webhook، فسجلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة تمهيد معالجات مدفوعة بالإمكانات من حالة بدء القناة دون إضافة غراء أغلفة خاص بالموافقات.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` الأقل مستوى إلا عندما لا يكون السطح المدفوع بالإمكانات معبرًا بما يكفي بعد.
- يجب على قنوات الموافقة الأصلية تمرير كل من `accountId` و`approvalKind` عبر تلك المساعدات. يحافظ `accountId` على سياسة الموافقة متعددة الحسابات مقيّدة بحساب الروبوت الصحيح، ويحافظ `approvalKind` على إتاحة سلوك موافقات exec مقابل Plugin للقناة دون فروع صلبة الترميز في النواة.
- تملك النواة الآن إشعارات إعادة توجيه الموافقة أيضًا. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها مثل "ذهبت الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بدلًا من ذلك، اكشف توجيه الأصل + الرسائل المباشرة للموافق بدقة عبر مساعدات إمكانية الموافقة المشتركة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى محادثة البدء.
- حافظ على نوع معرف الموافقة المسلّمة من البداية إلى النهاية. يجب ألا
  تخمّن العملاء الأصليون أو تعيد كتابة توجيه موافقة exec مقابل Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تعرض عمدًا أسطحًا أصلية مختلفة.
  أمثلة مضمّنة حاليًا:
  - يبقي Slack توجيه الموافقة الأصلي متاحًا لكل من معرفات exec وPlugin.
  - يبقي Matrix توجيه الرسائل المباشرة/القنوات الأصلي نفسه وتجربة التفاعل لموافقات exec
    وPlugin، مع السماح في الوقت نفسه باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن يفضل الكود الجديد باني الإمكانية ويكشف `approvalCapability` على Plugin.

لنقاط دخول القنوات الساخنة، فضّل مسارات وقت التشغيل الفرعية الأضيق عندما تحتاج
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
`openclaw/plugin-sdk/reply-reference`, و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح المظلي الأوسع.

بالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  `createSetupTranslator`، ومحولات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  `promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  وكيل الإعداد المفوضين
- يتضمن `openclaw/plugin-sdk/setup-runtime` سطح المحول الواعي بالبيئة لـ
  `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة إعداد التثبيت الاختياري
  إضافة إلى بضعة بدائيات آمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعة بالبيئة، ويجب أن تعرف
تدفقات البدء/الإعداد العامة أسماء تلك البيئة قبل تحميل وقت التشغيل، فأعلن عنها في
بيان Plugin باستخدام `channelEnvVars`. أبقِ `envVars` وقت تشغيل القناة أو الثوابت المحلية
للنصوص الموجهة للمشغل فقط.

إذا كان يمكن أن تظهر قناتك في `status` أو `channels list` أو `channels status` أو
فحوصات SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول تلك آمنة للاستيراد في مسارات أوامر
للقراءة فقط، ويجب أن تعيد بيانات تعريف القناة، ومحول الإعداد الآمن للإعداد، ومحول الحالة،
وبيانات تعريف أهداف أسرار القناة اللازمة لتلك الملخصات. لا تبدأ
العملاء أو المستمعين أو أزمنة تشغيل النقل من مدخل الإعداد.

أبقِ مسار استيراد مدخل القناة الرئيسي ضيقًا أيضًا. يمكن للاكتشاف تقييم
المدخل ووحدة Plugin القناة لتسجيل الإمكانات دون تنشيط
القناة. يجب أن تصدّر ملفات مثل `channel-plugin-api.ts` كائن Plugin القناة
دون استيراد معالجات الإعداد، أو عملاء النقل، أو مستمعي المقابس،
أو مشغلات العمليات الفرعية، أو وحدات بدء الخدمة. ضع تلك أجزاء وقت التشغيل
في وحدات محملة من `registerFull(...)`، أو مضبطات وقت التشغيل، أو
محولات الإمكانات الكسولة.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- استخدم سطح `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الإعداد المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح الإعداد،
فضّل `createOptionalChannelSetupSurface(...)`. يفشل
المحول/المعالج المُنشأ بإغلاق آمن عند كتابات الإعداد والإنهاء، ويعيد استخدام
رسالة طلب التثبيت نفسها عبر التحقق، والإنهاء، ونص رابط الوثائق.

بالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على
الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة و
  الرجوع الاحتياطي إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/channel-inbound` لمسار/غلاف الوارد و
  توصيل التسجيل والإرسال
- `openclaw/plugin-sdk/channel-targets` لمساعدات تحليل الأهداف
- `openclaw/plugin-sdk/outbound-media` لتحميل الوسائط و
  `openclaw/plugin-sdk/channel-outbound` لهوية الصادر/مندوبي الإرسال
  وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما ينبغي لمسار صادر الحفاظ على
  `replyToId`/`threadId` صريح أو استعادة جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقا. يمكن لـ Plugins المزوّدين تجاوز
  الأولوية، وسلوك اللاحقة، وتطبيع معرّف السلسلة عندما تكون لمنصتهم
  دلالات تسليم سلاسل أصلية.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئ
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط حقول حمولة
  عميل/وسائط قديم مطلوبا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر مستقر عند الرجوع الاحتياطي

يمكن لقنوات المصادقة فقط غالبا التوقف عند المسار الافتراضي: يتولى القلب الموافقات ولا يعرّض الـ Plugin سوى قدرات الصادر/المصادقة. ينبغي لقنوات الموافقة الأصلية مثل Matrix وSlack وTelegram وناقلات الدردشة المخصصة استخدام المساعدات الأصلية المشتركة بدلا من بناء دورة حياة موافقة خاصة بها.

## سياسة الإشارات الواردة

أبقِ التعامل مع الإشارات الواردة مقسوما إلى طبقتين:

- جمع الأدلة المملوك للـ Plugin
- تقييم السياسة المشترك

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى برميل المساعدات
الواردة الأوسع.

مناسب جيدا للمنطق المحلي للـ Plugin:

- اكتشاف الرد على الروبوت
- اكتشاف اقتباس الروبوت
- فحوصات المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- التخزينات المؤقتة الأصلية للمنصة اللازمة لإثبات مشاركة الروبوت

مناسب جيدا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضل:

1. احسب حقائق الإشارة المحلية.
2. مرّر تلك الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned`، و`decision.shouldBypassMention`، و`decision.shouldSkip` في بوابة الوارد لديك.

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

يعرّض `api.runtime.channel.mentions` مساعدات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على الحقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل
الوارد غير ذات الصلة.

استخدم `resolveInboundMentionDecision({ facts, policy })` لتقييد الإشارات.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    أنشئ ملفات الـ Plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. للاطلاع على سطح بيانات تعريف الحزمة الكامل،
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
    للإعدادات المملوكة للـ Plugin التي ليست إعداد حساب القناة. يتحقق `channelConfigs`
    من `channels.acme-chat` وهو مصدر المسار البارد الذي تستخدمه أسطح مخطط
    الإعداد، والإعداد الأولي، وواجهة المستخدم قبل تحميل وقت تشغيل الـ Plugin.

  </Step>

  <Step title="Build the channel plugin object">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
    بالحد الأدنى - `id` و`setup` - وأضف المهايئات حسب حاجتك إليها.

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

    للقنوات التي تقبل كلا من مفاتيح الرسائل المباشرة العلوية القياسية والمفاتيح المتداخلة القديمة، استخدم المساعدات من `plugin-sdk/channel-config-helpers`: يحافظ `resolveChannelDmAccess`، و`resolveChannelDmPolicy`، و`resolveChannelDmAllowFrom`، و`normalizeChannelDmPolicy` على القيم المحلية للحساب قبل قيم الجذر الموروثة. اقرن محلل القيم نفسه بإصلاح doctor عبر `normalizeLegacyDmAliases` لكي يقرأ وقت التشغيل والترحيل العقد نفسه.

    <Accordion title="What createChatChannelPlugin does for you">
      بدلا من تنفيذ واجهات المهايئات منخفضة المستوى يدويا، تمرر
      خيارات تصريحية ويؤلفها الباني:

      | الخيار | ما يوصله |
      | --- | --- |
      | `security.dm` | محلل أمان الرسائل المباشرة المحدد النطاق من حقول الإعداد |
      | `pairing.text` | تدفق إقران رسائل مباشرة نصي مع تبادل الرمز |
      | `threading` | محلل وضع الرد على (ثابت، محدد بنطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرفات الرسائل) |

      يمكنك أيضا تمرير كائنات مهايئ خام بدلا من الخيارات التصريحية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تعرّف مهايئات الصادر الخام دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم
      مثل `maxLinesPerMessage`؛ طبقه قبل الإرسال لكي تُحل سلسلة الردود
      وحدود الأجزاء مرة واحدة بواسطة التسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضا `replyToIdSource` (`implicit` أو `explicit`)
      عندما يتم حل هدف رد أصلي، بحيث تستطيع مساعدات الحمولة الحفاظ على
      وسوم الرد الصريحة دون استهلاك خانة رد ضمنية أحادية الاستخدام.
    </Accordion>

  </Step>

  <Step title="Wire the entry point">
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

    ضع واصفات CLI المملوكة للقناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في مساعدة الجذر من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تظل التحميلات الكاملة العادية تلتقط الواصفات نفسها لتسجيل الأوامر
    الفعلي. أبقِ `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل طرق Gateway RPC، فاستخدم بادئة
    خاصة بالـ plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) للاطلاع على كل
    الخيارات.

  </Step>

  <Step title="Add a setup entry">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء التهيئة:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطلة
    أو غير مكوّنة. يتجنب ذلك جلب كود وقت التشغيل الثقيل أثناء تدفقات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل الصادرات الآمنة للإعداد في وحدات
    جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    مضبط وقت تشغيل صريح أثناء الإعداد.

  </Step>

  <Step title="Handle inbound messages">
    يحتاج الـ plugin لديك إلى استلام الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب
    ويمرره عبر معالج الوارد الخاص بقناتك:

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
      معالجة الرسائل الواردة خاصة بالقناة. يمتلك كل channel plugin
      خط معالجة الوارد الخاص به. راجع channel plugins المضمّنة
      (مثل حزمة Microsoft Teams أو Google Chat plugin) للاطلاع على أنماط فعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    للمساعدات المشتركة للاختبار، راجع [الاختبار](/ar/plugins/sdk-testing).

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
    أوضاع رد ثابتة أو مقيّدة بالحساب أو مخصصة
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType وlooksLikeId وreservedLiterals وresolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="Channel inbound API" icon="bolt" href="/ar/plugins/sdk-channel-inbound">
    دورة حياة الحدث الوارد المشتركة: الاستيعاب، الحل، التسجيل، الإرسال، الإنهاء
  </Card>
</CardGroup>

<Note>
لا تزال بعض نقاط التوصيل المساعدة المضمّنة موجودة لصيانة bundled-plugin
والتوافق. ليست هي النمط الموصى به لـ channel plugins الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك إلا إذا كنت تصون عائلة ذلك الـ plugin المضمّن مباشرة.
</Note>

## الخطوات التالية

- [Provider Plugins](/ar/plugins/sdk-provider-plugins) - إذا كان الـ plugin لديك يوفر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) - أدوات الاختبار واختبارات العقود
- [بيان الـ Plugin](/ar/plugins/manifest) - مخطط البيان الكامل

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Agent harness plugins](/ar/plugins/sdk-agent-harness)

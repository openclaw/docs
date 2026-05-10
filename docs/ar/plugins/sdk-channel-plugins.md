---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة مهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة في OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-05-10T19:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 769ccd09eea0df78337822f41da58dc20ec2950409d39d4d19a5f92a35ec49ed
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يرشدك هذا الدليل إلى إنشاء Plugin قناة يربط OpenClaw بمنصة
مراسلة. بحلول النهاية سيكون لديك قناة عاملة مع أمان الرسائل المباشرة،
والإقران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin في OpenClaw من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولا للتعرف على بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات إرسال/تعديل/تفاعل خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في النواة. يمتلك Plugin الخاص بك:

- **الإعدادات** - حل الحساب ومعالج الإعداد
- **الأمان** - سياسة الرسائل المباشرة وقوائم السماح
- **الإقران** - تدفق الموافقة عبر الرسائل المباشرة
- **قواعد الجلسة** - كيفية ربط معرفات المحادثات الخاصة بالمزود بالمحادثات الأساسية ومعرفات السلاسل والبدائل الأصلية
- **الصادر** - إرسال النص والوسائط والاستطلاعات إلى المنصة
- **تسلسل المحادثات** - كيفية ربط الردود بالسلاسل
- **مؤشرات الكتابة في Heartbeat** - إشارات كتابة/انشغال اختيارية لأهداف تسليم Heartbeat

تمتلك النواة أداة الرسائل المشتركة، وتوصيل المطالبات، وشكل مفتاح الجلسة الخارجي،
وتسجيل `:thread:` العام، والتوجيه.

ينبغي أن تعرض Plugins القنوات الجديدة أيضا محول `message` باستخدام
`defineChannelMessageAdapter` من `openclaw/plugin-sdk/channel-message`. يعلن
المحول قدرات الإرسال النهائي المتينة التي يدعمها النقل الأصلي فعليا، ويوجه
إرسال النص/الوسائط إلى دوال النقل نفسها مثل محول `outbound` القديم. لا تعلن
عن قدرة إلا عندما يثبت اختبار عقد الأثر الجانبي الأصلي والإيصال المعاد.
للعقد الكامل للواجهة البرمجية، والأمثلة، ومصفوفة القدرات، وقواعد الإيصالات،
وإنهاء المعاينة الحية، وسياسة إقرار الاستلام، والاختبارات، وجدول الترحيل، راجع
[واجهة برمجة رسائل القناة](/ar/plugins/sdk-channel-message).
إذا كان محول `outbound` الحالي يتضمن بالفعل دوال الإرسال الصحيحة وبيانات
تعريف القدرات، فاستخدم `createChannelMessageAdapterFromOutbound(...)`
لاشتقاق محول `message` بدلا من كتابة جسر آخر يدويا.
ينبغي أن تعيد عمليات إرسال المحول قيما من نوع `MessageReceipt`. عندما لا تزال
شيفرة التوافق تحتاج إلى المعرفات القديمة، فاشتقها باستخدام
`listMessageReceiptPlatformIds(...)` أو `resolveMessageReceiptPrimaryId(...)`
بدلا من الاحتفاظ بحقول `messageIds` موازية في شيفرة دورة الحياة الجديدة.
ينبغي للقنوات القادرة على المعاينة أن تعلن أيضا عن `message.live.capabilities`
مع دورة الحياة الحية الدقيقة التي تمتلكها، مثل `draftPreview` أو
`previewFinalization` أو `progressUpdates` أو `nativeStreaming` أو
`quietFinalization`. وينبغي للقنوات التي تنهي معاينة مسودة في موضعها أن
تعلن أيضا عن `message.live.finalizer.capabilities`، مثل `finalEdit` و
`normalFallback` و `discardPending` و `previewReceipt` و
`retainOnAmbiguousFailure`، وأن توجه منطق وقت التشغيل عبر
`defineFinalizableLivePreviewAdapter(...)` إضافة إلى
`deliverWithFinalizableLivePreviewAdapter(...)`. أبق هذه القدرات مدعومة
باختبارات `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` حتى لا ينحرف سلوك المعاينة
الأصلية، والتقدم، والتعديل، والبديل/الاحتفاظ، والتنظيف، والإيصالات بصمت.
ينبغي للمستقبلات الواردة التي تؤجل إقرارات المنصة أن تعلن
`message.receive.defaultAckPolicy` و `supportedAckPolicies` بدلا من إخفاء
توقيت الإقرار في حالة محلية للمراقب. غط كل سياسة معلنة باستخدام
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

تظل أدوات الرد/الدور القديمة مثل `createChannelTurnReplyPipeline` و
`dispatchInboundReplyWithBase` و `recordInboundSessionAndDispatchReply`
متاحة لموجهات التوافق. لا تستخدم هذه الأسماء في شيفرة القنوات الجديدة؛ ينبغي
أن تبدأ Plugins الجديدة بمحول `message`، والإيصالات، ومساعدات دورة حياة
الاستقبال/الإرسال على `openclaw/plugin-sdk/channel-message`.

يمكن للقنوات التي ترحل تفويض الوارد استخدام المسار الفرعي التجريبي
`openclaw/plugin-sdk/channel-ingress-runtime` من مسارات الاستقبال في وقت التشغيل.
يبقي المسار الفرعي بحث المنصة والآثار الجانبية داخل Plugin، مع مشاركة حل حالة
قائمة السماح، وقرارات المسار/المرسل/الأمر/الحدث/التفعيل، والتشخيصات المنقحة،
وربط قبول الدور. أبق تطبيع هوية Plugin في الواصف الذي تمرره إلى المحلل؛ لا
تسلسل قيم المطابقة الخام من الحالة أو القرار المحلول. راجع
[واجهة برمجة دخول القناة](/ar/plugins/sdk-channel-ingress) لتصميم الواجهة
البرمجية، وحدود الملكية، وتوقعات الاختبار.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاعرض
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع هدف تسليم
Heartbeat المحلول قبل بدء تشغيل نموذج Heartbeat، وتستخدم دورة حياة إبقاء
الكتابة/التنظيف المشتركة. أضف `heartbeat.clearTyping(...)` عندما تحتاج المنصة
إلى إشارة إيقاف صريحة.

إذا أضافت قناتك معاملات لأداة الرسائل تحمل مصادر وسائط، فاعرض أسماء هذه
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة هذه
القائمة الصريحة لتطبيع مسارات صندوق الحماية وسياسة الوصول إلى الوسائط الصادرة،
لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصورة الرمزية
أو المرفق أو صورة الغلاف الخاصة بالمزود.
يفضل إرجاع خريطة بمفاتيح الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
ذات الصلة وسائط إجراء آخر. ما تزال المصفوفة المسطحة تعمل للمعاملات المشتركة
عمدا عبر كل إجراء معروض.

إذا احتاجت قناتك إلى تشكيل خاص بالمزود من أجل `message(action="send")`،
فيفضل استخدام `actions.prepareSendPayload(...)`. ضع البطاقات الأصلية أو
الكتل أو التضمينات أو البيانات المتينة الأخرى تحت
`payload.channelData.<channel>` ودع النواة تنفذ الإرسال الفعلي عبر محول
الصادر/الرسائل. استخدم `actions.handleAction(...)` للإرسال فقط كبديل توافق
للحمولات التي لا يمكن تسلسلها وإعادة المحاولة عليها.

إذا كانت منصتك تخزن نطاقا إضافيا داخل معرفات المحادثات، فأبق هذا التحليل في
Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو الخطاف
المعياري لربط `rawId` بمعرف المحادثة الأساسية، ومعرف سلسلة اختياري، و
`baseConversationId` صريح، وأي `parentConversationCandidates`. عندما تعيد
`parentConversationCandidates`، فأبقها مرتبة من الأصل الأضيق إلى المحادثة
الأوسع/الأساسية.

استخدم `openclaw/plugin-sdk/channel-route` عندما تحتاج شيفرة Plugin إلى تطبيع
حقول شبيهة بالمسارات، أو مقارنة سلسلة فرعية بمسارها الأصلي، أو بناء مفتاح
إزالة تكرار ثابت من `{ channel, to, accountId, threadId }`. يطبع المساعد
معرفات السلاسل الرقمية بالطريقة نفسها التي تفعلها النواة، لذلك ينبغي أن تفضله
Plugins على مقارنات `String(threadId)` المخصصة.
يمكن أن تحقن Plugins ذات قواعد الهدف الخاصة بالمزود محللها في
`resolveChannelRouteTargetWithParser(...)` ومع ذلك تحصل على شكل هدف المسار
نفسه ودلالات الرجوع إلى السلسلة التي تستخدمها النواة.

يمكن أيضا لـ Plugins المضمنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل القنوات
أن تعرض ملف `session-key-api.ts` في المستوى الأعلى مع تصدير
`resolveSessionConversation(...)` مطابق. تستخدم النواة هذا السطح الآمن للتمهيد
فقط عندما لا يكون سجل Plugins في وقت التشغيل متاحا بعد.

يظل `messaging.resolveParentConversationCandidates(...)` متاحا كبديل توافق قديم
عندما لا يحتاج Plugin إلا إلى البدائل الأصلية فوق المعرف العام/الخام. إذا وجد
الخطافان معا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولا ولا ترجع إلى
`resolveParentConversationCandidates(...)` إلا عندما يحذفها الخطاف المعياري.

## الموافقات وقدرات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقة.

- تمتلك النواة `/approve` في نفس الدردشة، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقات.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلية/عرض/مصادقة الموافقة على `approvalCapability`.
- `plugin.auth` مخصص لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقات من ذلك الكائن.
- `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` هما خط تماس مصادقة الموافقات القياسي.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة في نفس الدردشة.
- إذا كانت قناتك تعرض موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة في نفس الدردشة. تستخدم النواة ذلك الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة البادئة تدعم موافقات exec الأصلية، وتضمين القناة في إرشادات الرجوع الاحتياطي للعميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو كبت الرجوع الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` لحقائق الموافقة الأصلية المملوكة للقناة. أبقه كسولًا في نقاط دخول القناة كثيرة الاستخدام باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، والذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعدادات الدقيقة اللازمة لتمكين موافقات exec الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ يجب أن تعرض قنوات الحسابات المسماة مسارات محددة النطاق للحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية على المستوى الأعلى.
- إذا كان بإمكان قناة استنتاج هويات DM مستقرة شبيهة بالمالك من الإعدادات الحالية، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` في نفس الدردشة دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا احتاجت قناة إلى تسليم موافقة أصلي، فاجعل كود القناة مركزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك ترشيح الطلبات، والتوجيه، وإزالة التكرار، وانتهاء الصلاحية، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى بضعة خطوط تماس أصغر:
- يستخدم `createChannelNativeOriginTargetResolver` مطابق مسارات القنوات المشترك افتراضيًا لأهداف `{ to, accountId, threadId }`. مرّر `targetsMatch` فقط عندما تمتلك قناة قواعد تكافؤ خاصة بالمزوّد، مثل مطابقة بادئة الطابع الزمني في Slack.
- مرّر `normalizeTargetForMatch` إلى `createChannelNativeOriginTargetResolver` عندما تحتاج القناة إلى جعل معرّفات المزوّد قياسية قبل تشغيل مطابق المسارات الافتراضي أو رد نداء `targetsMatch` مخصص، مع الحفاظ على الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما يجب جعل هدف التسليم المحلول نفسه قياسيًا.
- `availability` - ما إذا كان الحساب مضبوطًا وما إذا كان يجب التعامل مع الطلب
- `presentation` - تعيين نموذج عرض الموافقة المشترك إلى حمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` - تحضير الأهداف وإرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` - خطافات ربط/إلغاء ربط/مسح إجراء اختيارية للأزرار أو التفاعلات الأصلية
- `observe` - خطافات تشخيص التسليم الاختيارية
- إذا احتاجت القناة إلى كائنات مملوكة لوقت التشغيل مثل عميل، أو رمز، أو تطبيق Bolt، أو مستقبل Webhook، فسجلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة تمهيد المعالجات المدفوعة بالقدرات من حالة بدء تشغيل القناة دون إضافة غراء تغليف خاص بالموافقة.
- استخدم `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا يكون خط التماس المدفوع بالقدرات معبرًا بما يكفي بعد.
- يجب أن تمرر قنوات الموافقة الأصلية كلًا من `accountId` و`approvalKind` عبر تلك المساعدات. يُبقي `accountId` سياسة موافقة الحسابات المتعددة محصورة في حساب البوت الصحيح، ويُبقي `approvalKind` سلوك موافقات exec مقابل Plugin متاحًا للقناة دون فروع ثابتة في النواة.
- تمتلك النواة الآن إشعارات إعادة توجيه الموافقة أيضًا. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "ذهبت الموافقة إلى DMs / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بدلًا من ذلك، اعرض توجيهًا دقيقًا للمنشأ + DM الموافق عبر مساعدات قدرة الموافقة المشتركة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار عائد إلى الدردشة البادئة.
- حافظ على نوع معرّف الموافقة المسلّم من البداية إلى النهاية. يجب ألا
  تخمن العملاء الأصلية أو تعيد كتابة توجيه موافقة exec مقابل Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تعرض أسطحًا أصلية مختلفة عمدًا.
  الأمثلة المضمّنة الحالية:
  - يحافظ Slack على توفر توجيه الموافقة الأصلي لكل من معرّفات exec وPlugin.
  - يحافظ Matrix على نفس توجيه DM/القناة الأصلي وتجربة تفاعلات الموافقة لكل من موافقات exec
    وPlugin، مع السماح في الوقت نفسه للمصادقة بالاختلاف حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن يفضل الكود الجديد باني القدرة ويعرض `approvalCapability` على Plugin.

لنقاط دخول القناة كثيرة الاستخدام، فضّل مسارات وقت التشغيل الفرعية الأضيق عندما تحتاج
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
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح المظلي
الأوسع.

بالنسبة للإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  محولات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  وكيل الإعداد المفوض
- يتضمن `openclaw/plugin-sdk/setup-runtime` خط تماس المحول المدرك للبيئة لـ
  `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة إعداد التثبيت الاختياري
  بالإضافة إلى بضعة بدائيات آمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم الإعداد أو المصادقة المدفوعة بالبيئة ويجب أن تعرف
تدفقات البدء/الإعداد العامة أسماء تلك المتغيرات قبل تحميل وقت التشغيل، فأعلن عنها في
بيان Plugin باستخدام `channelEnvVars`. أبقِ `envVars` الخاصة بوقت تشغيل القناة أو الثوابت المحلية
للنص الموجّه للمشغلين فقط.

إذا كان بإمكان قناتك الظهور في `status` أو `channels list` أو `channels status` أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات أوامر
للقراءة فقط، ويجب أن تعيد بيانات وصفية للقناة، ومحول إعدادات آمنًا للإعداد، ومحول حالة،
وبيانات وصفية لأهداف أسرار القناة اللازمة لتلك الملخصات. لا
تبدأ العملاء أو المستمعين أو أوقات تشغيل النقل من مدخل الإعداد.

أبقِ مسار استيراد مدخل القناة الرئيسي ضيقًا أيضًا. يمكن للاكتشاف تقييم
المدخل ووحدة Plugin القناة لتسجيل القدرات دون تفعيل
القناة. يجب أن تصدر ملفات مثل `channel-plugin-api.ts` كائن Plugin القناة
دون استيراد معالجات الإعداد، أو عملاء النقل، أو مستمعي المقابس،
أو مشغلات العمليات الفرعية، أو وحدات بدء تشغيل الخدمات. ضع قطع وقت التشغيل هذه
في وحدات تُحمّل من `registerFull(...)`، أو محددات وقت التشغيل، أو محولات
قدرات كسولة.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم خط تماس `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الضبط المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح
الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المحول/المعالج المنشأ بإغلاق آمن عند كتابة الإعدادات والإتمام، ويعيدان استخدام
نفس رسالة طلب التثبيت عبر التحقق، والإتمام، ونص رابط الوثائق.

لمسارات القناة الأخرى كثيرة الاستخدام، فضّل المساعدات الضيقة على
الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  والرجوع الاحتياطي للحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لمسار/غلاف الوارد
  وتوصيل التسجيل والإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوضات الهوية/الإرسال الصادرة وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ مسار صادر على
  `replyToId`/`threadId` صريح أو يستعيد جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. يمكن لـ Plugins المزوّدين تجاوز
  الأولوية، وسلوك اللاحقة، وتطبيع معرّف السلسلة عندما تمتلك منصتهم
  دلالات تسليم سلاسل أصلية.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المحولات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط حقل حمولة
  الوكيل/الوسائط القديم مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع أوامر Telegram المخصصة،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر مستقر عند الرجوع الاحتياطي

يمكن للقنوات الخاصة بالمصادقة فقط عادةً التوقف عند المسار الافتراضي: تتعامل النواة مع الموافقات ويعرض Plugin قدرات الصادر/المصادقة فقط. يجب أن تستخدم قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ونقل الدردشة المخصص المساعدات الأصلية المشتركة بدلًا من إنشاء دورة حياة موافقة خاصة بها.

## سياسة الإشارة الواردة

أبقِ معالجة الإشارات الواردة مقسمة إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى حزمة مساعدات الوارد
الأوسع.

ملائم جيدًا للمنطق المحلي في Plugin:

- اكتشاف الرد على البوت
- اكتشاف الاقتباس من البوت
- فحوصات مشاركة السلسلة
- استثناءات رسائل الخدمة/النظام
- ذاكرات التخزين المؤقت الأصلية للمنصة اللازمة لإثبات مشاركة البوت

ملائم جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأمر
- قرار التخطي النهائي

التدفق المفضل:

1. احسب حقائق الإشارة المحلية.
2. مرر تلك الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
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
لـplugins القنوات المضمنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل الوارد
غير ذات الصلة.

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب أن تستخدم الشيفرة الجديدة
`resolveInboundMentionDecision({ facts, policy })`.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="Package and manifest">
    أنشئ ملفات plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا plugin قناة. للاطلاع على سطح بيانات تعريف الحزمة الكامل،
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
    للإعدادات المملوكة للـplugin التي ليست تكوين حساب القناة. يتحقق `channelConfigs`
    من `channels.acme-chat` وهو مصدر المسار البارد الذي تستخدمه أسطح مخطط التكوين
    والإعداد وواجهة المستخدم قبل تحميل وقت تشغيل plugin.

  </Step>

  <Step title="Build the channel plugin object">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المحولات الاختيارية. ابدأ
    بالحد الأدنى - `id` و`setup` - وأضف المحولات عند الحاجة إليها.

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

    بالنسبة إلى القنوات التي تقبل مفاتيح DM العلوية القياسية والمفاتيح المتداخلة القديمة، استخدم المساعدات من `plugin-sdk/channel-config-helpers`: تحافظ `resolveChannelDmAccess` و`resolveChannelDmPolicy` و`resolveChannelDmAllowFrom` و`normalizeChannelDmPolicy` على القيم المحلية للحساب قبل قيم الجذر الموروثة. اربط المحلل نفسه بإصلاح doctor عبر `normalizeLegacyDmAliases` حتى يقرأ وقت التشغيل والترحيل العقد نفسه.

    <Accordion title="What createChatChannelPlugin does for you">
      بدلا من تنفيذ واجهات المحولات منخفضة المستوى يدويا، تمرر
      خيارات تعريفية ويؤلفها المنشئ:

      | الخيار | ما يربطه |
      | --- | --- |
      | `security.dm` | محلل أمان DM محدد النطاق من حقول التكوين |
      | `pairing.text` | تدفق إقران DM نصي مع تبادل الرمز |
      | `threading` | محلل وضع الرد (ثابت، محدد بنطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرفات الرسائل) |

      يمكنك أيضا تمرير كائنات محول خام بدلا من الخيارات التعريفية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تعرف محولات الصادر الخام دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق في وقت التسليم
      مثل `maxLinesPerMessage`؛ طبقه قبل الإرسال حتى يتم حل ترابط الردود
      وحدود التجزئة مرة واحدة بواسطة تسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضا `replyToIdSource` (`implicit` أو `explicit`)
      عندما يتم حل هدف رد أصلي، بحيث تستطيع مساعدات الحمولة الحفاظ
      على وسوم الرد الصريحة دون استهلاك خانة رد ضمنية أحادية الاستخدام.
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

    ضع واصفات CLI المملوكة للقناة في `registerCliMetadata(...)` حتى يستطيع OpenClaw
    عرضها في تعليمات الجذر دون تنشيط وقت تشغيل القناة الكامل،
    بينما لا تزال التحميلات الكاملة العادية تلتقط الواصفات نفسها لتسجيل الأوامر الفعلي.
    احتفظ بـ`registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل طرق Gateway RPC، فاستخدم
    بادئة خاصة بالـplugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`،
    `exec.approvals.*`، `wizard.*`، `update.*`) محجوزة وتتحلل دائما
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيا. راجع
    [نقاط الإدخال](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لكل
    الخيارات.

  </Step>

  <Step title="Add a setup entry">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمل OpenClaw هذا بدلا من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مكونة. يتجنب ذلك سحب شيفرة وقت التشغيل الثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمنة التي تفصل التصديرات الآمنة للإعداد إلى وحدات جانبية
    استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضا إلى
    محدد صريح لوقت التشغيل أثناء الإعداد.

  </Step>

  <Step title="Handle inbound messages">
    يحتاج plugin لديك إلى تلقي الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب
    ويرسله عبر معالج الوارد في قناتك:

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
      معالجة الرسائل الواردة خاصة بكل قناة. كل Plugin خاص بقناة يملك
      مسار المعالجة الواردة الخاص به. اطّلع على Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin Microsoft Teams أو Google Chat) للاطلاع على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="اختبار">
اكتب اختبارات موضوعة بجانب الكود في `src/channel.test.ts`:

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
  <Card title="خيارات المحادثات المترابطة" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة، أو مرتبطة بالحساب، أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حلّ الهدف" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، وSTT، والوسائط، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="نواة دورة القناة" icon="bolt" href="/ar/plugins/sdk-channel-turn">
    دورة حياة مشتركة للدورة الواردة: الإدخال، الحل، التسجيل، الإرسال، الإنهاء
  </Card>
</CardGroup>

<Note>
لا تزال بعض طبقات المساعدة المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. ليست هي النمط الموصى به لإنشاء Plugins قنوات جديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك، ما لم تكن تصون عائلة Plugins المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins المزوّدين](/ar/plugins/sdk-provider-plugins) - إذا كان Plugin الخاص بك يوفّر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيرادات المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) - أدوات الاختبار واختبارات العقد
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان الكامل

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins حاضنة الوكيل](/ar/plugins/sdk-agent-harness)

---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة محوّل ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugin القنوات
x-i18n:
    generated_at: "2026-05-06T08:06:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69fae0587adfca0b704aea96a2a838cd175a09e4532ad3a9527fb3a21905e4f6
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin قناة يربط OpenClaw بمنصة
مراسلة. وبنهايته سيكون لديك قناة عاملة مع أمان الرسائل الخاصة،
والإقران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولًا للتعرّف على بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات إرسال/تعديل/تفاعل خاصة بها. يحتفظ OpenClaw بأداة
`message` مشتركة واحدة في النواة. يمتلك Plugin الخاص بك:

- **التكوين** - حل الحساب ومعالج الإعداد
- **الأمان** - سياسة الرسائل الخاصة وقوائم السماح
- **الإقران** - تدفق الموافقة عبر الرسائل الخاصة
- **قواعد الجلسة** - كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالدردشات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الصادر** - إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** - كيفية تنظيم الردود في سلاسل
- **كتابة Heartbeat** - إشارات اختيارية للكتابة/الانشغال لأهداف تسليم Heartbeat

تمتلك النواة أداة الرسائل المشتركة، وتوصيل المطالبات، وشكل مفتاح الجلسة الخارجي،
وحفظ سجلات `:thread:` العام، والتوزيع.

ينبغي أن تعرض Plugins القنوات الجديدة أيضًا محوّل `message` باستخدام
`defineChannelMessageAdapter` من `openclaw/plugin-sdk/channel-message`. يعلن
المحوّل قدرات الإرسال النهائي الدائم التي يدعمها النقل الأصلي فعليًا، ويوجّه
إرسالات النص/الوسائط إلى دوال النقل نفسها مثل محوّل `outbound` القديم. لا تعلن
قدرة إلا عندما يثبت اختبار عقد الأثر الجانبي الأصلي والإيصال المُعاد.
للاطلاع على عقد API الكامل، والأمثلة، ومصفوفة القدرات، وقواعد الإيصالات، وإنهاء
المعاينة المباشرة، وسياسة إقرار الاستلام، والاختبارات، وجدول الترحيل، راجع
[API رسائل القنوات](/ar/plugins/sdk-channel-message).
إذا كان محوّل `outbound` الحالي يحتوي بالفعل على طرق الإرسال وبيانات القدرات
الوصفية الصحيحة، فاستخدم `createChannelMessageAdapterFromOutbound(...)` لاشتقاق
محوّل `message` بدلًا من كتابة جسر آخر يدويًا.
ينبغي أن تعيد إرسالات المحوّل قيم `MessageReceipt`. عندما لا يزال كود التوافق
يحتاج إلى معرّفات قديمة، اشتقها باستخدام `listMessageReceiptPlatformIds(...)`
أو `resolveMessageReceiptPrimaryId(...)` بدلًا من الاحتفاظ بحقول
`messageIds` موازية في كود دورة الحياة الجديد.
ينبغي للقنوات القادرة على المعاينة أن تعلن أيضًا `message.live.capabilities` مع
دورة الحياة المباشرة الدقيقة التي تمتلكها، مثل `draftPreview` أو
`previewFinalization` أو `progressUpdates` أو `nativeStreaming` أو
`quietFinalization`. وينبغي للقنوات التي تنهي معاينة مسودة في مكانها أن تعلن
أيضًا `message.live.finalizer.capabilities`، مثل `finalEdit` و
`normalFallback` و `discardPending` و `previewReceipt` و
`retainOnAmbiguousFailure`، وأن توجّه منطق وقت التشغيل عبر
`defineFinalizableLivePreviewAdapter(...)` إضافة إلى
`deliverWithFinalizableLivePreviewAdapter(...)`. أبقِ تلك القدرات مدعومة
باختبارات `verifyChannelMessageLiveCapabilityAdapterProofs(...)` و
`verifyChannelMessageLiveFinalizerProofs(...)` حتى لا ينحرف سلوك المعاينة
الأصلية، والتقدم، والتعديل، والبديل/الاحتفاظ، والتنظيف، والإيصالات بصمت.
ينبغي للمستقبلات الواردة التي تؤجل إقرارات المنصة أن تعلن
`message.receive.defaultAckPolicy` و `supportedAckPolicies` بدلًا من إخفاء توقيت
الإقرار في حالة محلية للمراقب. غطِّ كل سياسة معلنة باستخدام
`verifyChannelMessageReceiveAckPolicyAdapterProofs(...)`.

تظل مساعدات الرد/الدور القديمة مثل `createChannelTurnReplyPipeline` و
`dispatchInboundReplyWithBase` و `recordInboundSessionAndDispatchReply`
متاحة لموزّعات التوافق. لا تستخدم هذه الأسماء في كود القنوات الجديد؛ ينبغي أن
تبدأ Plugins الجديدة بمحوّل `message`، والإيصالات، ومساعدات دورة حياة
الاستقبال/الإرسال في `openclaw/plugin-sdk/channel-message`.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاعرض
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع هدف تسليم
Heartbeat الذي تم حله قبل بدء تشغيل نموذج Heartbeat، وتستخدم دورة حياة إبقاء
الكتابة/تنظيفها المشتركة. أضف `heartbeat.clearTyping(...)` عندما تحتاج المنصة
إلى إشارة إيقاف صريحة.

إذا أضافت قناتك معاملات لأداة الرسائل تحمل مصادر وسائط، فاعرض أسماء تلك
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة تلك
القائمة الصريحة لتطبيع مسارات sandbox وسياسة وصول الوسائط الصادرة، لذلك لا تحتاج
Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصورة الرمزية، أو المرفقات،
أو صور الغلاف الخاصة بالمزوّد.
يفضّل إرجاع خريطة مفهرسة بالإجراء مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
المرتبطة وسائط إجراء آخر. لا تزال المصفوفة المسطحة تعمل للمعاملات المشتركة
عمدًا عبر كل إجراء معروض.

إذا احتاجت قناتك إلى تشكيل خاص بالمزوّد لـ `message(action="send")`،
فيفضّل استخدام `actions.prepareSendPayload(...)`. ضع البطاقات الأصلية أو
الكتل أو التضمينات أو البيانات الدائمة الأخرى تحت
`payload.channelData.<channel>` ودع النواة تنفذ الإرسال الفعلي عبر محوّل
outbound/message. استخدم `actions.handleAction(...)` للإرسال فقط كبديل توافق
للحمولات التي لا يمكن تسلسلها وإعادة محاولتها.

إذا كانت منصتك تخزّن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ ذلك التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو الخطاف
المعياري لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
عندما تعيد `parentConversationCandidates`، أبقِها مرتبة من الأصل الأكثر تحديدًا
إلى المحادثة الأوسع/الأساسية.

استخدم `openclaw/plugin-sdk/channel-route` عندما يحتاج كود Plugin إلى تطبيع
حقول شبيهة بالمسارات، أو مقارنة سلسلة فرعية بمسار أصلها، أو بناء مفتاح إزالة
تكرار مستقر من `{ channel, to, accountId, threadId }`. يطبّع المساعد معرّفات
السلاسل الرقمية بالطريقة نفسها التي تفعلها النواة، لذلك ينبغي أن تفضله Plugins
على مقارنات مخصصة مثل `String(threadId)`.
يمكن لـ Plugins ذات قواعد الأهداف الخاصة بالمزوّد حقن المحلل الخاص بها في
`resolveChannelRouteTargetWithParser(...)` وستظل تحصل على شكل هدف المسار نفسه
ودلالات بديل السلسلة التي تستخدمها النواة.

يمكن لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل القنوات أن
تعرض أيضًا ملف `session-key-api.ts` على المستوى الأعلى مع تصدير
`resolveSessionConversation(...)` مطابق. تستخدم النواة هذا السطح الآمن للإقلاع
فقط عندما لا يكون سجل Plugin وقت التشغيل متاحًا بعد.

يظل `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل توافق قديم
عندما لا يحتاج Plugin إلا إلى بدائل الأصل فوق المعرّف العام/الخام. إذا وُجد
كلا الخطافين، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ولا تعود إلى
`resolveParentConversationCandidates(...)` إلا عندما يحذفها الخطاف المعياري.

## الموافقات وقدرات القناة

معظم Plugins القنوات لا تحتاج إلى كود خاص بالموافقة.

- تمتلك النواة `/approve` داخل نفس الدردشة، وحمولات زر الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقات.
- أُزيل `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلية/عرض/مصادقة الموافقة على `approvalCapability`.
- `plugin.auth` مخصص لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` هما وصلة مصادقة الموافقة المعتمدة.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة داخل نفس الدردشة.
- إذا كانت قناتك تعرض موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل نفس الدردشة. تستخدم النواة ذلك الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة البادئة تدعم موافقات التنفيذ الأصلية، وتضمين القناة في إرشادات الاحتياط للعميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` ذلك للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو كبت الاحتياط.
- استخدم `approvalCapability.nativeRuntime` لحقائق الموافقة الأصلية المملوكة للقناة. أبقه كسولًا في نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل الخاصة بك عند الطلب مع استمرار السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة حقًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مقابض الإعداد الدقيقة اللازمة لتمكين موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ يجب على قنوات الحسابات المسماة عرض مسارات بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الافتراضات العليا.
- إذا كان بإمكان القناة استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعداد الحالي، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل نفس الدردشة دون إضافة منطق نواة خاص بالموافقات.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلي، فأبق كود القناة مركزًا على تسوية الهدف إضافة إلى حقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك ترشيح الطلبات، والتوجيه، وإزالة التكرار، والانتهاء، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. يُقسّم `nativeRuntime` إلى بضع وصلات أصغر:
- يستخدم `createChannelNativeOriginTargetResolver` مطابق مسار القناة المشترك افتراضيًا لأهداف `{ to, accountId, threadId }`. مرّر `targetsMatch` فقط عندما تكون لدى القناة قواعد تكافؤ خاصة بالمزوّد، مثل مطابقة بادئة الطابع الزمني في Slack.
- مرّر `normalizeTargetForMatch` إلى `createChannelNativeOriginTargetResolver` عندما تحتاج القناة إلى جعل معرّفات المزوّد معيارية قبل تشغيل مطابق المسار الافتراضي أو رد نداء `targetsMatch` مخصص، مع الحفاظ على الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما يجب أن يكون هدف التسليم المحلول نفسه معياريًا.
- `availability` - ما إذا كان الحساب مهيأً وما إذا كان يجب التعامل مع طلب
- `presentation` - يربط نموذج عرض الموافقة المشترك بحمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` - يجهز الأهداف ويرسل/يحدّث/يحذف رسائل الموافقة الأصلية
- `interactions` - خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` - خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات مملوكة لوقت التشغيل مثل عميل، أو رمز، أو تطبيق Bolt، أو مستقبِل webhook، فسجلها من خلال `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة تمهيد المعالجات المدفوعة بالإمكانات من حالة بدء القناة دون إضافة غراء تغليف خاص بالموافقات.
- الجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا تكون الوصلة المدفوعة بالإمكانات معبّرة بما يكفي بعد.
- يجب أن توجه قنوات الموافقة الأصلية كلًا من `accountId` و`approvalKind` عبر تلك المساعدات. يُبقي `accountId` سياسة الموافقة متعددة الحسابات ضمن نطاق حساب bot الصحيح، ويُبقي `approvalKind` سلوك موافقات التنفيذ مقابل Plugin متاحًا للقناة دون تفريعات مضمّنة في النواة.
- تمتلك النواة الآن إشعارات إعادة توجيه الموافقة أيضًا. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها مثل "ذهبت الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بدلًا من ذلك، اعرض توجيهًا دقيقًا للأصل + رسائل مباشرة للموافق عبر مساعدات إمكانية الموافقة المشتركة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار مرة أخرى إلى الدردشة البادئة.
- حافظ على نوع معرّف الموافقة المسلّم من البداية إلى النهاية. يجب ألا يخمّن العملاء الأصليون
  أو يعيدوا كتابة توجيه موافقة التنفيذ مقابل Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقة المختلفة أن تعرض عمدًا أسطحًا أصلية مختلفة.
  الأمثلة المضمنة الحالية:
  - يُبقي Slack توجيه الموافقة الأصلي متاحًا لكلٍ من معرّفات التنفيذ وPlugin.
  - تُبقي Matrix توجيه الرسائل المباشرة/القنوات الأصلي وتجربة التفاعل نفسها لموافقات التنفيذ
    وPlugin، مع استمرار السماح لاختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كتغليف توافق، لكن يجب أن يفضل الكود الجديد باني الإمكانية وأن يعرض `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل مسارات وقت التشغيل الفرعية الأضيق عندما تحتاج
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

وبالمثل، فضّل `openclaw/plugin-sdk/setup-runtime`،
`openclaw/plugin-sdk/setup-adapter-runtime`،
`openclaw/plugin-sdk/reply-runtime`،
`openclaw/plugin-sdk/reply-dispatch-runtime`،
`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح المظلي
الأوسع.

بالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  محولات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  `promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  وكيل الإعداد المفوض
- `openclaw/plugin-sdk/setup-adapter-runtime` هو وصلة المحول الضيقة الواعية بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة إعداد التثبيت الاختياري
  إضافة إلى بضع بدائيات آمنة للإعداد:
  `createOptionalChannelSetupSurface`، و`createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعين بالبيئة ويجب أن تعرف تدفقات
البدء/الإعداد العامة أسماء تلك البيئات قبل تحميل وقت التشغيل، فأعلنها في
بيان Plugin باستخدام `channelEnvVars`. أبقِ `envVars` وقت تشغيل القناة أو
الثوابت المحلية للنسخ الموجهة للمشغل فقط.

إذا كان يمكن أن تظهر قناتك في `status` أو `channels list` أو `channels status` أو
فحوصات SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول تلك آمنة للاستيراد في مسارات الأوامر
للقراءة فقط، ويجب أن تعيد بيانات القناة الوصفية، ومحول الإعداد الآمن للإعداد،
ومحول الحالة، وبيانات هدف أسرار القناة الوصفية اللازمة لتلك الملخصات. لا
تبدأ عملاء أو مستمعين أو أوقات تشغيل نقل من إدخال الإعداد.

أبق مسار استيراد إدخال القناة الرئيسي ضيقًا أيضًا. يمكن للاكتشاف تقييم
الإدخال ووحدة Plugin القناة لتسجيل الإمكانات دون تفعيل
القناة. يجب أن تصدّر ملفات مثل `channel-plugin-api.ts` كائن Plugin القناة
دون استيراد معالجات الإعداد، أو عملاء النقل، أو مستمعي المقابس،
أو مشغلات العمليات الفرعية، أو وحدات بدء الخدمة. ضع قطع وقت التشغيل تلك
في وحدات محملة من `registerFull(...)`، أو محددات وقت التشغيل، أو محولات
إمكانات كسولة.

`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`،
`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم وصلة `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الإعداد المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. يفشل المحول/المعالج المنشأ
بإغلاق آمن عند كتابات الإعداد والإنهاء، ويعيد استخدام رسالة التثبيت المطلوبة
نفسها عبر التحقق، والإنهاء، ونسخة رابط الوثائق.

بالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على الأسطح
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`،
  `openclaw/plugin-sdk/account-id`،
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعداد الحسابات المتعددة و
  احتياط الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` للمسار/الظرف الوارد و
  توصيل التسجيل والإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط إضافة إلى
  مفوضي الهوية/الإرسال الصادرين وتخطيط الحمولات
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ مسار صادر على
  `replyToId`/`threadId` صريح أو يستعيد جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. يمكن لـ Plugins المزوّدين تجاوز
  الأولوية، وسلوك اللاحقة، وتسوية معرّف السلسلة عندما تمتلك منصتهم
  دلالات تسليم سلاسل أصلية.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المحول
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط حقل حمولة
  قديم للوكيل/الوسائط مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتسوية أوامر Telegram المخصصة،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر مستقر احتياطيًا

يمكن للقنوات الخاصة بالمصادقة فقط عادةً التوقف عند المسار الافتراضي: تتولى النواة الموافقات ويعرض Plugin فقط إمكانات الصادر/المصادقة. يجب أن تستخدم قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ونواقل الدردشة المخصصة المساعدات الأصلية المشتركة بدلًا من إنشاء دورة حياة موافقة خاصة بها.

## سياسة الإشارات الواردة

أبقِ التعامل مع الإشارات الواردة مقسّمًا إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشترك

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى حزمة مساعدات
الوارد الأوسع.

مناسب جيدًا للمنطق المحلي لـ Plugin:

- اكتشاف الرد على bot
- اكتشاف الاقتباس من bot
- فحوصات المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- الذاكرات المخبئية الأصلية للمنصة اللازمة لإثبات مشاركة bot

مناسب جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الذكر الصريح
- قائمة السماح للذكر الضمني
- تجاوز الأمر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الذكر المحلية.
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

يعرض `api.runtime.channel.mentions` مساعدات الذكر المشتركة نفسها من أجل
Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل
الوارد غير ذات الصلة.

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب أن تستخدم
التعليمات البرمجية الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات Plugin القياسية. الحقل `channel` في `package.json` هو
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

    يتحقق `configSchema` من صحة `plugins.entries.acme-chat.config`. استخدمه
    للإعدادات المملوكة من Plugin التي ليست تكوين حساب القناة. يتحقق `channelConfigs`
    من صحة `channels.acme-chat` وهو مصدر المسار البارد الذي تستخدمه مخططات
    التكوين والإعداد وسطوح واجهة المستخدم قبل تحميل وقت تشغيل Plugin.

  </Step>

  <Step title="بناء كائن Plugin القناة">
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

    للقنوات التي تقبل كلاً من مفاتيح الرسائل المباشرة العلوية القياسية والمفاتيح القديمة المتداخلة، استخدم المساعدات من `plugin-sdk/channel-config-helpers`: تحافظ `resolveChannelDmAccess` و`resolveChannelDmPolicy` و`resolveChannelDmAllowFrom` و`normalizeChannelDmPolicy` على القيم المحلية للحساب قبل القيم الجذرية الموروثة. اقرن المحلّل نفسه بإصلاح الطبيب عبر `normalizeLegacyDmAliases` حتى يقرأ وقت التشغيل والترحيل العقد نفسه.

    <Accordion title="ما الذي ينجزه createChatChannelPlugin لك">
      بدلاً من تنفيذ واجهات المحوّل منخفضة المستوى يدوياً، تمرّر
      خيارات تعريفية ويؤلفها الباني:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلّل أمان الرسائل المباشرة محدود النطاق من حقول التكوين |
      | `pairing.text` | تدفق إقران الرسائل المباشرة النصي مع تبادل الرمز |
      | `threading` | محلّل وضع الرد (ثابت، محدود بنطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال الإرسال التي تعيد بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضاً تمرير كائنات محوّل خام بدلاً من الخيارات التعريفية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تعرّف محوّلات الصادر الخام دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم
      مثل `maxLinesPerMessage`؛ طبّقه قبل الإرسال حتى تُحلّ خيوط الردود
      وحدود التقسيم مرة واحدة عبر تسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضاً `replyToIdSource` (`implicit` أو `explicit`)
      عندما يُحلّ هدف رد أصلي، حتى تتمكن مساعدات الحمولة من الحفاظ على
      وسوم الرد الصريحة دون استهلاك خانة رد ضمنية صالحة للاستخدام مرة واحدة.
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

    ضع واصفات CLI المملوكة من القناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في مساعدة الجذر دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط التحميلات الكاملة العادية الواصفات نفسها لتسجيل الأوامر الحقيقي.
    أبقِ `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجّل طرق RPC للـGateway، فاستخدم
    بادئة خاصة بـPlugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`،
    `exec.approvals.*`، `wizard.*`، `update.*`) محجوزة وتُحل دائماً
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائياً. راجع
    [نقاط الإدخال](/ar/plugins/sdk-entrypoints#definechannelpluginentry) للاطلاع على جميع
    الخيارات.

  </Step>

  <Step title="إضافة إدخال إعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلاً من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مكوّنة. يتجنب ذلك سحب تعليمات وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل التصديرات الآمنة للإعداد في
    وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضاً إلى
    أداة ضبط وقت تشغيل صريحة وقت الإعداد.

  </Step>

  <Step title="معالجة الرسائل الواردة">
    يحتاج Plugin لديك إلى تلقي الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب و
    يرسله عبر معالج الوارد في قناتك:

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
      مسار الوارد الخاص به. راجع Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط واقعية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="Test">
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

    للاطلاع على مساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

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
    أوضاع رد ثابتة، أو محددة بنطاق الحساب، أو مخصصة
  </Card>
  <Card title="Message tool integration" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="Target resolution" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType، وlooksLikeId، وresolveTarget
  </Card>
  <Card title="Runtime helpers" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، وSTT، والوسائط، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="Channel turn kernel" icon="bolt" href="/ar/plugins/sdk-channel-turn">
    دورة حياة دور الوارد المشتركة: الاستيعاب، والحل، والتسجيل، والإرسال، والإنهاء
  </Card>
</CardGroup>

<Note>
ما زالت بعض نقاط مساعدات Plugins المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/Runtime من سطح SDK
المشترك، إلا إذا كنت تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins الموفرين](/ar/plugins/sdk-provider-plugins) - إذا كان Plugin الخاص بك يوفر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) - مرجع كامل لاستيرادات المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) - أدوات الاختبار واختبارات العقود
- [بيان Plugin](/ar/plugins/manifest) - مخطط البيان الكامل

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [إنشاء Plugins](/ar/plugins/building-plugins)
- [Plugins حاضنة الوكيل](/ar/plugins/sdk-agent-harness)

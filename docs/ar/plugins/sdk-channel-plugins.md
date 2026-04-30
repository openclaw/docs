---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة مهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins للقنوات
x-i18n:
    generated_at: "2026-04-30T08:15:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 068cd797f7761efa54f4fdeb7cb4aa784ceace959f1af12bc549c16ed2776b72
    source_path: plugins/sdk-channel-plugins.md
    workflow: 16
---

يرشدك هذا الدليل خلال بناء Plugin قناة يربط OpenClaw بمنصة
مراسلة. في النهاية سيكون لديك قناة عاملة تتضمن أمان الرسائل المباشرة،
والاقتران، وسلاسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [بدء الاستخدام](/ar/plugins/building-plugins) أولاً للتعرف على بنية الحزمة
  الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugin القنوات

لا تحتاج Plugin القنوات إلى أدوات إرسال/تحرير/تفاعل خاصة بها. يحتفظ OpenClaw بأداة
`message` مشتركة واحدة في النواة. يتولى Plugin الخاص بك:

- **الإعدادات** — تحديد الحساب ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** — مسار موافقة الرسائل المباشرة
- **قواعد الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالدردشات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **السلاسل** — كيفية ربط الردود في سلاسل
- **كتابة Heartbeat** — إشارات كتابة/انشغال اختيارية لأهداف تسليم Heartbeat

تتولى النواة أداة الرسائل المشتركة، وتوصيل الموجّه، وشكل مفتاح الجلسة الخارجي،
وتتبع `:thread:` العام، والتوجيه.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاكشف
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع هدف تسليم
Heartbeat المحلول قبل بدء تشغيل نموذج Heartbeat وتستخدم دورة حياة إبقاء الكتابة
المشتركة والتنظيف. أضف `heartbeat.clearTyping(...)` عندما تحتاج المنصة إلى إشارة
إيقاف صريحة.

إذا أضافت قناتك معاملات أداة الرسائل التي تحمل مصادر وسائط، فاكشف أسماء هذه
المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox وسياسة الوصول إلى الوسائط الصادرة،
لذلك لا تحتاج Plugin إلى حالات خاصة في النواة المشتركة لمعاملات الصور الرمزية
أو المرفقات أو صور الغلاف الخاصة بالمزوّد.
يفضّل إرجاع خريطة مفهرسة بمفاتيح الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
ذات الصلة وسائط إجراء آخر. لا تزال المصفوفة المسطحة تعمل للمعاملات التي
تُشارك عمداً عبر كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقاً إضافياً داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو
الخطاف المرجعي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
عند إرجاع `parentConversationCandidates`، أبقِها مرتبة من الأصل الأضيق إلى
المحادثة الأوسع/الأساسية.

استخدم `openclaw/plugin-sdk/channel-route` عندما تحتاج شيفرة Plugin إلى تطبيع
حقول شبيهة بالمسارات، أو مقارنة سلسلة فرعية بمسارها الأصل، أو بناء مفتاح إزالة
تكرار ثابت من `{ channel, to, accountId, threadId }`. يطبّع المساعد معرّفات
السلاسل الرقمية بالطريقة نفسها التي تفعلها النواة، لذلك ينبغي أن تفضّله Plugin
على مقارنات مخصصة مثل `String(threadId)`.
يمكن لـ Plugin التي لديها قواعد أهداف خاصة بالمزوّد حقن محللها في
`resolveChannelRouteTargetWithParser(...)` والحصول مع ذلك على شكل هدف المسار
نفسه ودلالات بدائل السلسلة التي تستخدمها النواة.

يمكن لـ Plugin المضمنة التي تحتاج التحليل نفسه قبل بدء سجل القنوات أن تكشف أيضاً
ملف `session-key-api.ts` على المستوى الأعلى مع تصدير مطابق
`resolveSessionConversation(...)`. تستخدم النواة هذا السطح الآمن للإقلاع فقط
عندما لا يكون سجل Plugin وقت التشغيل متاحاً بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحاً كبديل توافق
قديم عندما يحتاج Plugin فقط إلى بدائل أصل فوق المعرّف العام/الخام. إذا وُجد
كلا الخطافين، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولاً ولا تعود
إلى `resolveParentConversationCandidates(...)` إلا عندما يحذف الخطاف المرجعي
هذه القيم.

## الموافقات وقدرات القنوات

معظم Plugin القنوات لا تحتاج إلى شيفرة خاصة بالموافقة.

- تتولى النواة `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحداً على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلي/عرض/مصادقة الموافقة في `approvalCapability`.
- `plugin.auth` لتسجيل الدخول/الخروج فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من ذلك الكائن.
- `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` هما سطحا مصادقة الموافقة المرجعيان.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفر مصادقة الموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تكشف موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل الدردشة نفسها. تستخدم النواة هذا الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات التنفيذ الأصلية، وتضمين القناة في إرشادات الرجوع إلى العميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات كتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلي أو كبت الرجوع.
- استخدم `approvalCapability.nativeRuntime` لحقائق الموافقة الأصلية المملوكة للقناة. أبقِها كسولة على نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل لديك عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلاً إلى حمولات موافقة مخصصة بدلاً من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعدادات الدقيقة اللازمة لتمكين موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ينبغي للقنوات ذات الحسابات المسماة عرض مسارات محددة بالحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلاً من الافتراضات على المستوى الأعلى.
- إذا استطاعت قناة استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعدادات الحالية، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها دون إضافة منطق نواة خاص بالموافقة.
- إذا احتاجت قناة إلى تسليم موافقة أصلية، فأبقِ شيفرة القناة مركزة على تطبيع الهدف بالإضافة إلى حقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، وانتهاء الصلاحية، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدة أسطح أصغر:
- يستخدم `createChannelNativeOriginTargetResolver` مطابِق مسارات القنوات المشترك افتراضياً لأهداف `{ to, accountId, threadId }`. مرّر `targetsMatch` فقط عندما تمتلك قناة قواعد تكافؤ خاصة بالمزوّد، مثل مطابقة بادئة الطابع الزمني في Slack.
- مرّر `normalizeTargetForMatch` إلى `createChannelNativeOriginTargetResolver` عندما تحتاج القناة إلى تحويل معرّفات المزوّد إلى شكل مرجعي قبل تشغيل مطابِق المسار الافتراضي أو استدعاء `targetsMatch` مخصص، مع الحفاظ على الهدف الأصلي للتسليم. استخدم `normalizeTarget` فقط عندما يجب تحويل هدف التسليم المحلول نفسه إلى شكل مرجعي.
- `availability` — ما إذا كان الحساب مضبوطاً وما إذا كان ينبغي التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلقة/محلولة/منتهية أو بإجراءات نهائية
- `transport` — تجهيز الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا احتاجت القناة إلى كائنات مملوكة لوقت التشغيل مثل عميل أو رمز أو تطبيق Bolt أو مستقبل Webhook، فسجلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة إقلاع المعالجات المدفوعة بالقدرات من حالة بدء القناة دون إضافة غراء تغليف خاص بالموافقة.
- استخدم `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا يكون السطح المدفوع بالقدرات معبراً بما يكفي بعد.
- يجب أن توجه قنوات الموافقة الأصلية كلاً من `accountId` و`approvalKind` عبر تلك المساعدات. يحافظ `accountId` على سياسة موافقة الحسابات المتعددة ضمن حساب الروبوت الصحيح، ويحافظ `approvalKind` على إتاحة سلوك موافقات التنفيذ مقابل موافقات Plugin للقناة دون فروع مضمنة صلبة في النواة.
- تتولى النواة الآن أيضاً إشعارات إعادة توجيه الموافقة. ينبغي ألا ترسل Plugin القنوات رسائل متابعة خاصة بها مثل "ذهبت الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بدلاً من ذلك، اكشف توجيه الأصل + الرسائل المباشرة للموافق بدقة عبر مساعدات قدرة الموافقة المشتركة ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى دردشة البدء.
- حافظ على نوع معرّف الموافقة المسلّمة من البداية إلى النهاية. ينبغي ألا يخمّن العملاء الأصليون
  أو يعيدوا كتابة توجيه موافقات التنفيذ مقابل موافقات Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تكشف عمداً أسطحاً أصلية مختلفة.
  أمثلة مضمنة حالياً:
  - يبقي Slack توجيه الموافقة الأصلي متاحاً لكل من معرّفات التنفيذ وPlugin.
  - يبقي Matrix توجيه الرسائل المباشرة/القنوات الأصلي نفسه وتجربة التفاعلات لموافقات التنفيذ
    وPlugin، مع السماح مع ذلك لاختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجوداً كغلاف توافق، لكن ينبغي للشيفرة الجديدة تفضيل باني القدرات وكشف `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل مسارات وقت التشغيل الفرعية الأضيق عندما تحتاج فقط
إلى جزء واحد من تلك العائلة:

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
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح المظلّي الأوسع.

بالنسبة إلى الإعداد تحديداً:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  محولات تصحيح الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`،
  `createEnvPatchedAccountSetupAdapter`،
  `createSetupInputPresenceValidator`)، ومخرجات ملاحظات البحث،
  و`promptResolvedAllowFrom` و`splitSetupEntries` وبناة
  وكيل الإعداد المفوض
- `openclaw/plugin-sdk/setup-adapter-runtime` هو سطح المحول الضيق الواعي بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة إعداد التثبيت الاختياري
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم الإعداد أو المصادقة المدفوعة بالبيئة، وينبغي لمسارات
بدء التشغيل/الإعداد العامة معرفة أسماء البيئة هذه قبل تحميل وقت التشغيل،
فصرّح بها في بيان Plugin باستخدام `channelEnvVars`. أبقِ `envVars` الخاصة
بوقت تشغيل القناة أو الثوابت المحلية للنسخ الموجهة للمشغلين فقط.

إذا كان يمكن أن تظهر قناتك في `status` أو `channels list` أو `channels status` أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات الأوامر
للقراءة فقط، وأن تعيد بيانات تعريف القناة، ومحوّل إعدادات آمن للإعداد، ومحوّل
الحالة، وبيانات تعريف هدف سر القناة اللازمة لتلك الملخصات. لا تبدأ العملاء أو
المستمعات أو أوقات تشغيل النقل من مدخل الإعداد.

أبق مسار استيراد مدخل القناة الرئيسي ضيقًا أيضًا. يمكن للاكتشاف تقييم المدخل
ووحدة Plugin القناة لتسجيل القدرات من دون تنشيط القناة. يجب أن تصدّر ملفات مثل
`channel-plugin-api.ts` كائن Plugin القناة من دون استيراد معالجات الإعداد، أو
عملاء النقل، أو مستمعات المقابس، أو مشغلات العمليات الفرعية، أو وحدات بدء الخدمة.
ضع تلك أجزاء وقت التشغيل في وحدات يتم تحميلها من `registerFull(...)`، أو محددات
وقت التشغيل، أو محوّلات القدرات الكسولة.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- استخدم واجهة `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التكوين المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط عرض "ثبّت هذا Plugin أولًا" في واجهات الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. يفشل المحوّل/المعالج المُنشأ
بشكل مغلق عند كتابة التكوين والإنهاء، ويعيد استخدام رسالة ضرورة التثبيت نفسها
عبر التحقق والإنهاء ونص رابط الوثائق.

بالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على الواجهات
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`, و
  `openclaw/plugin-sdk/account-helpers` لتكوين الحسابات المتعددة والرجوع إلى
  الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لأسلاك المسار/المغلف الوارد
  والتسجيل ثم الإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل الأهداف ومطابقتها
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى مفوضي
  هوية/إرسال الصادر وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ مسار صادر على
  `replyToId`/`threadId` صريح أو يستعيد جلسة `:thread:` الحالية بعد أن يظل
  مفتاح الجلسة الأساسي مطابقًا. يمكن لـ Plugins المزوّدين تجاوز الأولوية
  وسلوك اللاحقة وتسوية معرّف الخيط عندما يكون لمنصتهم دلالات تسليم خيوط أصلية.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط الخيوط وتسجيل
  المحوّل
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل تخطيط حقل حمولة
  الوكيل/الوسائط القديم مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتسوية الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد تكوين أوامر مستقر كمسار رجوع

يمكن للقنوات المخصصة للمصادقة فقط عادةً التوقف عند المسار الافتراضي: يتولى القلب الموافقات ويكشف Plugin فقط قدرات الصادر/المصادقة. يجب أن تستخدم قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائل نقل الدردشة المخصصة المساعدات الأصلية المشتركة بدلًا من تنفيذ دورة حياة موافقة خاصة بها.

## سياسة الإشارة الواردة

أبق معالجة الإشارات الواردة مقسمة إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
استخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى حزمة مساعدات
الوارد الأوسع.

مناسب جيدًا للمنطق المحلي في Plugin:

- اكتشاف الرد على البوت
- اكتشاف اقتباس البوت
- فحوصات مشاركة الخيط
- استثناءات رسائل الخدمة/النظام
- التخزينات المؤقتة الأصلية للمنصة اللازمة لإثبات مشاركة البوت

مناسب جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح بالإشارات الضمنية
- تجاوز الأوامر
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

يكشف `api.runtime.channel.mentions` مساعدات الإشارة المشتركة نفسها لـ Plugins
القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل واردة
غير مرتبطة.

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب أن يستخدم الكود
الجديد `resolveInboundMentionDecision({ facts, policy })`.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات Plugin القياسية. حقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. لواجهة بيانات تعريف الحزمة الكاملة،
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
    للإعدادات المملوكة لـ Plugin التي ليست تكوين حساب القناة. يتحقق `channelConfigs`
    من `channels.acme-chat` وهو مصدر المسار البارد الذي تستخدمه مخططات التكوين
    والإعداد وواجهات UI قبل تحميل وقت تشغيل Plugin.

  </Step>

  <Step title="بناء كائن Plugin القناة">
    تحتوي واجهة `ChannelPlugin` على العديد من واجهات المحوّلات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المحوّلات عند الحاجة إليها.

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

    بالنسبة إلى القنوات التي تقبل كلاً من مفاتيح DM العلوية القانونية والمفاتيح المتداخلة القديمة، استخدم المساعدات من `plugin-sdk/channel-config-helpers`: يحافظ `resolveChannelDmAccess` و`resolveChannelDmPolicy` و`resolveChannelDmAllowFrom` و`normalizeChannelDmPolicy` على القيم المحلية للحساب قبل قيم الجذر الموروثة. اربط المحلل نفسه بإصلاح doctor عبر `normalizeLegacyDmAliases` حتى يقرأ وقت التشغيل والترحيل العقد نفسه.

    <Accordion title="ما الذي يفعله createChatChannelPlugin لك">
      بدلًا من تنفيذ واجهات المحوّلات منخفضة المستوى يدويًا، تمرر
      خيارات تصريحية ويؤلفها المنشئ:

      | الخيار | ما يوصله |
      | --- | --- |
      | `security.dm` | محلل أمان DM محدود النطاق من حقول التكوين |
      | `pairing.text` | تدفق إقران DM نصي مع تبادل رمز |
      | `threading` | محلل وضع الرد (ثابت، محدود بالحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات محوّلات خام بدلًا من الخيارات التصريحية
      إذا كنت تحتاج إلى تحكم كامل.

      قد تحدد مهايئات الإرسال الخام دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم
      مثل `maxLinesPerMessage`؛ طبقه قبل الإرسال حتى تُحل خيوط الردود
      وحدود الأجزاء مرة واحدة بواسطة تسليم الإرسال المشترك.
      تتضمن سياقات الإرسال أيضا `replyToIdSource` (`implicit` أو `explicit`)
      عندما يُحل هدف رد أصلي، حتى تتمكن مساعدات الحمولة من الحفاظ على
      وسوم الرد الصريحة من دون استهلاك خانة رد ضمنية أحادية الاستخدام.
    </Accordion>

  </Step>

  <Step title="وصّل نقطة الدخول">
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
    من عرضها في مساعدة الجذر من دون تنشيط وقت تشغيل القناة الكامل،
    بينما تظل عمليات التحميل الكاملة العادية تلتقط الواصفات نفسها لتسجيل الأوامر
    الفعلي. أبق `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل طرق Gateway RPC، فاستخدم بادئة
    خاصة بالـ Plugin. تبقى مساحات أسماء الإدارة الأساسية (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائما
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لكل
    الخيارات.

  </Step>

  <Step title="أضف إدخال إعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلا من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مهيأة. ويتجنب ذلك جلب شيفرة وقت تشغيل ثقيلة أثناء مسارات الإعداد.
    راجع [الإعداد والتكوين](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل الصادرات الآمنة للإعداد إلى وحدات
    جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضا إلى
    محدد وقت تشغيل صريح في وقت الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استلام الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب
    ويمرره عبر معالج الوارد في قناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // plugin-managed auth (verify signatures yourself)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // Your inbound handler dispatches the message to OpenClaw.
          // The exact wiring depends on your platform SDK —
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
      معالجة الرسائل الواردة خاصة بالقناة. يملك كل Plugin قناة
      مسار الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="اختبر">
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

    لمساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

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
  <Card title="خيارات الخيوط" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة أو مقيّدة بالحساب أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حل الهدف" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS، وSTT، والوسائط، والوكيل الفرعي عبر api.runtime
  </Card>
  <Card title="نواة دور القناة" icon="bolt" href="/ar/plugins/sdk-channel-turn">
    دورة حياة دور الوارد المشتركة: الاستيعاب، الحل، التسجيل، الإرسال، الإنهاء
  </Card>
</CardGroup>

<Note>
ما زالت بعض نقاط مساعدات الحزم المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك إلا إذا كنت تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins الموفر](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفر النماذج أيضا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع استيراد المسارات الفرعية الكامل
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقد
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الكامل

## ذات صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins عدة الوكيل](/ar/plugins/sdk-agent-harness)

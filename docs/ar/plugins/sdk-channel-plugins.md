---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لإنشاء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-22T07:18:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e67d8c4be8cc4a312e5480545497b139c27bed828304de251e6258a3630dd9b5
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins القنوات

يرشدك هذا الدليل خلال بناء Plugin لقناة يربط OpenClaw بمنصة مراسلة.
وبحلول النهاية سيكون لديك قناة عاملة تتضمن أمان الرسائل المباشرة،
والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرف على بنية
  الحزمة الأساسية وإعداد manifest.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` واحدة مشتركة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **الإعداد** — حلّ الحساب ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل المباشرة
- **قواعد الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالموفر بالدردشات الأساسية ومعرّفات السلاسل وبدائل الأصل
- **الإرسال الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية تنظيم الردود ضمن سلاسل
- **كتابة Heartbeat** — إشارات الكتابة/الانشغال الاختيارية لأهداف تسليم Heartbeat

تتولى النواة أداة الرسائل المشتركة، وربط المطالبات، والشكل الخارجي لمفتاح الجلسة،
وتتبّع `:thread:` العام، والتوزيع.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فكشف
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع
هدف تسليم Heartbeat المحسوم قبل بدء تشغيل نموذج Heartbeat وتستخدم
دورة الحياة المشتركة للإبقاء على الكتابة/تنظيفها. أضف `heartbeat.clearTyping(...)`
عندما تحتاج المنصة إلى إشارة توقف صريحة.

إذا كانت قناتك تضيف معاملات message tool تحمل مصادر وسائط، فكشف أسماء
هذه المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox ولسياسة الوصول إلى الوسائط الصادرة،
بحيث لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصور
الرمزية أو المرفقات أو صور الغلاف الخاصة بموفر معين.
يُفضّل إرجاع خريطة مفاتيحها هي الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }`
حتى لا ترث الإجراءات غير المرتبطة معاملات الوسائط الخاصة بإجراء آخر.
ولا تزال المصفوفة المسطحة تعمل للمعاملات التي يُقصد مشاركتها عمدًا بين
كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثة، فأبقِ هذا التحليل
داخل Plugin عبر `messaging.resolveSessionConversation(...)`. فهذه هي
الخطاف القياسي لربط `rawId` بمعرّف المحادثة الأساسي ومعرّف السلسلة الاختياري
و`baseConversationId` الصريح وأي `parentConversationCandidates`.
وعند إرجاع `parentConversationCandidates`، أبقِ ترتيبها من الأصل الأضيق
إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا للـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع
سجل القنوات أن تكشف ملف `session-key-api.ts` على المستوى الأعلى مع
تصدير `resolveSessionConversation(...)` مطابق. تستخدم النواة هذه الواجهة
الآمنة لمرحلة الإقلاع فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل
توافقي قديم عندما يحتاج Plugin فقط إلى بدائل الأصل فوق المعرف العام/الخام.
إذا وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ولا
تعود إلى `resolveParentConversationCandidates(...)` إلا إذا أغفل الخطاف
القياسي هذه القيم.

## الموافقات وقدرات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقة.

- تتولى النواة `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، وتسليم البدائل العام.
- يُفضّل استخدام كائن `approvalCapability` واحد على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلي/عرض/مصادقة الموافقة على `approvalCapability`.
- يختص `plugin.auth` بتسجيل الدخول/الخروج فقط؛ ولم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- يُعد `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` الواجهة القياسية لمصادقة الموافقة.
- استخدم `approvalCapability.getActionAvailabilityState` لتوافر مصادقة الموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تكشف موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل الدردشة نفسها. تستخدم النواة هذا الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات التنفيذ الأصلية، وإدراج القناة في إرشادات بدائل العميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا الجزء للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو منع التسليم البديل.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية الخاصة بالقناة المتعلقة بالموافقة. أبقه كسول التحميل على نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد module وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسماة عرض مسارات ضمن نطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الإعدادات الافتراضية ذات المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعداد الحالي، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها من دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلية، فاحصر شيفرة القناة في تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك ترشيح الطلبات والتوجيه وإزالة التكرار والانتهاء والاشتراك في Gateway وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدة واجهات أصغر:
- `availability` — ما إذا كان الحساب مضبوطًا وما إذا كان يجب التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` — تحضير الأهداف إضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية لربط/فك ربط/مسح الإجراءات الخاصة بالأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات يملكها وقت التشغيل مثل عميل أو token أو تطبيق Bolt أو مستقبِل Webhook، فسجلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة إقلاع المعالجات المدفوعة بالقدرات من حالة بدء تشغيل القناة دون إضافة غلاف خاص بالموافقة.
- انتقل إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى فقط عندما لا تكون الواجهة المعتمدة على القدرات معبرة بما يكفي بعد.
- يجب على قنوات الموافقة الأصلية تمرير كلٍّ من `accountId` و`approvalKind` عبر هذه المساعدات. يحافظ `accountId` على تقييد سياسة الموافقة متعددة الحسابات بالحساب الآلي الصحيح، ويحافظ `approvalKind` على إتاحة سلوك موافقة التنفيذ مقابل Plugin للقناة من دون فروع مبرمجة بشكل ثابت في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقة. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل عليها كشف توجيه صحيح لكل من الأصل + الرسائل المباشرة للموافق عبر مساعدات قدرة الموافقة المشتركة وترك النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار إلى الدردشة التي بدأت الطلب.
- حافظ على نوع معرّف الموافقة الذي تم تسليمه من البداية إلى النهاية. يجب ألا تقوم العملاء الأصلية بتخمين أو إعادة كتابة توجيه موافقة التنفيذ مقابل Plugin استنادًا إلى حالة محلية في القناة.
- يمكن لأنواع الموافقة المختلفة أن تكشف عمدًا أسطحًا أصلية مختلفة.
  الأمثلة المضمّنة الحالية:
  - يحافظ Slack على إتاحة توجيه الموافقة الأصلية لكل من معرّفات التنفيذ وPlugin.
  - يحافظ Matrix على التوجيه الأصلي نفسه للرسائل المباشرة/القناة وتجربة التفاعلات لكل من موافقات التنفيذ وPlugin، مع الاستمرار في السماح باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافقي، لكن يجب أن تفضّل الشيفرة الجديدة مُنشئ القدرة وأن تكشف `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج إلى جزء واحد فقط من هذه العائلة:

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
و`openclaw/plugin-sdk/setup-adapter-runtime`،
و`openclaw/plugin-sdk/reply-runtime`،
و`openclaw/plugin-sdk/reply-dispatch-runtime`،
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى الواجهة
الأوسع ذات المستوى الأعلى.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  مهايئات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  setup-proxy المفوّضة
- يُعد `openclaw/plugin-sdk/setup-adapter-runtime` الواجهة الضيقة الواعية بالبيئة
  الخاصة بـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بُناة الإعداد ذي التثبيت الاختياري
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`، `createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعين بالبيئة وكان ينبغي لتدفقات
البدء/الإعداد العامة معرفة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل،
فصرّح بها في manifest الخاص بـ Plugin باستخدام `channelEnvVars`.
واحتفظ بـ `envVars` وقت تشغيل القناة أو الثوابت المحلية فقط للنصوص
الموجهة للمشغّل.

إذا كانت قناتك قد تظهر في `status` أو `channels list` أو `channels status` أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات الأوامر
للقراءة فقط، ويجب أن تعيد بيانات القناة الوصفية، ومهايئ الإعداد الآمن،
ومهايئ الحالة، وبيانات هدف سر القناة اللازمة لهذه الملخصات. لا تبدأ
العملاء أو المستمعين أو أوقات تشغيل النقل من نقطة دخول الإعداد.

`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`،
و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم الواجهة الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح
الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. إذ إن
المهايئ/المعالج المُولَّدين يفشلان بشكل مغلق عند كتابة الإعدادات وعند
الإتمام، ويعيدان استخدام رسالة الحاجة إلى التثبيت نفسها عبر التحقق
والإتمام ونص رابط التوثيق.

وبالنسبة إلى مسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة بدلًا من
الواجهات القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`،
  و`openclaw/plugin-sdk/account-id`،
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات تعدد الحسابات
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لمسار/غلاف الوارد
  وربط التسجيل والتوزيع
- `openclaw/plugin-sdk/messaging-targets` لتحليل الأهداف ومطابقتها
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط إضافة إلى
  مفوضات الهوية/الإرسال الصادر وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما ينبغي للمسار الصادر الحفاظ على
  `replyToId`/`threadId` صريح أو استعادة جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. ويمكن لـ Plugins الموفر
  تجاوز الأولوية وسلوك اللاحقة وتطبيع معرّف السلسلة عندما تكون لدى منصتها
  دلالات أصلية لتسليم السلاسل.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تخطيط حقل
  حمولة agent/media القديم لا يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر ثابت كبديل

يمكن للقنوات التي تقتصر على المصادقة عادةً الاكتفاء بالمسار الافتراضي: تتولى النواة الموافقات ويكشف Plugin فقط عن قدرات الإرسال الصادر/المصادقة. أما قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائط الدردشة المخصصة فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة الواردة

أبقِ التعامل مع الإشارات الواردة مقسومًا إلى طبقتين:

- جمع الأدلة المملوك للـ Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
الواجهة الأوسع لمساعدات الوارد.

حالات مناسبة للمنطق المحلي في Plugin:

- اكتشاف الرد على bot
- اكتشاف الاقتباس من bot
- التحقق من المشاركة في السلسلة
- استبعاد رسائل الخدمة/النظام
- مخابئ أصلية خاصة بالمنصة لازمة لإثبات مشاركة bot

حالات مناسبة للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الإشارة المحلية.
2. مرّر هذه الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
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

يكشف `api.runtime.channel.mentions` عن مساعدات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات
وقت تشغيل الوارد غير المرتبطة.

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافقية فقط. ويجب أن تستخدم
الشيفرة الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## الشرح العملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات Plugin القياسية. إن حقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات الحزمة الوصفية الكامل،
    راجع [إعداد Plugin والتهيئة](/ar/plugins/sdk-setup#openclaw-channel):

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
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="بناء كائن Plugin القناة">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المهايئات حسب الحاجة.

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

    <Accordion title="ما الذي يفعله `createChatChannelPlugin` لك">
      بدلًا من تنفيذ واجهات المهايئات منخفضة المستوى يدويًا، فإنك تمرر
      خيارات وصفية ويقوم الباني بتجميعها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلّل أمان DM مقيّد النطاق من حقول التهيئة |
      | `pairing.text` | تدفق اقتران DM قائم على النص مع تبادل الرموز |
      | `threading` | محلّل وضع الرد (ثابت أو مقيّد بالحساب أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تُرجع بيانات وصفية للنتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئات خام بدلًا من الخيارات الوصفية
      إذا كنت تحتاج إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="ربط نقطة الدخول">
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

    ضع واصفات CLI الخاصة بالقناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في مساعدة الجذر دون تنشيط وقت تشغيل القناة الكامل،
    بينما تستمر عمليات التحميل الكاملة العادية في التقاط الواصفات نفسها
    لتسجيل الأوامر الفعلي. وأبقِ `registerFull(...)` للأعمال الخاصة
    بوقت التشغيل فقط.
    وإذا كان `registerFull(...)` يسجّل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بالـ Plugin. إذ تبقى نطاقات أسماء إدارة النواة (`config.*`،
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
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
    أو غير مضبوطة. وهو يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات workspace المضمّنة التي تفصل التصديرات الآمنة للإعداد إلى
    وحدات sidecar أن تستخدم `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    أداة ضبط صريحة لوقت التشغيل في وقت الإعداد.

  </Step>

  <Step title="معالجة الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى تلقي الرسائل من المنصة وتمريرها إلى
    OpenClaw. والنمط المعتاد هو Webhook يتحقق من الطلب ثم
    يوزعه عبر معالج الوارد الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // مصادقة يديرها Plugin (تحقق من التوقيعات بنفسك)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // يوزّع معالج الوارد لديك الرسالة إلى OpenClaw.
          // يعتمد الربط الدقيق على SDK الخاص بمنصتك —
          // راجع مثالًا حقيقيًا في حزمة Plugin ‏Microsoft Teams أو Google Chat المضمّنة.
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      إن معالجة الرسائل الواردة خاصة بكل قناة. إذ يمتلك كل Plugin قناة
      خط معالجة وارد خاصًا به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin ‏Microsoft Teams أو Google Chat) للاطلاع على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات colocated في `src/channel.test.ts`:

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
├── package.json              # بيانات openclaw.channel الوصفية
├── openclaw.plugin.json      # Manifest مع مخطط التهيئة
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
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة، أو مقيّدة بالحساب، أو مخصصة
  </Card>
  <Card title="تكامل message tool" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حلّ الهدف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض واجهات المساعدات المضمّنة موجودة لصيانة Plugins المضمّنة
ولأغراض التوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
بل يُفضّل استخدام المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من
سطح SDK المشترك ما لم تكن تصون عائلة Plugin المضمّنة تلك مباشرةً.
</Note>

## الخطوات التالية

- [Plugins الموفر](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — مرجع كامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [Manifest Plugin](/ar/plugins/manifest) — مخطط manifest الكامل

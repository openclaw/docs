---
read_when:
    - أنت تبني Plugin جديدة لقناة مراسلة
    - تريد توصيل OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم سطح محول ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins للقنوات
x-i18n:
    generated_at: "2026-04-24T07:55:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: e08340e7984b4aa5307c4ba126b396a80fa8dcb3d6f72561f643806a8034fb88
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال بناء Plugin لقناة تربط OpenClaw بمنصة
مراسلة. وبحلول النهاية سيكون لديك قناة عاملة تتضمن أمان الرسائل الخاصة،
والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة الأساسية
  وإعداد manifest.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في النواة. وتمتلك Plugin الخاصة بك ما يلي:

- **الإعداد** — حل الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل الخاصة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل الخاصة
- **نحو الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالموفر بالمحادثات الأساسية ومعرّفات السلاسل والرجوع إلى الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية تسلسل الردود
- **كتابة Heartbeat** — إشارات كتابة/انشغال اختيارية لأهداف تسليم Heartbeat

تمتلك النواة أداة الرسائل المشتركة، وربط المطالبات، وشكل مفتاح الجلسة الخارجي،
وسجل `:thread:` العام، والإرسال.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فاكشف
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيها النواة مع هدف
تسليم Heartbeat المحلول قبل بدء تشغيل نموذج Heartbeat وتستخدم دورة الحياة
المشتركة لإبقاء الكتابة/التنظيف حية. وأضف `heartbeat.clearTyping(...)`
عندما تحتاج المنصة إلى إشارة توقف صريحة.

إذا كانت قناتك تضيف معاملات إلى أداة الرسائل تحمل مصادر وسائط، فاكشف أسماء
هذه المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة من أجل تطبيع مسارات sandbox وسياسة الوصول إلى الوسائط
الصادرة، لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعلمات
الصور الرمزية أو المرفقات أو صور الغلاف الخاصة بكل موفر.
ويُفضّل إرجاع خريطة قائمة على الإجراء مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير المرتبطة
معلمات وسائط تخص إجراء آخر. ولا تزال المصفوفة المسطحة تعمل للمعاملات التي
يُقصد مشاركتها عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. فهذا هو الخطاف
القياسي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
وعندما تعيد `parentConversationCandidates`، فاحرص على ترتيبها من
الأصل الأضيق إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا للPlugins المضمنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل
القنوات أن تكشف ملف `session-key-api.ts` أعلى المستوى مع تصدير مطابق
لـ `resolveSessionConversation(...)`. وتستخدم النواة هذا السطح الآمن عند
التمهيد فقط عندما لا يكون سجل Plugin وقت التشغيل متاحًا بعد.

تظل `messaging.resolveParentConversationCandidates(...)` متاحة كرجوع قديم
للتوافق عندما تحتاج Plugin فقط إلى الرجوع إلى الأصول فوق المعرّف العام/الخام.
وإذا وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا، ولا ترجع إلى
`resolveParentConversationCandidates(...)` إلا عندما يحذفها الخطاف القياسي.

## الموافقات وقدرات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقات.

- تمتلك النواة أوامر `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق التسليم/الأصلي/العرض/المصادقة الخاصة بالموافقة على `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ ولم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- تمثل `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` خط المصادقة القياسي للموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لإتاحة مصادقة الموافقة داخل المحادثة نفسها.
- إذا كانت قناتك تكشف موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. تستخدم النواة هذا الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات exec الأصلية، وتضمين القناة في إرشادات الرجوع الخاصة بالعميل الأصلي. تملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو كبت الرجوع.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية الخاصة بالموافقة التي تملكها القناة. وأبقِها lazy على نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من المصيّر المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطل مقابض الإعداد الدقيقة المطلوبة لتمكين موافقات exec الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب أن تعرض القنوات متعددة الحسابات مسارات بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية على المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات مستقرة شبيهة بالمالك في الرسائل الخاصة من الإعدادات الموجودة، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها من دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلية، فأبقِ شيفرة القناة مركزة على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك تصفية الطلبات والتوجيه وإزالة التكرار وانتهاء الصلاحية واشتراك gateway وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى بعض الخطوط الأصغر:
- `availability` — ما إذا كان الحساب مضبوطًا وما إذا كان يجب التعامل مع الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك إلى حمولات أصلية معلقة/محلولة/منتهية أو إجراءات نهائية
- `transport` — إعداد الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات bind/unbind/clear-action الاختيارية للأزرار أو التفاعلات الأصلية
- `observe` — خطافات تشخيص تسليم اختيارية
- إذا كانت القناة تحتاج إلى كائنات يمتلكها وقت التشغيل مثل عميل أو token أو تطبيق Bolt أو مستقبل webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة تمهيد معالجات تقودها القدرات من حالة بدء القناة من دون إضافة طبقة glue خاصة بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` منخفضي المستوى إلا عندما لا يكون الخط القائم على القدرات معبرًا بما فيه الكفاية بعد.
- يجب على قنوات الموافقة الأصلية توجيه كل من `accountId` و`approvalKind` عبر هذه المساعدات. فـ `accountId` يبقي سياسة الموافقات متعددة الحسابات ضمن نطاق حساب البوت الصحيح، و`approvalKind` يبقي سلوك الموافقة بين exec وPlugin متاحًا للقناة من دون فروع hardcoded في النواة.
- تمتلك النواة الآن إشعارات إعادة توجيه الموافقات أيضًا. ويجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل الخاصة / إلى قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل يجب أن تكشف توجيهًا دقيقًا للأصل + الرسائل الخاصة بالموافق عبر مساعدات القدرة المشتركة للموافقة وتدع النواة تجمع التسليمات الفعلية قبل نشر أي إشعار في الدردشة التي بدأت الطلب.
- حافظ على نوع معرّف الموافقة المُسلّم من البداية إلى النهاية. ولا ينبغي للعملاء الأصليين
  تخمين أو إعادة كتابة توجيه موافقات exec مقابل Plugin من الحالة المحلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تكشف عمدًا أسطحًا أصلية مختلفة.
  الأمثلة المضمنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقات الأصلية لكل من معرّفات exec وPlugin.
  - يحتفظ Matrix بتوجيه الرسائل الخاصة/القنوات الأصلي نفسه وتجربة التفاعل نفسها لموافقات exec
    وPlugin، مع السماح باختلاف المصادقة حسب نوع الموافقة.
- لا تزال `createApproverRestrictedNativeApprovalAdapter` موجودة كغلاف توافق، لكن الشيفرة الجديدة يجب أن تفضل باني القدرات وتكشف `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القناة الساخنة، فضّل المسارات الفرعية الضيقة لوقت التشغيل عندما
تحتاج فقط إلى جزء واحد من تلك العائلة:

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
و`openclaw/plugin-sdk/setup-adapter-runtime`,
و`openclaw/plugin-sdk/reply-runtime`,
و`openclaw/plugin-sdk/reply-dispatch-runtime`,
و`openclaw/plugin-sdk/reply-reference`, و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
الأوسع المظلّي.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` المساعدات الآمنة في وقت التشغيل الخاصة بالإعداد:
  محولات setup patch الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  lookup-note، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبناة
  setup-proxy المفوضة
- يُعد `openclaw/plugin-sdk/setup-adapter-runtime` الخط الضيق
  الواعي بالبيئة من أجل `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بناة الإعداد الاختياري للتثبيت
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعين بالبيئة وكان يجب أن تعرف
تدفقات بدء التشغيل/الإعدادات العامة أسماء متغيرات البيئة تلك قبل تحميل وقت التشغيل، فصرّح بها في
manifest الخاصة بـ Plugin باستخدام `channelEnvVars`. وأبقِ `envVars` الخاصة بوقت تشغيل القناة
أو الثوابت المحلية فقط من أجل النصوص الموجهة للمشغل.

إذا كانت قناتك يمكن أن تظهر في `status` أو `channels list` أو `channels status` أو
فحوصات SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. ويجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات أوامر القراءة فقط
وأن تعيد بيانات وصفية للقناة، ومحول إعدادات آمن للإعداد، ومحول حالة، وبيانات وصفية
لهدف سر القناة المطلوبة لتلك الملخصات. ولا تبدأ
عملاء أو مستمعين أو أوقات تشغيل النقل من نقطة دخول الإعداد.

`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- استخدم السطح الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الضبط الأثقل المشتركة مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذه Plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. حيث تفشل
المحول/المعالج الناتجان بشكل مغلق في كتابات الإعدادات والإنهاء، ويعيدان استخدام رسالة التثبيت المطلوبة نفسها عبر التحقق والإنهاء ونصوص الروابط في الوثائق.

وبالنسبة إلى المسارات الساخنة الأخرى للقناة، فضّل المساعدات الضيقة على الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  `openclaw/plugin-sdk/account-id`,
  `openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات تعدد الحسابات
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` من أجل التوجيه/الغلاف الوارد
  وربط التسجيل ثم الإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوضي الهوية/الإرسال الصادر وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما يجب أن يحافظ المسار الصادر على
  `replyToId`/`threadId` صريحين أو أن يستعيد جلسة `:thread:` الحالية
  بعد أن يظل مفتاح الجلسة الأساسي مطابقًا. ويمكن Plugins الموفّرين تجاوز
  الأولوية، وسلوك اللاحقة، وتطبيع معرّف السلسلة عندما تكون لمنصتهم دلالات
  أصلية لتسليم السلاسل.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المحولات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما تكون هناك حاجة
  إلى تخطيط حقول قديم لحمولة الوكيل/الوسائط
- `openclaw/plugin-sdk/telegram-command-config` من أجل تطبيع أوامر Telegram
  المخصصة، والتحقق من التكرارات/التعارضات، وعقد إعدادات أوامر مستقر في
  حالات الرجوع

يمكن لقنوات المصادقة فقط أن تتوقف عادة عند المسار الافتراضي: فالنواة تتولى الموافقات، وتكشف Plugin فقط إمكانات الصادر/المصادقة. أما القنوات ذات الموافقات الأصلية مثل Matrix وSlack وTelegram ووسائط النقل المخصصة للدردشة، فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة الواردة

أبقِ معالجة الإشارة الواردة منقسمة إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشترك

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات سياسة الإشارة.
واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
شريط المساعدات الأوسع الخاص بالوارد.

ما يناسب المنطق المحلي في Plugin:

- اكتشاف الرد على البوت
- اكتشاف اقتباس البوت
- فحوصات المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- ذاكرات مؤقتة أصلية في المنصة مطلوبة لإثبات مشاركة البوت

ما يناسب المساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضل:

1. احسب حقائق الإشارة المحلية.
2. مرر هذه الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
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

يكشف `api.runtime.channel.mentions` مساعدات الإشارة المشتركة نفسها من أجل
Plugins القنوات المضمنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل
أخرى غير مرتبطة بالوارد.

تظل مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. ويجب على الشيفرة الجديدة
استخدام `resolveInboundMentionDecision({ facts, policy })`.

## الشرح خطوة بخطوة

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json` هو
    ما يجعل هذه Plugin لقناة. وللاطلاع على سطح بيانات الحزمة الوصفية الكامل،
    راجع [إعداد Plugin والإعدادات](/ar/plugins/sdk-setup#openclaw-channel):

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

  <Step title="ابنِ كائن Plugin القناة">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المحولات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المحولات حسب الحاجة.

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

    <Accordion title="ما الذي تقوم به createChatChannelPlugin من أجلك">
      بدلًا من تنفيذ واجهات محولات منخفضة المستوى يدويًا، فإنك تمرر
      خيارات تعريفية ويقوم الباني بتركيبها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلل أمان DM محدود النطاق من حقول الإعدادات |
      | `pairing.text` | تدفق اقتران DM قائم على النص مع تبادل رمز |
      | `threading` | محلل وضع reply-to ‏(ثابت، أو بنطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تعيد بيانات وصفية للنتائج (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات محولات خام بدلًا من الخيارات التعريفية
      إذا كنت تحتاج إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="اربط نقطة الدخول">
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
    من عرضها في المساعدة الجذرية من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط الأحمال الكاملة العادية الواصفات نفسها من أجل التسجيل الحقيقي للأوامر.
    وأبقِ `registerFull(...)` للعمل الخاص بوقت التشغيل فقط.
    إذا سجّلت `registerFull(...)` أساليب Gateway RPC، فاستخدم
    بادئة خاصة بـ Plugin. تظل مساحات أسماء الإدارة الأساسية (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا إلى
    `operator.admin`.
    تتولى `defineChannelPluginEntry` تقسيم أوضاع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
    الخيارات.

  </Step>

  <Step title="أضف setup entry">
    أنشئ `setup-entry.ts` من أجل التحميل الخفيف أثناء onboarding:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يقوم OpenClaw بتحميل هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطلة
    أو غير مضبوطة. ويتجنب هذا سحب شيفرة وقت التشغيل الثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمنة التي تقسم الصادرات الآمنة للإعداد إلى وحدات
    sidecar استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    setter صريح لوقت تشغيل أثناء الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    تحتاج Plugin الخاصة بك إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook تتحقق من الطلب
    وترسله عبر معالج الوارد الخاص بقناتك:

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
      تكون معالجة الرسائل الواردة خاصة بكل قناة. فكل Plugin قناة تملك
      مسار الوارد الخاص بها. انظر إلى Plugins القنوات المضمنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للحصول على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات موضوعة مع الشيفرة في `src/channel.test.ts`:

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

    بالنسبة إلى مساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

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
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع reply ثابتة أو بنطاق الحساب أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حل الأهداف" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط والوكيل الفرعي عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض الخطوط المساعدة المضمنة موجودة لصيانة Plugins المضمنة
ولأغراض التوافق. وهي ليست النمط الموصى به لPlugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة الخاصة بالقناة/الإعداد/الرد/وقت التشغيل من سطح
SDK المشترك ما لم تكن تصون عائلة Plugin المضمنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — إذا كانت Plugin الخاصة بك توفّر نماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيرادات المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [Plugin Manifest](/ar/plugins/manifest) — مخطط manifest الكامل

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins harness الخاصة بالوكلاء](/ar/plugins/sdk-agent-harness)

---
read_when:
    - أنت تبني Plugin جديدة لقناة مراسلة
    - تريد توصيل OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة مواءمة ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة في OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-25T13:53:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a466decff828bdce1d9d3e85127867b88f43c6eca25aa97306f8bd0df39f3a9
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

يرشدك هذا الدليل خلال إنشاء Plugin قناة يربط OpenClaw بمنصة
مراسلة. بحلول النهاية سيكون لديك قناة عاملة مع أمان الرسائل الخاصة،
والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للاطلاع على بنية
  الحزمة الأساسية وإعداد البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **الإعداد** — تحليل الحساب ومعالج الإعداد
- **الأمان** — سياسة الرسائل الخاصة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل الخاصة
- **صياغة الجلسة** — كيف تُربط معرّفات المحادثات الخاصة بالموفر بالمحادثات الأساسية ومعرّفات السلاسل وبدائل الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية ترتيب الردود في سلاسل
- **كتابة Heartbeat** — إشارات اختيارية للكتابة/الانشغال لأهداف تسليم Heartbeat

تتولى النواة أداة الرسائل المشتركة، وربط الموجّه، والشكل الخارجي لمفتاح الجلسة،
والاحتفاظ العام بـ `:thread:`، والتوزيع.

إذا كانت قناتك تدعم مؤشرات الكتابة خارج الردود الواردة، فوفّر
`heartbeat.sendTyping(...)` على Plugin القناة. تستدعيه النواة مع
هدف تسليم Heartbeat الذي تم تحليله قبل بدء تشغيل نموذج Heartbeat
وتستخدم دورة الحياة المشتركة للإبقاء على الكتابة/التنظيف. أضف `heartbeat.clearTyping(...)`
عندما تحتاج المنصة إلى إشارة توقف صريحة.

إذا كانت قناتك تضيف معاملات message-tool تحمل مصادر وسائط، فاكشف عن أسماء
هذه المعاملات من خلال `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسار sandbox وسياسة الوصول إلى الوسائط الصادرة،
بحيث لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعلمات الصورة الرمزية أو
المرفقات أو صورة الغلاف الخاصة بموفر معين.
ويُفضّل إرجاع خريطة مفاتيحها الإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير المرتبطة
وسائط إجراء آخر. وما يزال المصفوفة المسطحة تعمل للمعاملات التي
تتم مشاركتها عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذه هي
النقطة القياسية لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة
الاختياري، و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
عند إرجاع `parentConversationCandidates`، أبقها مرتبة من
الأصل الأضيق إلى المحادثة الأوسع/الأساسية.

يمكن أيضًا لـ Plugins المضمّنة التي تحتاج التحليل نفسه قبل إقلاع سجل القنوات
كشف ملف علوي باسم `session-key-api.ts` مع
تصدير `resolveSessionConversation(...)` مطابق. تستخدم النواة هذه الواجهة الآمنة
للإقلاع فقط عندما لا يكون سجل Plugin وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا
كبديل توافق قديم عندما يحتاج Plugin فقط إلى بدائل أصل فوق
المعرّف الخام/العام. إذا وُجدت كلتا النقطتين، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ثم
تعود إلى `resolveParentConversationCandidates(...)` فقط عندما تُهمل
النقطة القياسية هذه القيم.

## الموافقات وإمكانات القناة

لا تحتاج معظم Plugins القنوات إلى شيفرة خاصة بالموافقات.

- تتولى النواة `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل كائن `approvalCapability` واحدًا على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلي/عرض/مصادقة الموافقة على `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- تمثل `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` الواجهة القياسية لمصادقة الموافقة.
- استخدم `approvalCapability.getActionAvailabilityState` لإتاحة مصادقة الموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تكشف موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة السطح البادئ/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل الدردشة نفسها. تستخدم النواة هذا الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتقرير ما إذا كانت القناة البادئة تدعم موافقات exec الأصلية، وتضمين القناة في إرشادات الرجوع إلى العميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` ذلك في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات كتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلي أو منع التسليم الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية للموافقة التي تملكها القناة. أبقه كسولًا في نقاط دخول القناة الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد وحدة وقت التشغيل لديك عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطّل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات exec الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب أن تعرض القنوات ذات الحسابات المسماة مسارات ذات نطاق حساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية العلوية.
- إذا كان بإمكان القناة استنتاج هويات رسائل خاصة مستقرة شبيهة بالمالك من الإعداد الموجود، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها من دون إضافة منطق خاص بالموافقة في النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلي، فأبقِ شيفرة القناة مركزة على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضّل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك ترشيح الطلبات والتوجيه وإزالة التكرار وانتهاء الصلاحية واشتراك Gateway وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدة واجهات أصغر:
- `availability` — ما إذا كان الحساب مُعدًا وما إذا كان ينبغي التعامل مع الطلب
- `presentation` — ربط نموذج العرض المشترك للموافقة بحمولات أصلية معلّقة/محسومة/منتهية أو إجراءات نهائية
- `transport` — تجهيز الأهداف ثم إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات يملكها وقت التشغيل مثل عميل أو رمز مميز أو تطبيق Bolt أو مستقبل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة إقلاع معالجات تعتمد على الإمكانات من حالة بدء القناة من دون إضافة طبقة تغليف خاصة بالموافقات.
- استخدم المستوى الأدنى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` فقط عندما لا تكون الواجهة المعتمدة على الإمكانات معبّرة بما يكفي بعد.
- يجب على قنوات الموافقة الأصلية تمرير كلٍّ من `accountId` و`approvalKind` عبر هذه المساعدات. يحافظ `accountId` على تقييد سياسة الموافقة متعددة الحسابات على حساب البوت الصحيح، ويُبقي `approvalKind` سلوك موافقات exec مقابل موافقات Plugin متاحًا للقناة من دون تفرعات ثابتة في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقة. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "ذهبت الموافقة إلى الرسائل الخاصة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل اكشف بدلًا من ذلك عن توجيه دقيق للأصل + الرسائل الخاصة للمُوافق عبر مساعدات إمكانات الموافقة المشتركة ودَع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار مرة أخرى إلى الدردشة البادئة.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. يجب ألا تقوم العملاء الأصلية
  بتخمين أو إعادة كتابة توجيه موافقات exec مقابل موافقات Plugin من حالة محلية للقناة.
- يمكن لأنواع الموافقات المختلفة أن تكشف عمدًا عن أسطح أصلية مختلفة.
  الأمثلة المضمّنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقة الأصلية لكل من معرّفات exec وPlugin.
  - يحتفظ Matrix بتوجيه الرسائل الخاصة/القنوات الأصلي نفسه وتجربة التفاعل نفسها لموافقات exec
    وPlugin، مع السماح مع ذلك باختلاف المصادقة حسب نوع الموافقة.
- ما يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن يجب أن تفضّل الشيفرة الجديدة منشئ الإمكانات وأن تكشف `approvalCapability` على Plugin.

في نقاط دخول القناة الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج إلى جزء واحد فقط من هذه المجموعة:

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
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
المظلي الأوسع.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة وقت التشغيل:
  موائمات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظة البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ومنشئات
  الوكيل المفوض للإعداد
- يمثّل `openclaw/plugin-sdk/setup-adapter-runtime` الواجهة الضيقة الواعية بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` منشئات الإعداد ذات التثبيت الاختياري
  بالإضافة إلى عدد قليل من البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعة بمتغيرات البيئة، أو إذا كان ينبغي
لتدفقات بدء التشغيل/الإعداد العامة معرفة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل،
فأعلن عنها في بيان Plugin باستخدام `channelEnvVars`. وأبقِ `envVars` في وقت تشغيل القناة
أو الثوابت المحلية للنسخ الموجهة للمشغل فقط.

إذا كان يمكن لقناتك أن تظهر في `status` أو `channels list` أو `channels status` أو
عمليات فحص SecretRef قبل بدء وقت تشغيل Plugin، فأضف `openclaw.setupEntry` في
`package.json`. يجب أن تكون نقطة الدخول هذه آمنة للاستيراد في مسارات الأوامر
للقراءة فقط، ويجب أن تُرجع بيانات تعريف القناة، وموائم الإعداد الآمن،
وموائم الحالة، وبيانات تعريف الهدف السري للقناة اللازمة لهذه الملخصات. لا تقم
بتشغيل العملاء أو المستمعين أو أوقات تشغيل النقل من نقطة دخول الإعداد.

أبقِ مسار استيراد إدخال القناة الرئيسي ضيقًا أيضًا. يمكن لعملية الاكتشاف تقييم
الإدخال ووحدة Plugin القناة لتسجيل الإمكانات من دون تفعيل القناة.
يجب أن تصدّر ملفات مثل `channel-plugin-api.ts` كائن Plugin القناة
من دون استيراد معالجات الإعداد أو عملاء النقل أو مستمعي socket أو
مشغلات العمليات الفرعية أو وحدات بدء الخدمة. ضع أجزاء وقت التشغيل هذه
في وحدات تُحمّل من `registerFull(...)` أو واضعات وقت التشغيل أو موائمات
الإمكانات الكسولة.

`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`،
و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم الواجهة الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في أسطح
الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المحوّل/المعالج المُولَّدان بشكل مغلق عند كتابة الإعدادات والإنهاء، ويعيدان استخدام
رسالة التثبيت المطلوبة نفسها عبر التحقق والإنهاء ونسخة رابط الوثائق.

وبالنسبة إلى مسارات القناة الساخنة الأخرى، فضّل المساعدات الضيقة على الأسطح
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`،
  و`openclaw/plugin-sdk/account-id`،
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` للمسار/الظرف الوارد و
  ربط التسجيل والتوزيع
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوضات الهوية/الإرسال الصادرة وتخطيط الحمولة
- `buildThreadAwareOutboundSessionRoute(...)` من
  `openclaw/plugin-sdk/channel-core` عندما ينبغي لمسار صادر أن يحافظ على
  `replyToId`/`threadId` صريح أو أن يستعيد جلسة `:thread:` الحالية
  بعد أن يبقى مفتاح الجلسة الأساسي متطابقًا. يمكن Plugins الموفرين تجاوز
  الأولوية وسلوك اللاحقة وتطبيع معرّف السلسلة عندما تكون لمنصتهم
  دلالات تسليم أصلية للسلاسل.
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المحولات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تخطيط
  حقل حمولة agent/media القديم ما يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعداد أوامر مستقر عند الرجوع

يمكن للقنوات المخصّصة للمصادقة فقط عادةً التوقف عند المسار الافتراضي: تتولى النواة الموافقات ويكشف Plugin فقط إمكانات الصادر/المصادقة. أما قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram وناقلات الدردشة المخصصة فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة الواردة

أبقِ التعامل مع الإشارة الواردة مقسّمًا إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-mention-gating` لقرارات
سياسة الإشارة. واستخدم `openclaw/plugin-sdk/channel-inbound` فقط عندما تحتاج إلى
شريط مساعدات الوارد الأوسع.

مناسب جيدًا للمنطق المحلي في Plugin:

- كشف الرد على البوت
- كشف الاقتباس من البوت
- فحوصات المشاركة في السلسلة
- استثناءات رسائل الخدمة/النظام
- الذاكرات المؤقتة الأصلية للمنصة اللازمة لإثبات مشاركة البوت

مناسب جيدًا للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
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

يكشف `api.runtime.channel.mentions` عن مساعدات الإشارة المشتركة نفسها
لـ Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

إذا كنت تحتاج فقط إلى `implicitMentionKindWhen` و
`resolveInboundMentionDecision`، فاستورد من
`openclaw/plugin-sdk/channel-mention-gating` لتجنب تحميل مساعدات وقت تشغيل
وارد غير مرتبطة.

تبقى مساعدات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. يجب أن تستخدم
الشيفرة الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## شرح تفصيلي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة والبيان">
    أنشئ ملفات Plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على السطح الكامل لبيانات تعريف الحزمة،
    راجع [إعداد Plugin وتهيئته](/ar/plugins/sdk-setup#openclaw-channel):

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
              "label": "رمز البوت",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    يتحقق `configSchema` من `plugins.entries.acme-chat.config`. استخدمه من أجل
    الإعدادات المملوكة لـ Plugin التي لا تمثل إعداد حساب القناة. يتحقق `channelConfigs`
    من `channels.acme-chat` وهو مصدر المسار البارد الذي تستخدمه
    مخططات الإعدادات والإعداد وواجهات المستخدم قبل تحميل وقت تشغيل Plugin.

  </Step>

  <Step title="أنشئ كائن Plugin القناة">
    تحتوي واجهة `ChannelPlugin` على العديد من أسطح المحولات الاختيارية. ابدأ بالحد
    الأدنى — `id` و`setup` — ثم أضف المحولات حسب الحاجة.

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

    <Accordion title="ما الذي يقدمه لك createChatChannelPlugin">
      بدلًا من تنفيذ واجهات المحولات منخفضة المستوى يدويًا، فإنك تمرّر
      خيارات وصفية ويقوم المُنشئ بتركيبها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلل أمان الرسائل الخاصة المقيّد من حقول الإعداد |
      | `pairing.text` | تدفق اقتران رسائل خاصة قائم على النص مع تبادل رمز |
      | `threading` | محلل وضع الرد (ثابت أو مقيّد بالحساب أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تُرجع بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات محولات خام بدلًا من الخيارات الوصفية
      إذا كنت تحتاج إلى تحكم كامل.

      يمكن لمحولات الصادر الخام تعريف دالة `chunker(text, limit, ctx)`.
      يحمل `ctx.formatting` الاختياري قرارات التنسيق وقت التسليم
      مثل `maxLinesPerMessage`؛ طبّقها قبل الإرسال حتى تُحل
      حدود تسلسل الردود والكتل مرة واحدة بواسطة التسليم الصادر المشترك.
      تتضمن سياقات الإرسال أيضًا `replyToIdSource` (`implicit` أو `explicit`)
      عندما يُحل هدف رد أصلي، حتى تتمكن مساعدات الحمولة من الحفاظ على
      وسوم الرد الصريحة دون استهلاك خانة رد ضمني أحادية الاستخدام.
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
    من عرضها في المساعدة الجذرية دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط التحميلات الكاملة العادية الواصفات نفسها لتسجيل الأوامر الفعلي.
    وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بالـ Plugin. تبقى مساحات أسماء الإدارة في النواة (`config.*`،
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا إلى
    `operator.admin`.
    يتولى `defineChannelPluginEntry` تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) للاطلاع على جميع
    الخيارات.

  </Step>

  <Step title="أضف نقطة دخول للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطلة
    أو غير مُعدّة. وهذا يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) للتفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل التصديرات الآمنة للإعداد إلى
    وحدات جانبية استخدام `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    واضع وقت تشغيل صريح خاص بوقت الإعداد.

  </Step>

  <Step title="تعامل مع الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استلام الرسائل من المنصة وإعادة توجيهها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب ويقوم
    بتوزيعه عبر معالج الوارد الخاص بقناتك:

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
      يكون التعامل مع الرسائل الواردة خاصًا بالقناة. يمتلك كل Plugin قناة
      خط معالجة الوارد الخاص به. ألقِ نظرة على Plugins القنوات المضمّنة
      (على سبيل المثال حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط فعلية.
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
├── package.json              # بيانات تعريف openclaw.channel
├── openclaw.plugin.json      # البيان مع مخطط الإعداد
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # التصديرات العامة (اختياري)
├── runtime-api.ts            # تصديرات وقت التشغيل الداخلية (اختياري)
└── src/
    ├── channel.ts            # ChannelPlugin عبر createChatChannelPlugin
    ├── channel.test.ts       # الاختبارات
    ├── client.ts             # عميل API الخاص بالمنصة
    └── runtime.ts            # مخزن وقت التشغيل (عند الحاجة)
```

## موضوعات متقدمة

<CardGroup cols={2}>
  <Card title="خيارات التسلسل" icon="git-branch" href="/ar/plugins/sdk-entrypoints#registration-mode">
    أوضاع رد ثابتة أو مقيّدة بالحساب أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="تحليل الهدف" icon="crosshair" href="/ar/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
ما تزال بعض واجهات المساعدات المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك ما لم تكن تصون عائلة Plugin المضمّنة تلك مباشرة.
</Note>

## الخطوات التالية

- [Plugins الموفر](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [بيان Plugin](/ar/plugins/manifest) — مخطط البيان الكامل

## ذو صلة

- [إعداد Plugin SDK](/ar/plugins/sdk-setup)
- [إنشاء Plugins](/ar/plugins/building-plugins)
- [Plugins حزام agent](/ar/plugins/sdk-agent-harness)

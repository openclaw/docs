---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ `ChannelPlugin`
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins القنوات
x-i18n:
    generated_at: "2026-04-15T07:17:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7f4c746fe3163a8880e14c433f4db4a1475535d91716a53fb879551d8d62f65
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins القنوات

يشرح هذا الدليل كيفية بناء Plugin قناة يربط OpenClaw بمنصة
مراسلة. وبنهاية هذا الدليل سيكون لديك قناة عاملة تتضمن أمان الرسائل
المباشرة، والاقتران، وتوجيه الردود ضمن السلاسل، والرسائل الصادرة.

<Info>
  إذا لم تكن قد أنشأت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا لمعرفة بنية الحزمة
  الأساسية وإعداد ملف البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` واحدة مشتركة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **الإعداد** — حلّ الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل المباشرة
- **صياغة الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالموفّر بالمحادثات الأساسية ومعرّفات السلاسل وبدائل الأصل
- **الإرسال الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية ترتيب الردود ضمن السلاسل

تتولى النواة أداة الرسائل المشتركة، وربط الـ prompt، والشكل الخارجي لمفتاح
الجلسة، وتتبع `:thread:` العام، والإرسال.

إذا كانت قناتك تضيف معاملات إلى أداة الرسائل تحمل مصادر وسائط، فاكشف عن أسماء
هذه المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم النواة
هذه القائمة الصريحة لتطبيع مسارات sandbox ولسياسة الوصول إلى الوسائط الصادرة،
لذلك لا تحتاج Plugins إلى حالات خاصة في النواة المشتركة لمعاملات الصور الرمزية
أو المرفقات أو صور الغلاف الخاصة بموفّر معيّن.
ويُفضّل إرجاع خريطة مفاتيحها مبنية على الإجراء مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
ذات الصلة معاملات الوسائط الخاصة بإجراء آخر. ولا يزال المصفوفة المسطحة تعمل مع
المعاملات التي يُقصد مشاركتها عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزّن نطاقًا إضافيًا داخل معرّفات المحادثة، فأبقِ هذا التحليل
داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`. هذا هو
الخطاف المعتمد لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
وعندما تُرجع `parentConversationCandidates`، فاحرص على إبقائها مرتبة من
الأصل الأضيق إلى الأصل الأوسع/المحادثة الأساسية.

يمكن أيضًا لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل تشغيل سجل
القنوات أن تكشف عن ملف `session-key-api.ts` على المستوى الأعلى مع
تصدير مطابق لـ `resolveSessionConversation(...)`. تستخدم النواة هذا السطح
الآمن أثناء الإقلاع فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

لا يزال `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل
توافقي قديم عندما يحتاج Plugin فقط إلى بدائل الأصل فوق المعرّف العام/الخام.
إذا وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا ولا
تعود إلى `resolveParentConversationCandidates(...)` إلا عندما يهمل الخطاف
المعتمد إرجاعها.

## الموافقات وإمكانات القناة

لا تحتاج معظم Plugins القنوات إلى كود خاص بالموافقات.

- تتولى النواة `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، وآلية التسليم العامة البديلة.
- يُفضَّل استخدام كائن `approvalCapability` واحد على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلية/عرض/مصادقة الموافقة على `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- يُعد `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` الواجهة المعتمدة لمصادقة الموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لإتاحة مصادقة الموافقة داخل المحادثة نفسها.
- إذا كانت قناتك تكشف عن موافقات تنفيذ أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. تستخدم النواة هذا الخطاف الخاص بالتنفيذ للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة الداعية تدعم موافقات التنفيذ الأصلية، وإدراج القناة في إرشادات الرجوع إلى العميل الأصلي. يقوم `createApproverRestrictedNativeApprovalCapability(...)` بملء ذلك في الحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقات الأصلية أو منع التسليم الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية الخاصة بالموافقة التي تملكها القناة. أبقه كسول التحميل في نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، إذ يمكنه استيراد وحدة وقت التشغيل عند الطلب مع الاستمرار في تمكين النواة من تجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصّصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطّل مفاتيح الإعداد الدقيقة اللازمة لتمكين موافقات التنفيذ الأصلية. يتلقى الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسمّاة عرض مسارات بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الإعدادات الافتراضية على المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعداد الحالي، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها من دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقات أصلية، فأبقِ كود القناة مركّزًا على تطبيع الهدف وحقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضّل أن يكون ذلك عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وتولّي تصفية الطلبات والتوجيه وإزالة التكرار والانتهاء والاشتراك في Gateway وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدد قليل من الواجهات الأصغر:
- `availability` — ما إذا كان الحساب مضبوطًا وما إذا كان ينبغي معالجة الطلب
- `presentation` — ربط نموذج عرض الموافقة المشترك بحمولات أصلية معلّقة/محلولة/منتهية أو بإجراءات نهائية
- `transport` — إعداد الأهداف ثم إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية لربط/فصل/مسح الإجراءات للأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات يملكها وقت التشغيل مثل عميل أو رمز أو تطبيق Bolt أو مستقبل Webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل سياق وقت التشغيل العام للنواة إقلاع المعالجات المبنية على الإمكانات انطلاقًا من حالة بدء القناة من دون إضافة طبقة ربط خاصة بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` منخفضَي المستوى إلا عندما لا تكون الواجهة المعتمدة على الإمكانات معبّرة بما يكفي بعد.
- يجب على قنوات الموافقة الأصلية تمرير كلٍّ من `accountId` و`approvalKind` عبر هذه المساعدات. يُبقي `accountId` سياسة الموافقة متعددة الحسابات ضمن نطاق حساب البوت الصحيح، ويُبقي `approvalKind` سلوك موافقة التنفيذ مقابل موافقة Plugin متاحًا للقناة من دون تفرعات مضمّنة في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقة. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل اكشف بدلًا من ذلك عن توجيه دقيق للأصل + الرسائل المباشرة للموافق عبر مساعدات إمكانات الموافقة المشتركة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار مرة أخرى إلى محادثة البدء.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. يجب ألا
  تخمّن العملاء الأصلية أو تعيد كتابة توجيه موافقة التنفيذ مقابل موافقة Plugin
  اعتمادًا على حالة محلية خاصة بالقناة.
- يمكن لأنواع الموافقة المختلفة أن تكشف عمدًا عن أسطح أصلية مختلفة.
  الأمثلة المضمّنة الحالية:
  - يُبقي Slack توجيه الموافقات الأصلية متاحًا لكلٍّ من معرّفات موافقة التنفيذ وموافقة Plugin.
  - يُبقي Matrix توجيه الرسائل المباشرة/القناة الأصلي نفسه وتجربة UX نفسها القائمة على التفاعل لكلٍّ من موافقات التنفيذ وموافقات Plugin، مع الاستمرار في السماح باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافقي، لكن يجب أن يفضّل الكود الجديد باني الإمكانات وأن يكشف `approvalCapability` على Plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، يُفضّل استخدام المسارات الفرعية الأضيق لوقت التشغيل عندما تحتاج فقط
إلى جزء واحد من هذه المجموعة:

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

وبالمثل، يُفضّل `openclaw/plugin-sdk/setup-runtime`،
و`openclaw/plugin-sdk/setup-adapter-runtime`،
و`openclaw/plugin-sdk/reply-runtime`،
و`openclaw/plugin-sdk/reply-dispatch-runtime`،
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح الأشمل
ذي المظلة الأوسع.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  مهايئات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبُناة
  الوكيل المفوّض للإعداد
- يمثّل `openclaw/plugin-sdk/setup-adapter-runtime` الواجهة
  الضيقة الواعية بالبيئة الخاصة بـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بُناة الإعداد
  الخاصة بالتثبيت الاختياري بالإضافة إلى بعض الأساسيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`,

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعَين بالبيئة وكان ينبغي أن تعرف
تدفقات الإقلاع/الإعداد العامة أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل،
فصرّح بها في ملف بيان Plugin عبر `channelEnvVars`. واحتفظ بـ
`envVars` الخاص بوقت تشغيل القناة أو الثوابت المحلية لنسخ النصوص الموجّهة
للمشغّل فقط.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم واجهة `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/الضبط المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في
أسطح الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المهايئ/المعالج المُنشأان بإغلاق آمن عند كتابة الإعدادات وعند الإنهاء،
ويعيدان استخدام رسالة "التثبيت مطلوب" نفسها عبر التحقق والإنهاء ونسخة
رابط التوثيق.

بالنسبة إلى مسارات القنوات الساخنة الأخرى، يُفضّل استخدام المساعدات الضيقة بدلًا من
الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  و`openclaw/plugin-sdk/account-id`,
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` للإعدادات متعددة الحسابات
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لربط
  المسار/الغلاف الوارد وتسجيله ثم إرساله
- `openclaw/plugin-sdk/messaging-targets` لتحليل الأهداف ومطابقتها
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط
  بالإضافة إلى مفوّضي الهوية/الإرسال الصادر
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تنسيق حقل
  حمولة agent/media القديم لا يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع
  الأوامر المخصصة في Telegram، والتحقق من التكرار/التعارض، وعقد إعداد
  أوامر ثابت كبديل احتياطي

يمكن لقنوات المصادقة فقط عادةً الاكتفاء بالمسار الافتراضي: تتولى النواة الموافقات ويكشف Plugin فقط عن إمكانات الإرسال الصادر/المصادقة. أما قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائط الدردشة المخصصة، فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة الواردة

أبقِ معالجة الإشارات الواردة مقسّمة إلى طبقتين:

- جمع الأدلة الذي يملكه Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-inbound` للطبقة المشتركة.

ملائم لمنطق Plugin المحلي:

- اكتشاف الرد على البوت
- اكتشاف الاقتباس من البوت
- التحقق من المشاركة في السلسلة
- استبعاد رسائل الخدمة/النظام
- الذاكرات المؤقتة الأصلية الخاصة بالمنصة اللازمة لإثبات مشاركة البوت

ملائم للمساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة سماح الإشارة الضمنية
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

تبقى مساعدات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافقية فقط. يجب أن يستخدم
الكود الجديد `resolveInboundMentionDecision({ facts, policy })`.

## شرح عملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وملف البيان">
    أنشئ ملفات Plugin القياسية. إن الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات الحزمة الكامل،
    راجع [إعداد Plugin وضبطه](/ar/plugins/sdk-setup#openclaw-channel):

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

  <Step title="أنشئ كائن Plugin القناة">
    تحتوي الواجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
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

    <Accordion title="ما الذي يقدمه لك createChatChannelPlugin">
      بدلًا من تنفيذ واجهات المهايئات منخفضة المستوى يدويًا، تمرّر
      خيارات تصريحية ويتولى الباني تجميعها:

      | Option | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلّل أمان الرسائل المباشرة المقيّد بنطاق حقول الإعداد |
      | `pairing.text` | تدفق اقتران رسائل مباشرة قائم على النص مع تبادل الرموز |
      | `threading` | محلّل نمط الرد (ثابت، مقيّد بالحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تُرجع بيانات تعريفية للنتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئ خام بدلًا من الخيارات التصريحية
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

    ضع واصفات CLI التي تملكها القناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في المساعدة الجذرية من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تلتقط عمليات التحميل الكاملة العادية الواصفات نفسها لتسجيل
    الأوامر الفعلي. وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    إذا كان `registerFull(...)` يسجّل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بالـ Plugin. تظل مساحات أسماء إدارة النواة (`config.*`,
    `exec.approvals.*`, `wizard.*`, `update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` معالجة تقسيم وضع التسجيل تلقائيًا. راجع
    [نقاط الدخول](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لمعرفة جميع
    الخيارات.

  </Step>

  <Step title="أضف نقطة دخول للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الدخول الكاملة عندما تكون القناة معطّلة
    أو غير مهيأة. وهذا يتجنب سحب كود وقت تشغيل ثقيل أثناء تدفقات الإعداد.
    راجع [الإعداد والضبط](/ar/plugins/sdk-setup#setup-entry) لمعرفة التفاصيل.

  </Step>

  <Step title="عالج الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى استلام الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط الشائع هو Webhook يتحقق من الطلب ثم
    يرسله عبر معالج الوارد الخاص بقناتك:

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
      معالجة الرسائل الواردة خاصة بكل قناة. كل Plugin قناة يملك
      خط أنبوب الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط فعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات مرافقة في `src/channel.test.ts`:

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
├── openclaw.plugin.json      # ملف البيان مع مخطط الإعداد
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
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="تحليل الهدف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType وlooksLikeId وresolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض واجهات المساعدات المضمّنة موجودة لصيانة Plugins المضمّنة
ولأغراض التوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
بل يُفضّل استخدام المسارات الفرعية العامة channel/setup/reply/runtime من
سطح SDK المشترك ما لم تكن تصون تلك العائلة من Plugins المضمّنة مباشرةً.
</Note>

## الخطوات التالية

- [Plugins الموفّرات](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر النماذج أيضًا
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل للاستيراد عبر المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [ملف بيان Plugin](/ar/plugins/manifest) — المخطط الكامل لملف البيان

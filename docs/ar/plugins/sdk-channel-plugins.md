---
read_when:
    - أنت تبني Plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء Plugin لقناة مراسلة لـ OpenClaw
title: بناء Plugins للقنوات
x-i18n:
    generated_at: "2026-04-15T19:41:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80e47e61d1e47738361692522b79aff276544446c58a7b41afe5296635dfad4b
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء Plugins للقنوات

يوضح هذا الدليل كيفية بناء Plugin لقناة يربط OpenClaw بمنصة
مراسلة. بنهاية هذا الدليل، سيكون لديك قناة عاملة تتضمن أمان الرسائل
المباشرة، والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي Plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرّف على بنية
  الحزمة الأساسية وإعداد ملف البيان.
</Info>

## كيف تعمل Plugins القنوات

لا تحتاج Plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` واحدة مشتركة في النواة. ويتولى Plugin الخاص بك ما يلي:

- **الإعداد** — حلّ الحسابات ومعالج الإعداد
- **الأمان** — سياسة الرسائل المباشرة وقوائم السماح
- **الاقتران** — تدفق الموافقة على الرسائل المباشرة
- **بنية الجلسة** — كيفية تعيين معرّفات المحادثات الخاصة بالموفّر إلى الدردشات الأساسية، ومعرّفات السلاسل، وبدائل الأصل
- **الصادر** — إرسال النصوص والوسائط والاستطلاعات إلى المنصة
- **التسلسل** — كيفية تنظيم الردود ضمن سلاسل

تتولى النواة أداة الرسائل المشتركة، وتوصيل المطالبات، وشكل مفتاح الجلسة
الخارجي، وآلية `:thread:` العامة، والتوجيه.

إذا كانت قناتك تضيف معاملات إلى أداة الرسائل تحمل مصادر وسائط، فاكشف عن
أسماء هذه المعاملات عبر `describeMessageTool(...).mediaSourceParams`. تستخدم
النواة هذه القائمة الصريحة لتطبيع مسارات sandbox وسياسة الوصول إلى الوسائط
الصادرة، لذلك لا تحتاج Plugins إلى حالات خاصة مشتركة في النواة لمعلمات
الصورة الرمزية أو المرفقات أو صورة الغلاف الخاصة بموفّرين محددين.
يُفضَّل إرجاع خريطة مرتبطة بالإجراءات مثل
`{ "set-profile": ["avatarUrl", "avatarPath"] }` حتى لا ترث الإجراءات غير
ذات الصلة معاملات الوسائط الخاصة بإجراء آخر. ولا يزال استخدام مصفوفة
مسطحة يعمل مع المعاملات التي يُقصَد مشاركتها عمدًا عبر كل إجراء مكشوف.

إذا كانت منصتك تخزّن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا
التحليل داخل Plugin باستخدام `messaging.resolveSessionConversation(...)`.
هذا هو الخطاف القياسي لتعيين `rawId` إلى معرّف المحادثة الأساسي، ومعرّف
السلسلة الاختياري، و`baseConversationId` الصريح، وأي
`parentConversationCandidates`.
وعند إرجاع `parentConversationCandidates`، احرص على ترتيبها من الأصل الأكثر
تحديدًا إلى الأصل الأوسع/المحادثة الأساسية.

يمكن أيضًا لـ Plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل إقلاع سجل
القنوات أن تكشف عن ملف `session-key-api.ts` على المستوى الأعلى مع
تصدير مطابق لـ `resolveSessionConversation(...)`. تستخدم النواة هذا السطح
الآمن لمرحلة الإقلاع فقط عندما لا يكون سجل Plugins وقت التشغيل متاحًا بعد.

يبقى `messaging.resolveParentConversationCandidates(...)` متاحًا كبديل
توافقي قديم عندما يحتاج Plugin فقط إلى بدائل الأصل فوق المعرّف الخام/العام.
إذا وُجد الخطافان معًا، تستخدم النواة
`resolveSessionConversation(...).parentConversationCandidates` أولًا، ثم
تعود إلى `resolveParentConversationCandidates(...)` فقط عندما يتجاهل
الخطاف القياسي إرجاعها.

## الموافقات وإمكانات القنوات

معظم Plugins القنوات لا تحتاج إلى شيفرة خاصة بالموافقات.

- تتولى النواة `/approve` داخل المحادثة نفسها، وحمولات أزرار الموافقة المشتركة، والتسليم الاحتياطي العام.
- فضّل استخدام كائن `approvalCapability` واحد على Plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- أُزيل `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلي/عرض/مصادقة الموافقة ضمن `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ لم تعد النواة تقرأ خطافات مصادقة الموافقة من هذا الكائن.
- يُعدّ `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` الواجهة القياسية لمصادقة الموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لإتاحة مصادقة الموافقة داخل المحادثة نفسها.
- إذا كانت قناتك تكشف عن موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة سطح البدء/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل المحادثة نفسها. تستخدم النواة هذا الخطاف الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت قناة البدء تدعم موافقات exec الأصلية، وإدراج القناة في إرشادات الرجوع إلى العميل الأصلي. يملأ `createApproverRestrictedNativeApprovalCapability(...)` هذا الجزء للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلي أو منع الرجوع الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية الخاصة بالموافقة التي تملكها القناة. أبقه كسول التحميل في نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، والذي يمكنه استيراد وحدة وقت التشغيل عند الطلب مع السماح للنواة بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد المسار المعطّل مقابض الإعداد الدقيقة اللازمة لتمكين موافقات exec الأصلية. يستقبل الخطاف `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسماة عرض مسارات بنطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من القيم الافتراضية على المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات رسائل مباشرة مستقرة شبيهة بالمالك من الإعداد الموجود، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل المحادثة نفسها دون إضافة منطق خاص بالموافقة إلى النواة.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلي، فحافظ على تركيز شيفرة القناة على تطبيع الهدف بالإضافة إلى حقائق النقل/العرض. استخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. ضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضّل أن يكون ذلك عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى تتمكن النواة من تجميع المعالج وامتلاك تصفية الطلبات، والتوجيه، وإزالة التكرار، وانتهاء الصلاحية، واشتراك Gateway، وإشعارات التوجيه إلى مكان آخر. ينقسم `nativeRuntime` إلى عدة واجهات أصغر:
- `availability` — ما إذا كان الحساب مُعدًّا وما إذا كان ينبغي التعامل مع الطلب
- `presentation` — تعيين نموذج عرض الموافقة المشترك إلى حمولات أصلية قيد الانتظار/محلولة/منتهية الصلاحية أو إجراءات نهائية
- `transport` — إعداد الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — خطافات اختيارية للربط/إلغاء الربط/مسح الإجراء للأزرار أو التفاعلات الأصلية
- `observe` — خطافات اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات مملوكة لوقت التشغيل مثل عميل أو رمز مميّز أو تطبيق Bolt أو مستقبل Webhook، فسجّلها من خلال `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام للنواة إقلاع معالجات مدفوعة بالإمكانات من حالة بدء تشغيل القناة دون إضافة غراء تغليف خاص بالموافقة.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` منخفضي المستوى إلا عندما لا تكون الواجهة المدفوعة بالإمكانات معبّرة بما يكفي بعد.
- يجب أن تمرّر قنوات الموافقة الأصلية كِلا `accountId` و`approvalKind` عبر هذه المساعدات. يُبقي `accountId` سياسة الموافقة متعددة الحسابات ضمن نطاق حساب البوت الصحيح، ويُبقي `approvalKind` سلوك exec مقابل موافقة Plugin متاحًا للقناة دون تفرعات مشفّرة مسبقًا في النواة.
- تتولى النواة الآن أيضًا إشعارات إعادة توجيه الموافقات. يجب ألا ترسل Plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل المباشرة / قناة أخرى" من `createChannelNativeApprovalRuntime`; وبدلًا من ذلك، اكشف عن توجيه دقيق للأصل + الرسائل المباشرة للموافق عبر مساعدات إمكانات الموافقة المشتركة، ودع النواة تجمع عمليات التسليم الفعلية قبل نشر أي إشعار مرة أخرى إلى محادثة البدء.
- حافظ على نوع معرّف الموافقة الذي تم تسليمه من البداية إلى النهاية. يجب ألا
  تخمّن العملاء الأصلية أو تعيد كتابة توجيه موافقة exec مقابل Plugin من حالة
  محلية خاصة بالقناة.
- يمكن لأنواع الموافقات المختلفة عمدًا أن تكشف عن أسطح أصلية مختلفة.
  الأمثلة المضمّنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقة الأصلي لكل من معرّفات exec وPlugin.
  - يحتفظ Matrix بالتوجيه الأصلي نفسه للرسائل المباشرة/القناة وتجربة التفاعل لـ exec
    وموافقات Plugin، مع الاستمرار في السماح لاختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافقي، لكن الشيفرة الجديدة يجب أن تفضّل مُنشئ الإمكانات وتكشف عن `approvalCapability` على Plugin.

لنقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما
تحتاج فقط إلى جزء واحد من هذه المجموعة:

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
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
الأوسع الشامل.

وبالنسبة إلى الإعداد على وجه التحديد:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  مهايئات ترقيع الإعداد الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  `createEnvPatchedAccountSetupAdapter`,
  `createSetupInputPresenceValidator`)، ومخرجات
  ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، ومنشئات
  وكيل الإعداد المفوّض
- يُعد `openclaw/plugin-sdk/setup-adapter-runtime` الواجهة الضيقة الواعية بالبيئة
  لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` منشئات الإعداد ذات التثبيت الاختياري
  بالإضافة إلى بعض البدائيات الآمنة للإعداد:
  `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم إعدادًا أو مصادقة مدفوعين بالبيئة، وكان ينبغي أن تعرف
تدفقات البدء/الإعداد العامة أسماء متغيرات البيئة تلك قبل تحميل وقت التشغيل،
فصرّح عنها في ملف بيان Plugin باستخدام `channelEnvVars`. واحتفظ بمتغيرات
البيئة `envVars` وقت تشغيل القناة أو الثوابت المحلية فقط لنسخة النص
الموجّهة للمشغّل.
`createOptionalChannelSetupWizard`, `DEFAULT_ACCOUNT_ID`,
`createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, و
`splitSetupEntries`

- استخدم واجهة `openclaw/plugin-sdk/setup` الأوسع فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا Plugin أولًا" في
أسطح الإعداد، ففضّل `createOptionalChannelSetupSurface(...)`. يفشل
المهايئ/المعالج المُولَّدان بشكل مغلق عند عمليات كتابة الإعداد والإنهاء،
ويعيدان استخدام الرسالة نفسها التي تفيد بضرورة التثبيت عبر التحقق والإنهاء
ونص رابط الوثائق.

وبالنسبة لمسارات القنوات الساخنة الأخرى، فضّل المساعدات الضيقة على الأسطح
القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`,
  و`openclaw/plugin-sdk/account-id`,
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعداد الحسابات المتعددة و
  الرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لتوجيه/غلاف الوارد و
  ربط التسجيل والإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى مفوّضي
  الهوية/الإرسال الصادر
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يكون تخطيط حقول
  حمولة الوكيل/الوسائط القديم لا يزال مطلوبًا
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع أوامر Telegram المخصصة،
  والتحقق من التكرار/التعارض، وعقد إعداد الأوامر المستقر عند الرجوع الاحتياطي

يمكن للقنوات التي تعتمد على المصادقة فقط عادةً الاكتفاء بالمسار الافتراضي: تتولى النواة الموافقات، ويكشف Plugin فقط عن إمكانات الصادر/المصادقة. يجب على قنوات الموافقة الأصلية مثل Matrix وSlack وTelegram ووسائط نقل الدردشة المخصصة استخدام المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارات الواردة

احرص على إبقاء معالجة الإشارات الواردة مقسّمة إلى طبقتين:

- جمع الأدلة المملوك لـ Plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-inbound` للطبقة المشتركة.

ما يناسب المنطق المحلي في Plugin:

- اكتشاف الرد على البوت
- اكتشاف الاقتباس من البوت
- التحقق من المشاركة في السلسلة
- استبعاد رسائل الخدمة/النظام
- الذاكرات المؤقتة الأصلية للمنصة اللازمة لإثبات مشاركة البوت

ما يناسب المساعد المشترك:

- `requireMention`
- نتيجة الإشارة الصريحة
- قائمة السماح للإشارة الضمنية
- تجاوز الأوامر
- قرار التخطي النهائي

التدفق المفضّل:

1. احسب حقائق الإشارة المحلية.
2. مرّر هذه الحقائق إلى `resolveInboundMentionDecision({ facts, policy })`.
3. استخدم `decision.effectiveWasMentioned` و`decision.shouldBypassMention` و`decision.shouldSkip` في بوابة الوارد الخاصة بك.

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

يكشف `api.runtime.channel.mentions` عن مساعدات الإشارة المشتركة نفسها من أجل
Plugins القنوات المضمّنة التي تعتمد بالفعل على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

تبقى مساعدات `resolveMentionGating*` الأقدم على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافقية فقط. يجب أن تستخدم
الشيفرة الجديدة `resolveInboundMentionDecision({ facts, policy })`.

## شرح عملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وملف البيان">
    أنشئ ملفات Plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا Plugin قناة. وللاطلاع على سطح بيانات وصف الحزمة الكامل،
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

  <Step title="بناء كائن Plugin للقناة">
    تحتوي الواجهة `ChannelPlugin` على العديد من أسطح المهايئات الاختيارية. ابدأ
    بالحد الأدنى — `id` و`setup` — ثم أضف المهايئات حسب حاجتك.

    أنشئ `src/channel.ts`:

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // عميل API الخاص بمنصتك

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

      // أمان الرسائل المباشرة: من يمكنه مراسلة البوت
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // الاقتران: تدفق الموافقة لجهات الاتصال الجديدة في الرسائل المباشرة
      pairing: {
        text: {
          idLabel: "اسم مستخدم Acme Chat",
          message: "أرسل هذا الرمز للتحقق من هويتك:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // التسلسل: كيفية تسليم الردود
      threading: { topLevelReplyToMode: "reply" },

      // الصادر: إرسال الرسائل إلى المنصة
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

    <Accordion title="ما الذي ينجزه `createChatChannelPlugin` لك">
      بدلًا من تنفيذ واجهات المهايئات منخفضة المستوى يدويًا، فإنك تمرّر
      خيارات تصريحية ويتولى المُنشئ تركيبها:

      | الخيار | ما الذي يوصله |
      | --- | --- |
      | `security.dm` | محلّل أمان الرسائل المباشرة المقيّد بنطاق حقول التهيئة |
      | `pairing.text` | تدفق اقتران رسائل مباشرة قائم على النص مع تبادل الرمز |
      | `threading` | محلّل وضع الرد (ثابت أو مقيّد بالحساب أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تُرجع بيانات وصفية للنتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئات خام بدلًا من الخيارات التصريحية
      إذا كنت بحاجة إلى تحكم كامل.
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

    ضع واصفات CLI المملوكة للقناة في `registerCliMetadata(...)` حتى يتمكن OpenClaw
    من عرضها في المساعدة الجذرية دون تفعيل وقت تشغيل القناة الكامل،
    بينما تستمر التحميلات الكاملة العادية في التقاط الواصفات نفسها لتسجيل
    الأوامر الفعلي. أبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    وإذا كان `registerFull(...)` يسجّل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بـ Plugin. تبقى مساحات أسماء الإدارة في النواة (`config.*`,
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا إلى
    `operator.admin`.
    يتولى `defineChannelPluginEntry` معالجة فصل أوضاع التسجيل تلقائيًا. راجع
    [نقاط الإدخال](/ar/plugins/sdk-entrypoints#definechannelpluginentry) لجميع
    الخيارات.

  </Step>

  <Step title="إضافة نقطة إدخال للإعداد">
    أنشئ `setup-entry.ts` للتحميل الخفيف أثناء الإعداد الأولي:

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    يحمّل OpenClaw هذا بدلًا من نقطة الإدخال الكاملة عندما تكون القناة معطّلة
    أو غير مهيأة. وهذا يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمزيد من التفاصيل.

    يمكن لقنوات مساحة العمل المضمّنة التي تفصل التصديرات الآمنة للإعداد في
    وحدات جانبية أن تستخدم `defineBundledChannelSetupEntry(...)` من
    `openclaw/plugin-sdk/channel-entry-contract` عندما تحتاج أيضًا إلى
    مُعيّن صريح لوقت التشغيل في وقت الإعداد.

  </Step>

  <Step title="معالجة الرسائل الواردة">
    يحتاج Plugin الخاص بك إلى تلقي الرسائل من المنصة وتمريرها إلى
    OpenClaw. النمط المعتاد هو Webhook يتحقق من الطلب ويقوم
    بإرساله عبر معالج الوارد الخاص بقناتك:

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // مصادقة يديرها Plugin (تحقق من التواقيع بنفسك)
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // يقوم معالج الوارد الخاص بك بإرسال الرسالة إلى OpenClaw.
          // يعتمد التوصيل الدقيق على SDK الخاص بمنصتك —
          // راجع مثالًا حقيقيًا في حزمة Plugin المضمّنة الخاصة بـ Microsoft Teams أو Google Chat.
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
      مسار الوارد الخاص به. انظر إلى Plugins القنوات المضمّنة
      (مثل حزمة Plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط حقيقية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
اكتب اختبارات موضوعة بجوار الشيفرة في `src/channel.test.ts`:

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
├── package.json              # بيانات openclaw.channel الوصفية
├── openclaw.plugin.json      # ملف البيان مع مخطط التهيئة
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
    أوضاع رد ثابتة، أو مقيّدة بالحساب، أو مخصصة
  </Card>
  <Card title="تكامل أداة الرسائل" icon="puzzle" href="/ar/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool واكتشاف الإجراءات
  </Card>
  <Card title="حل الأهداف" icon="crosshair" href="/ar/plugins/architecture#channel-target-resolution">
    inferTargetChatType, looksLikeId, resolveTarget
  </Card>
  <Card title="مساعدات وقت التشغيل" icon="settings" href="/ar/plugins/sdk-runtime">
    TTS وSTT والوسائط وsubagent عبر api.runtime
  </Card>
</CardGroup>

<Note>
لا تزال بعض واجهات المساعدة المضمّنة موجودة لصيانة Plugins المضمّنة
والتوافق. وهي ليست النمط الموصى به لـ Plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة للقناة/الإعداد/الرد/وقت التشغيل من سطح SDK
المشترك ما لم تكن تصون تلك العائلة من Plugins المضمّنة مباشرةً.
</Note>

## الخطوات التالية

- [Plugins الموفّرين](/ar/plugins/sdk-provider-plugins) — إذا كان Plugin الخاص بك يوفّر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [ملف بيان Plugin](/ar/plugins/manifest) — مخطط ملف البيان الكامل

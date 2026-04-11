---
read_when:
    - أنت تبني plugin جديدًا لقناة مراسلة
    - تريد ربط OpenClaw بمنصة مراسلة
    - تحتاج إلى فهم واجهة المهايئ ChannelPlugin
sidebarTitle: Channel Plugins
summary: دليل خطوة بخطوة لبناء plugin لقناة مراسلة لـ OpenClaw
title: بناء plugins القنوات
x-i18n:
    generated_at: "2026-04-11T02:46:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8a026e924f9ae8a3ddd46287674443bcfccb0247be504261522b078e1f440aef
    source_path: plugins/sdk-channel-plugins.md
    workflow: 15
---

# بناء plugins القنوات

يرشدك هذا الدليل خلال بناء plugin قناة يربط OpenClaw بمنصة
مراسلة. وبنهاية هذا الدليل، سيكون لديك قناة عاملة مع أمان DM،
والاقتران، وتسلسل الردود، والمراسلة الصادرة.

<Info>
  إذا لم تكن قد بنيت أي plugin لـ OpenClaw من قبل، فاقرأ
  [البدء](/ar/plugins/building-plugins) أولًا للتعرّف على البنية الأساسية
  للحزمة وإعداد manifest.
</Info>

## كيف تعمل plugins القنوات

لا تحتاج plugins القنوات إلى أدوات send/edit/react خاصة بها. يحتفظ OpenClaw
بأداة `message` مشتركة واحدة في core. ويتولى plugin الخاص بك:

- **الإعدادات** — تحليل الحسابات ومعالج الإعداد
- **الأمان** — سياسة DM وقوائم السماح
- **الاقتران** — تدفق الموافقة على DM
- **بنية الجلسة** — كيفية ربط معرّفات المحادثات الخاصة بالمزوّد بالدردشات الأساسية ومعرّفات السلاسل والرجوع إلى الأصل
- **الصادر** — إرسال النصوص والوسائط واستطلاعات الرأي إلى المنصة
- **التسلسل** — كيفية ترتيب الردود ضمن السلاسل

يتولى core أداة الرسائل المشتركة، وربط الموجّهات، وبنية مفتاح الجلسة الخارجية،
ومسك الدفاتر العام لـ `:thread:`، والإرسال.

إذا كانت منصتك تخزّن نطاقًا إضافيًا داخل معرّفات المحادثات، فأبقِ هذا التحليل
داخل plugin باستخدام `messaging.resolveSessionConversation(...)`. فهذا هو
المدخل القياسي لربط `rawId` بمعرّف المحادثة الأساسي، ومعرّف السلسلة الاختياري،
و`baseConversationId` الصريح، وأي `parentConversationCandidates`.
وعندما تعيد `parentConversationCandidates`، فأبقِ ترتيبها من
الأصل الأضيق إلى المحادثة الأساسية/الأوسع.

يمكن أيضًا لـ plugins المضمّنة التي تحتاج إلى التحليل نفسه قبل تشغيل
سجل القنوات أن تعرض ملف `session-key-api.ts` من المستوى الأعلى مع
تصدير مطابق لـ `resolveSessionConversation(...)`. ويستخدم core هذا السطح
الآمن للتهيئة فقط عندما لا يكون سجل plugin في وقت التشغيل متاحًا بعد.

لا يزال `messaging.resolveParentConversationCandidates(...)` متاحًا كحل
توافقي قديم عندما يحتاج plugin فقط إلى الرجوع إلى المحادثات الأصلية
فوق المعرّف العام/الخام. وإذا وُجد كلا المدخلين، يستخدم core
أولًا `resolveSessionConversation(...).parentConversationCandidates` ثم يعود
إلى `resolveParentConversationCandidates(...)` فقط عندما يهملهما المدخل القياسي.

## الموافقات وإمكانات القنوات

لا تحتاج معظم plugins القنوات إلى شيفرة خاصة بالموافقات.

- يتولى core الأمر `/approve` داخل الدردشة نفسها، وحمولات أزرار الموافقة المشتركة، وآلية التسليم الاحتياطي العامة.
- فضّل كائن `approvalCapability` واحدًا على plugin القناة عندما تحتاج القناة إلى سلوك خاص بالموافقة.
- تمت إزالة `ChannelPlugin.approvals`. ضع حقائق تسليم/أصلي/عرض/مصادقة الموافقة ضمن `approvalCapability`.
- يقتصر `plugin.auth` على login/logout فقط؛ ولم يعد core يقرأ مداخل مصادقة الموافقات من هذا الكائن.
- يُعد `approvalCapability.authorizeActorAction` و`approvalCapability.getActionAvailabilityState` مدخل المصادقة القياسي للموافقات.
- استخدم `approvalCapability.getActionAvailabilityState` لتوفّر مصادقة الموافقة داخل الدردشة نفسها.
- إذا كانت قناتك تعرض موافقات exec أصلية، فاستخدم `approvalCapability.getExecInitiatingSurfaceState` لحالة السطح المبدئي/العميل الأصلي عندما تختلف عن مصادقة الموافقة داخل الدردشة نفسها. ويستخدم core هذا المدخل الخاص بـ exec للتمييز بين `enabled` و`disabled`، وتحديد ما إذا كانت القناة المبدئية تدعم موافقات exec الأصلية، وإدراج القناة في إرشادات العميل الأصلي الاحتياطية. ويملأ `createApproverRestrictedNativeApprovalCapability(...)` ذلك للحالة الشائعة.
- استخدم `outbound.shouldSuppressLocalPayloadPrompt` أو `outbound.beforeDeliverPayload` لسلوك دورة حياة الحمولة الخاص بالقناة، مثل إخفاء مطالبات الموافقة المحلية المكررة أو إرسال مؤشرات الكتابة قبل التسليم.
- استخدم `approvalCapability.delivery` فقط لتوجيه الموافقة الأصلية أو منع التسليم الاحتياطي.
- استخدم `approvalCapability.nativeRuntime` للحقائق الأصلية للموافقة المملوكة للقناة. وأبقِه كسول التحميل في نقاط دخول القنوات الساخنة باستخدام `createLazyChannelApprovalNativeRuntimeAdapter(...)`، الذي يمكنه استيراد module وقت التشغيل الخاص بك عند الطلب مع السماح لـ core بتجميع دورة حياة الموافقة.
- استخدم `approvalCapability.render` فقط عندما تحتاج القناة فعلًا إلى حمولات موافقة مخصصة بدلًا من العارض المشترك.
- استخدم `approvalCapability.describeExecApprovalSetup` عندما تريد القناة أن يشرح رد مسار التعطيل مقابض الإعدادات الدقيقة اللازمة لتمكين موافقات exec الأصلية. ويتلقى هذا المدخل `{ channel, channelLabel, accountId }`؛ ويجب على القنوات ذات الحسابات المسماة أن تعرض مسارات ضمن نطاق الحساب مثل `channels.<channel>.accounts.<id>.execApprovals.*` بدلًا من الإعدادات الافتراضية في المستوى الأعلى.
- إذا كانت القناة تستطيع استنتاج هويات DM مستقرة شبيهة بالمالك من الإعدادات الموجودة، فاستخدم `createResolvedApproverActionAuthAdapter` من `openclaw/plugin-sdk/approval-runtime` لتقييد `/approve` داخل الدردشة نفسها من دون إضافة منطق في core خاص بالموافقات.
- إذا كانت القناة تحتاج إلى تسليم موافقة أصلية، فأبقِ شيفرة القناة مركزة على تطبيع الهدف وحقائق النقل/العرض. واستخدم `createChannelExecApprovalProfile` و`createChannelNativeOriginTargetResolver` و`createChannelApproverDmTargetResolver` و`createApproverRestrictedNativeApprovalCapability` من `openclaw/plugin-sdk/approval-runtime`. وضع الحقائق الخاصة بالقناة خلف `approvalCapability.nativeRuntime`، ويفضَّل عبر `createChannelApprovalNativeRuntimeAdapter(...)` أو `createLazyChannelApprovalNativeRuntimeAdapter(...)`، حتى يتمكن core من تجميع المعالج وامتلاك تصفية الطلبات والتوجيه وإزالة التكرار وانتهاء الصلاحية واشتراك gateway وإشعارات "تم التوجيه إلى مكان آخر". وينقسم `nativeRuntime` إلى عدة مداخل أصغر:
- `availability` — ما إذا كان الحساب مكوّنًا وما إذا كان يجب التعامل مع الطلب
- `presentation` — ربط نموذج العرض المشترك للموافقة بحمولات أصلية معلّقة/محسومة/منتهية أو بإجراءات نهائية
- `transport` — إعداد الأهداف بالإضافة إلى إرسال/تحديث/حذف رسائل الموافقة الأصلية
- `interactions` — مداخل اختيارية لربط/فك/مسح الإجراءات للأزرار أو التفاعلات الأصلية
- `observe` — مداخل اختيارية لتشخيصات التسليم
- إذا كانت القناة تحتاج إلى كائنات مملوكة لوقت التشغيل مثل عميل أو رمز أو تطبيق Bolt أو مستقبِل webhook، فسجّلها عبر `openclaw/plugin-sdk/channel-runtime-context`. يتيح سجل runtime-context العام لـ core تهيئة المعالجات المعتمدة على الإمكانات من حالة بدء القناة من دون إضافة طبقة ربط خاصة بالموافقات.
- لا تلجأ إلى `createChannelApprovalHandler` أو `createChannelNativeApprovalRuntime` ذوي المستوى الأدنى إلا عندما لا يكون المدخل المعتمد على الإمكانات قادرًا على التعبير عما تحتاجه بعد.
- يجب على القنوات الأصلية للموافقات توجيه كلٍّ من `accountId` و`approvalKind` عبر هذه المساعدات. إذ يبقي `accountId` سياسة الموافقات متعددة الحسابات ضمن نطاق حساب البوت الصحيح، بينما يبقي `approvalKind` سلوك موافقة exec مقابل موافقة plugin متاحًا للقناة من دون تفرعات ثابتة في core.
- يتولى core الآن أيضًا إشعارات إعادة توجيه الموافقات. لذلك يجب ألا ترسل plugins القنوات رسائل متابعة خاصة بها من نوع "تم إرسال الموافقة إلى الرسائل الخاصة / قناة أخرى" من `createChannelNativeApprovalRuntime`؛ بل عرّض بدلًا من ذلك توجيهًا دقيقًا للأصل + DM الخاص بالموافِق عبر مساعدات إمكانات الموافقة المشتركة ودَع core يجمع عمليات التسليم الفعلية قبل نشر أي إشعار مرة أخرى إلى الدردشة التي بدأت الطلب.
- حافظ على نوع معرّف الموافقة المُسلَّم من البداية إلى النهاية. يجب ألا تقوم العملاء الأصلية
  بتخمين أو إعادة كتابة توجيه موافقة exec مقابل موافقة plugin استنادًا إلى حالة محلية في القناة.
- يمكن عمدًا لأنواع الموافقات المختلفة أن تعرض أسطحًا أصلية مختلفة.
  من الأمثلة المضمّنة الحالية:
  - يحتفظ Slack بإتاحة توجيه الموافقات الأصلية لكل من معرّفات exec وplugin.
  - يحتفظ Matrix بنفس توجيه DM/القناة الأصلي وتجربة التفاعل عبر reactions لموافقات exec
    وplugin، مع الاستمرار في السماح باختلاف المصادقة حسب نوع الموافقة.
- لا يزال `createApproverRestrictedNativeApprovalAdapter` موجودًا كغلاف توافق، لكن الشيفرة الجديدة يجب أن تفضّل منشئ الإمكانات وتعرض `approvalCapability` على plugin.

بالنسبة إلى نقاط دخول القنوات الساخنة، فضّل المسارات الفرعية الأضيق لوقت التشغيل عندما تحتاج فقط
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

وبالمثل، فضّل `openclaw/plugin-sdk/setup-runtime`،
و`openclaw/plugin-sdk/setup-adapter-runtime`،
و`openclaw/plugin-sdk/reply-runtime`،
و`openclaw/plugin-sdk/reply-dispatch-runtime`،
و`openclaw/plugin-sdk/reply-reference`، و
`openclaw/plugin-sdk/reply-chunking` عندما لا تحتاج إلى السطح
الأوسع.

وبالنسبة إلى الإعداد تحديدًا:

- يغطي `openclaw/plugin-sdk/setup-runtime` مساعدات الإعداد الآمنة لوقت التشغيل:
  مهايئات ترقيع الإعدادات الآمنة للاستيراد (`createPatchedAccountSetupAdapter`,
  و`createEnvPatchedAccountSetupAdapter`,
  و`createSetupInputPresenceValidator`)، ومخرجات
  ملاحظات البحث، و`promptResolvedAllowFrom`، و`splitSetupEntries`، وبُناة
  setup-proxy المُفوَّضة
- يمثل `openclaw/plugin-sdk/setup-adapter-runtime` المدخل الضيق
  الواعي بالبيئة لـ `createEnvPatchedAccountSetupAdapter`
- يغطي `openclaw/plugin-sdk/channel-setup` بُناة الإعداد ذات التثبيت الاختياري بالإضافة إلى بعض العناصر الأولية الآمنة للإعداد:
  `createOptionalChannelSetupSurface` و`createOptionalChannelSetupAdapter`،

إذا كانت قناتك تدعم الإعداد أو المصادقة المدفوعين بالبيئة ويجب أن تعرف تدفقات البدء/الإعدادات العامة
أسماء متغيرات البيئة هذه قبل تحميل وقت التشغيل، فأعلن عنها في
manifest الخاص بـ plugin ضمن `channelEnvVars`. وأبقِ `envVars` الخاصة بوقت تشغيل القناة أو الثوابت المحلية
للنص الموجّه للمشغّل فقط.
`createOptionalChannelSetupWizard`، و`DEFAULT_ACCOUNT_ID`،
و`createTopLevelChannelDmPolicy`، و`setSetupChannelEnabled`، و
`splitSetupEntries`

- استخدم المدخل الأوسع `openclaw/plugin-sdk/setup` فقط عندما تحتاج أيضًا إلى
  مساعدات الإعداد/التهيئة المشتركة الأثقل مثل
  `moveSingleAccountChannelSectionToDefaultAccount(...)`

إذا كانت قناتك تريد فقط الإعلان عن "ثبّت هذا plugin أولًا" في أسطح الإعداد،
ففضّل `createOptionalChannelSetupSurface(...)`. إذ يفشل المهايئ/المعالج المولَّدان
في مسارات كتابة الإعدادات والإنهاء بشكل مغلق، ويعيدان استخدام الرسالة نفسها
المطلوبة للتثبيت عبر التحقق والإنهاء ونص رابط الوثائق.

وبالنسبة إلى المسارات الساخنة الأخرى في القنوات، فضّل المساعدات الضيقة بدلًا من الأسطح القديمة الأوسع:

- `openclaw/plugin-sdk/account-core`،
  و`openclaw/plugin-sdk/account-id`،
  و`openclaw/plugin-sdk/account-resolution`، و
  `openclaw/plugin-sdk/account-helpers` لإعدادات الحسابات المتعددة
  والرجوع إلى الحساب الافتراضي
- `openclaw/plugin-sdk/inbound-envelope` و
  `openclaw/plugin-sdk/inbound-reply-dispatch` لمسار/غلاف الوارد
  وربط التسجيل والإرسال
- `openclaw/plugin-sdk/messaging-targets` لتحليل/مطابقة الأهداف
- `openclaw/plugin-sdk/outbound-media` و
  `openclaw/plugin-sdk/outbound-runtime` لتحميل الوسائط بالإضافة إلى
  مفوّضي الهوية/الإرسال الصادر
- `openclaw/plugin-sdk/thread-bindings-runtime` لدورة حياة ربط السلاسل
  وتسجيل المهايئات
- `openclaw/plugin-sdk/agent-media-payload` فقط عندما يظل هناك حاجة إلى
  تخطيط حقول حمولة agent/media قديم
- `openclaw/plugin-sdk/telegram-command-config` لتطبيع الأوامر المخصصة في Telegram،
  والتحقق من التكرار/التعارض، وعقد إعدادات الأوامر
  المستقر احتياطيًا

يمكن للقنوات الخاصة بالمصادقة فقط عادةً الاكتفاء بالمسار الافتراضي: يتولى core الموافقات، ويعرض plugin فقط إمكانات الصادر/المصادقة. أما قنوات الموافقات الأصلية مثل Matrix وSlack وTelegram ووسائط الدردشة المخصصة، فيجب أن تستخدم المساعدات الأصلية المشتركة بدلًا من بناء دورة حياة الموافقة الخاصة بها.

## سياسة الإشارة في الوارد

أبقِ التعامل مع الإشارات الواردة مقسّمًا إلى طبقتين:

- جمع الأدلة المملوك لـ plugin
- تقييم السياسة المشتركة

استخدم `openclaw/plugin-sdk/channel-inbound` للطبقة المشتركة.

ما يناسب المنطق المحلي في plugin:

- اكتشاف الرد على البوت
- اكتشاف الاقتباس من البوت
- فحوصات المشاركة في السلاسل
- استثناءات رسائل الخدمة/النظام
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

يكشف `api.runtime.channel.mentions` عن مساعدات الإشارة المشتركة نفسها
لـ plugins القنوات المضمّنة التي تعتمد أصلًا على حقن وقت التشغيل:

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

تظل مساعدات `resolveMentionGating*` الأقدم موجودة على
`openclaw/plugin-sdk/channel-inbound` كتصديرات توافق فقط. ويجب أن تستخدم الشيفرة الجديدة
`resolveInboundMentionDecision({ facts, policy })`.

## شرح عملي

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="الحزمة وmanifest">
    أنشئ ملفات plugin القياسية. الحقل `channel` في `package.json` هو
    ما يجعل هذا plugin قناة. وللاطلاع على السطح الكامل لبيانات تعريف الحزمة،
    راجع [إعداد plugin وتهيئته](/ar/plugins/sdk-setup#openclaw-channel):

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

  <Step title="بناء كائن plugin القناة">
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

    <Accordion title="ما الذي يفعله `createChatChannelPlugin` من أجلك">
      بدلًا من تنفيذ واجهات المهايئات منخفضة المستوى يدويًا، فإنك تمرر
      خيارات تعريفية ويتولى المنشئ تركيبها:

      | الخيار | ما الذي يربطه |
      | --- | --- |
      | `security.dm` | محلل أمان DM ضمن النطاق من حقول الإعدادات |
      | `pairing.text` | تدفق اقتران DM قائم على النص مع تبادل الرمز |
      | `threading` | محلل وضع reply-to (ثابت، أو ضمن نطاق الحساب، أو مخصص) |
      | `outbound.attachedResults` | دوال إرسال تُرجع بيانات تعريف النتيجة (معرّفات الرسائل) |

      يمكنك أيضًا تمرير كائنات مهايئات خام بدلًا من الخيارات التعريفية
      إذا كنت تحتاج إلى تحكم كامل.
    </Accordion>

  </Step>

  <Step title="ربط نقطة الإدخال">
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
    من عرضها في تعليمات الجذر من دون تفعيل وقت تشغيل القناة الكامل،
    بينما تستمر عمليات التحميل الكاملة العادية في التقاط الواصفات نفسها لتسجيل الأوامر
    الفعلي. وأبقِ `registerFull(...)` للأعمال الخاصة بوقت التشغيل فقط.
    وإذا كان `registerFull(...)` يسجل أساليب Gateway RPC، فاستخدم
    بادئة خاصة بـ plugin. تظل نطاقات الإدارة المحجوزة في core (`config.*`,
    و`exec.approvals.*`، و`wizard.*`، و`update.*`) محجوزة وتُحل دائمًا
    إلى `operator.admin`.
    يتولى `defineChannelPluginEntry` فصل أوضاع التسجيل تلقائيًا. راجع
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

    يحمّل OpenClaw هذا بدلًا من الإدخال الكامل عندما تكون القناة معطلة
    أو غير مكوّنة. وهذا يتجنب سحب شيفرة وقت تشغيل ثقيلة أثناء تدفقات الإعداد.
    راجع [الإعداد والتهيئة](/ar/plugins/sdk-setup#setup-entry) لمزيد من التفاصيل.

  </Step>

  <Step title="معالجة الرسائل الواردة">
    يحتاج plugin الخاص بك إلى استقبال الرسائل من المنصة وتمريرها إلى
    OpenClaw. والنمط المعتاد هو webhook يتحقق من الطلب
    ويرسله عبر معالج الوارد الخاص بقناتك:

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
      معالجة الرسائل الواردة خاصة بكل قناة. فكل plugin قناة يملك
      مسار الوارد الخاص به. انظر إلى plugins القنوات المضمّنة
      (مثل حزمة plugin الخاصة بـ Microsoft Teams أو Google Chat) للاطلاع على أنماط فعلية.
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="الاختبار">
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

    للاطلاع على مساعدات الاختبار المشتركة، راجع [الاختبار](/ar/plugins/sdk-testing).

  </Step>
</Steps>

## بنية الملفات

```
<bundled-plugin-root>/acme-chat/
├── package.json              # بيانات تعريف openclaw.channel
├── openclaw.plugin.json      # Manifest مع مخطط الإعدادات
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
    أوضاع reply ثابتة أو ضمن نطاق الحساب أو مخصصة
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
لا تزال بعض المداخل المساعدة المضمّنة موجودة لصيانة plugins المضمّنة
ولأغراض التوافق. لكنها ليست النمط الموصى به لـ plugins القنوات الجديدة؛
فضّل المسارات الفرعية العامة channel/setup/reply/runtime من
سطح SDK المشترك ما لم تكن تصون تلك العائلة من plugins المضمّنة مباشرة.
</Note>

## الخطوات التالية

- [plugins المزوّد](/ar/plugins/sdk-provider-plugins) — إذا كان plugin الخاص بك يوفّر أيضًا نماذج
- [نظرة عامة على SDK](/ar/plugins/sdk-overview) — المرجع الكامل لاستيراد المسارات الفرعية
- [اختبار SDK](/ar/plugins/sdk-testing) — أدوات الاختبار واختبارات العقود
- [Manifest الخاص بـ plugin](/ar/plugins/manifest) — المخطط الكامل لـ manifest

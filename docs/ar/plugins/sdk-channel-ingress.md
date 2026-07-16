---
read_when:
    - إنشاء Plugin لقناة مراسلة أو ترحيله
    - تغيير قوائم السماح للرسائل المباشرة أو المجموعات، أو بوابات التوجيه، أو مصادقة الأوامر، أو مصادقة الأحداث، أو التفعيل عبر الإشارة
    - مراجعة تنقيح البيانات الواردة عبر القنوات أو حدود التوافق مع SDK
sidebarTitle: Channel Ingress
summary: واجهة API تجريبية لاستقبال القنوات من أجل تفويض الرسائل الواردة
title: واجهة برمجة تطبيقات استقبال القناة
x-i18n:
    generated_at: "2026-07-16T14:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3339af82a5dc3572d581f13960286f8b9ac933e7f491e8c4e0daba093caccc73
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

دخول القنوات هو حد تجريبي للتحكم في الوصول إلى أحداث القنوات الواردة.
تمتلك Plugins حقائق المنصة والآثار الجانبية؛ بينما تمتلك النواة
السياسة العامة: قوائم السماح للرسائل المباشرة/المجموعات، وإدخالات الرسائل المباشرة في مخزن الاقتران، وبوابات المسارات،
وبوابات الأوامر، وتخويل الأحداث، والتفعيل عند الإشارة، والتشخيصات المنقّحة، و
القبول.

استخدم `openclaw/plugin-sdk/channel-ingress-runtime` لمسارات الاستقبال.

## محلّل وقت التشغيل

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

لا تحسب مسبقًا قوائم السماح الفعلية أو مالكي الأوامر أو مجموعات الأوامر.
يشتقها المحلّل من قوائم السماح الأولية، واستدعاءات المخزن، وواصفات المسارات،
ومجموعات الوصول، والسياسة، ونوع المحادثة.

## النتيجة

ينبغي أن تستهلك Plugins المضمّنة الإسقاطات الحديثة مباشرةً:

| الحقل              | المعنى                                                            |
| ------------------ | ------------------------------------------------------------------ |
| `ingress`          | قرار البوابات المرتّب والقبول                                |
| `senderAccess`     | تخويل المرسل/المحادثة فقط                             |
| `routeAccess`      | إسقاط المسار ومرسل المسار                                  |
| `commandAccess`    | تخويل الأوامر؛ `requested: false` عند عدم تشغيل بوابة أوامر |
| `activationAccess` | نتيجة الإشارة/التفعيل                                          |

يظل تخويل الأحداث متاحًا في `ingress.graph` المرتّب وفي
`ingress.reasonCode` الحاسم؛ ولا يُصدر إسقاط مستقل للأحداث.

يجوز لأدوات SDK الخارجية المهملة إعادة إنشاء الأشكال الأقدم داخليًا. ينبغي ألا
تحوّل مسارات الاستقبال المضمّنة الجديدة النتائج الحديثة مجددًا إلى
كائنات DTO محلية.

## مجموعات الوصول

تظل إدخالات `accessGroup:<name>` منقّحة. تحل النواة مجموعات
`message.senders` الثابتة بنفسها، ولا تستدعي `resolveAccessGroupMembership`
إلا للمجموعات الديناميكية التي تتطلب بحثًا في المنصة. تفشل المجموعات المفقودة وغير المدعومة
والتي تعذّر حلها بصورة مغلقة.

## أوضاع الأحداث

| `authMode`       | المعنى                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | بوابات المرسل الوارد العادية                      |
| `command`        | بوابات الأوامر لعمليات رد النداء أو الأزرار محددة النطاق    |
| `origin-subject` | يجب أن يطابق الفاعل موضوع الرسالة الأصلية    |
| `route-only`     | بوابات المسارات فقط للأحداث الموثوقة محددة النطاق بالمسار |
| `none`           | تتجاوز الأحداث الداخلية المملوكة للـ Plugin التخويل المشترك  |

استخدم `mayPair: false` للتفاعلات والأزرار وعمليات رد النداء والأوامر الأصلية.

## المسارات والتفعيل

استخدم واصفات المسارات لسياسة الغرفة أو الموضوع أو الخادم أو سلسلة الرسائل أو المسارات المتداخلة:

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

استخدم `channelIngressRoutes(...)` عندما يحتوي Plugin على عدة واصفات مسارات
اختيارية؛ فهو يرشّح الفروع المعطّلة مع إبقاء حقائق المسارات عامة
ومرتبة وفق `precedence` لكل واصف.

بوابة الإشارة هي بوابة تفعيل. يؤدي غياب الإشارة إلى إرجاع
`admission: "skip"` حتى لا تعالج نواة الدور دورًا مخصصًا للمراقبة فقط.
ينبغي لمعظم القنوات وضع التفعيل بعد بوابات المرسل والأوامر. ويمكن لواجهات
المحادثة العامة التي يجب أن تكتم حركة البيانات غير المشار إليها قبل ضوضاء قائمة سماح المرسل
اختيار `activation.order: "before-sender"` عند تعطيل
تجاوز الأوامر النصية. ويمكن للقنوات ذات التفعيل الضمني، مثل الردود في سلاسل رسائل
البوت، تمرير `activation.allowedImplicitMentionKinds`؛ وعندئذ يبيّن
`activationAccess.shouldBypassMention` المسقَط متى تجاوز الأمر أو التفعيل
الضمني إشارة صريحة.

## التنقيح

قيم المرسل الأولية وإدخالات قائمة السماح الأولية هي مدخلات للمحلّل فقط. ويجب
ألا تظهر في الحالة المحلولة أو القرارات أو التشخيصات أو اللقطات أو
حقائق التوافق. استخدم معرّفات موضوعات وإدخالات ومسارات و
تشخيصات مبهمة.

## التحقق

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

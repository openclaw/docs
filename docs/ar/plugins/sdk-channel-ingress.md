---
read_when:
    - إنشاء Plugin لقناة مراسلة أو ترحيله
    - تغيير قوائم السماح للرسائل المباشرة أو المجموعات، أو بوابات التوجيه، أو مصادقة الأوامر، أو مصادقة الأحداث، أو التفعيل بالإشارة
    - مراجعة تنقيح البيانات الواردة عبر القنوات أو حدود توافق SDK
sidebarTitle: Channel Ingress
summary: واجهة برمجة تطبيقات تجريبية لاستقبال رسائل القنوات وتخويل الرسائل الواردة
title: واجهة برمجة تطبيقات استقبال القنوات
x-i18n:
    generated_at: "2026-07-12T06:23:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9e7b7d16bb0d53cec824cb353f691a2e17b37ca648eaefe6c0cbbdcd68a4c155
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

يُعدّ دخول القناة حدّ التحكم التجريبي في الوصول لأحداث القناة الواردة.
تتولى Plugins حقائق المنصة وآثارها الجانبية؛ بينما تتولى النواة السياسة
العامة: قوائم السماح للرسائل المباشرة/المجموعات، وإدخالات الرسائل المباشرة
في مخزن الاقتران، وبوابات المسارات، وبوابات الأوامر، وتخويل الأحداث، والتفعيل
عند الإشارة، والتشخيصات المنقّحة، والقبول.

استخدم `openclaw/plugin-sdk/channel-ingress-runtime` لمسارات الاستقبال الجديدة.
ويظل المسار الفرعي الأقدم `openclaw/plugin-sdk/channel-ingress` مُصدَّرًا
كواجهة توافق متقادمة لـ Plugins التابعة لجهات خارجية.

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

لا تحسب مسبقًا قوائم السماح الفعالة أو مالكي الأوامر أو مجموعات الأوامر.
يستنتجها المحلّل من قوائم السماح الأولية، واستدعاءات المخزن، وواصفات المسارات،
ومجموعات الوصول، والسياسة، ونوع المحادثة.

## النتيجة

ينبغي أن تستهلك Plugins المضمّنة الإسقاطات الحديثة مباشرةً:

| الحقل              | المعنى                                                               |
| ------------------ | -------------------------------------------------------------------- |
| `ingress`          | قرار البوابات المرتّب والقبول                                        |
| `senderAccess`     | تخويل المرسِل/المحادثة فقط                                           |
| `routeAccess`      | إسقاط المسار ومرسِل المسار                                           |
| `commandAccess`    | تخويل الأمر؛ `requested: false` عند عدم تشغيل أي بوابة أوامر          |
| `activationAccess` | نتيجة الإشارة/التفعيل                                                |

يظل تخويل الحدث متاحًا في `ingress.graph` المرتّب وفي
`ingress.reasonCode` الحاسم؛ ولا يُصدر إسقاط منفصل للحدث.

يجوز لمساعدات SDK المتقادمة التابعة لجهات خارجية إعادة إنشاء الأشكال الأقدم
داخليًا. وينبغي ألا تحوّل مسارات الاستقبال المضمّنة الجديدة النتائج الحديثة
مرة أخرى إلى كائنات DTO محلية.

## مجموعات الوصول

تظل إدخالات `accessGroup:<name>` منقّحة. تحلّ النواة مجموعات
`message.senders` الثابتة بنفسها، ولا تستدعي `resolveAccessGroupMembership`
إلا للمجموعات الديناميكية التي تتطلب بحثًا في المنصة. وتُرفض المجموعات
المفقودة وغير المدعومة والتي فشل حلّها رفضًا آمنًا.

## أوضاع الأحداث

| `authMode`       | المعنى                                                        |
| ---------------- | ------------------------------------------------------------- |
| `inbound`        | بوابات المرسِل الوارد العادية                                 |
| `command`        | بوابات الأوامر للاستدعاءات الراجعة أو الأزرار محددة النطاق    |
| `origin-subject` | يجب أن يطابق الفاعل موضوع الرسالة الأصلية                     |
| `route-only`     | بوابات المسارات فقط للأحداث الموثوقة محددة النطاق بالمسار     |
| `none`           | تتجاوز الأحداث الداخلية المملوكة للـ Plugin التخويل المشترك   |

استخدم `mayPair: false` للتفاعلات والأزرار والاستدعاءات الراجعة والأوامر
الأصلية.

## المسارات والتفعيل

استخدم واصفات المسارات لسياسة الغرفة أو الموضوع أو النقابة أو سلسلة الرسائل
أو المسار المتداخل:

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
اختيارية؛ إذ يرشّح الفروع المعطّلة مع إبقاء حقائق المسارات عامة ومرتّبة وفق
`precedence` لكل واصف.

بوابة الإشارة هي بوابة تفعيل. يؤدي عدم وجود إشارة مطلوبة إلى إرجاع
`admission: "skip"`، كي لا تعالج نواة الدور تفاعلًا مخصصًا للمراقبة فقط.
ينبغي لمعظم القنوات إبقاء التفعيل بعد بوابات المرسِل والأوامر. ويمكن لواجهات
الدردشة العامة التي يجب أن تكتم حركة المرور غير المتضمنة لإشارة قبل ضوضاء
قائمة سماح المرسِلين اختيار `activation.order: "before-sender"` عندما يكون
تجاوز الأوامر النصية معطّلًا. ويمكن للقنوات ذات التفعيل الضمني، مثل الردود
في سلاسل رسائل الروبوت، تمرير `activation.allowedImplicitMentionKinds`؛
وعندئذ يوضّح `activationAccess.shouldBypassMention` المُسقَط متى تجاوز أمر
أو تفعيل ضمني اشتراط الإشارة الصريحة.

## التنقيح

قيم المرسِل الأولية وإدخالات قوائم السماح الأولية هي مدخلات للمحلّل فقط.
ويجب ألا تظهر في الحالة المحلولة أو القرارات أو التشخيصات أو اللقطات أو
حقائق التوافق. استخدم معرّفات مبهمة للموضوعات والإدخالات والمسارات
والتشخيصات.

## التحقق

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

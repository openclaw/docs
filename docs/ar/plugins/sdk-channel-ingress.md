---
read_when:
    - بناء Plugin لقناة مراسلة أو ترحيله
    - تغيير قوائم السماح للرسائل المباشرة أو المجموعات، أو بوابات التوجيه، أو مصادقة الأوامر، أو مصادقة الأحداث، أو تفعيل الإشارات
    - مراجعة تنقيح الوارد عبر القنوات أو حدود توافق SDK
sidebarTitle: Channel Ingress
summary: واجهة برمجة تطبيقات تجريبية لدخول القنوات لتخويل الرسائل الواردة
title: واجهة برمجة تطبيقات وارد القنوات
x-i18n:
    generated_at: "2026-05-10T19:52:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f32b9b2e91a2d8cf5a8f2706d071e8daebb3954de4913646aaaaeae4c7141d
    source_path: plugins/sdk-channel-ingress.md
    workflow: 16
---

# واجهة API لإدخال القناة

إدخال القناة هو حدّ التحكم في الوصول التجريبي لأحداث القناة الواردة. استخدم `openclaw/plugin-sdk/channel-ingress-runtime` لمسارات الاستقبال.
يبقى المسار الفرعي الأقدم `openclaw/plugin-sdk/channel-ingress` مصدّرًا كواجهة توافق مهملة لـ third-party plugins.

تمتلك Plugins حقائق المنصة والآثار الجانبية. يمتلك Core السياسة العامة: قوائم السماح للرسائل المباشرة/المجموعات، وإدخالات الرسائل المباشرة في مخزن الاقتران، وبوابات المسارات، وبوابات الأوامر، ومصادقة الأحداث، وتنشيط الإشارات، والتشخيصات المنقّحة، والقبول.

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

لا تحسب مسبقًا قوائم السماح الفعّالة أو مالكي الأوامر أو مجموعات الأوامر. يشتقها المحلّل من قوائم السماح الخام، واستدعاءات المخزن، وواصفات المسارات، ومجموعات الوصول، والسياسة، ونوع المحادثة.

## النتيجة

ينبغي أن تستهلك Plugins المضمّنة الإسقاطات الحديثة مباشرةً:

- `ingress`: قرار البوابة المرتّب والقبول
- `senderAccess`: تفويض المرسل/المحادثة فقط
- `routeAccess`: إسقاط المسار ومرسل المسار
- `commandAccess`: تفويض الأمر؛ تكون false عندما لا تعمل أي بوابة أوامر
- `activationAccess`: نتيجة الإشارة/التنشيط

تظل مصادقة الأحداث متاحة على `ingress.graph` المرتّب و`ingress.reasonCode` الحاسم؛ ولا يصدر إسقاط أحداث منفصل.

قد تعيد مساعدات SDK المهملة الخاصة بـ third-party plugins بناء الأشكال الأقدم داخليًا. لا ينبغي لمسارات الاستقبال المضمّنة الجديدة أن تترجم النتائج الحديثة مرة أخرى إلى DTOs محلية.

## مجموعات الوصول

تبقى إدخالات `accessGroup:<name>` منقّحة. يحل Core مجموعات `message.senders` الثابتة بنفسه ويستدعي `resolveAccessGroupMembership` فقط للمجموعات الديناميكية التي تتطلب بحثًا في المنصة. المجموعات المفقودة أو غير المدعومة أو الفاشلة تفشل وهي مغلقة.

## أوضاع الأحداث

| `authMode`       | المعنى                                          |
| ---------------- | ------------------------------------------------ |
| `inbound`        | بوابات المرسل الوارد العادية                      |
| `command`        | بوابات الأوامر للاستدعاءات أو الأزرار محددة النطاق    |
| `origin-subject` | يجب أن يطابق الفاعل موضوع الرسالة الأصلي    |
| `route-only`     | بوابات المسارات فقط للأحداث الموثوقة محددة المسار |
| `none`           | تتجاوز الأحداث الداخلية المملوكة للـ plugin المصادقة المشتركة  |

استخدم `mayPair: false` للتفاعلات، والأزرار، والاستدعاءات، والأوامر الأصلية.

## المسارات والتنشيط

استخدم واصفات المسارات لسياسة الغرفة أو الموضوع أو النقابة أو سلسلة النقاش أو المسار المتداخل:

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

استخدم `channelIngressRoutes(...)` عندما يكون لدى plugin عدة واصفات مسارات اختيارية؛ فهو يرشّح الفروع المعطلة مع إبقاء حقائق المسارات عامة ومرتّبة حسب `precedence` لكل واصف.

بوابة الإشارة هي بوابة تنشيط. يؤدي عدم مطابقة الإشارة إلى إرجاع `admission: "skip"` بحيث لا يعالج turn kernel دورة مخصصة للمراقبة فقط.
ينبغي لمعظم القنوات أن تترك التنشيط بعد بوابات المرسل والأوامر. يمكن لأسطح الدردشة العامة التي يجب أن تهدّئ حركة المرور غير المشار إليها قبل ضجيج قائمة سماح المرسلين أن تختار `activation.order: "before-sender"` عندما يكون تجاوز الأوامر النصية معطّلًا. يمكن للقنوات ذات التنشيط الضمني، مثل الردود في سلاسل bot، أن تمرّر `activation.allowedImplicitMentionKinds`؛ وعندها يبلّغ الإسقاط `activationAccess.shouldBypassMention` عندما يتجاوز الأمر أو التنشيط الضمني إشارة صريحة.

## التنقيح

قيم المرسل الخام وإدخالات قائمة السماح الخام هي مدخلات للمحلّل فقط. يجب ألا تظهر في الحالة المحلولة أو القرارات أو التشخيصات أو اللقطات أو حقائق التوافق. استخدم معرّفات مواضيع مبهمة، ومعرّفات إدخالات، ومعرّفات مسارات، ومعرّفات تشخيصية.

## التحقق

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```

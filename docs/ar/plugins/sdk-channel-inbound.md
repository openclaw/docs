---
read_when:
    - أنت تبني أو تعيد هيكلة مسار استقبال Plugin قناة مراسلة
    - تحتاج إلى إنشاء سياق وارد مشترك، أو تسجيل الجلسات، أو إرسال الردود المُعدّة
    - أنت ترحّل مساعدات دورات القنوات القديمة إلى واجهات برمجة تطبيقات الوارد/الرسائل
summary: 'مساعدات الأحداث الواردة لـ Plugins القنوات: بناء السياق، وتنسيق المشغّل المشترك، وسجل الجلسة، وإرسال الردود المُعدّة'
title: واجهة API الواردة للقناة
x-i18n:
    generated_at: "2026-06-27T18:17:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d3ffb04438412a3e92b976c34ce31c36cc790967503df35fc435f67637f45bf4
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

ينبغي أن تمثل Plugins القنوات مسارات الاستقبال باستخدام أسماء inbound وmessage:

```text
platform event -> inbound facts/context -> agent reply -> message delivery
```

استخدم `openclaw/plugin-sdk/channel-inbound` لتطبيع أحداث inbound،
والتنسيق، والجذور، والتنسيق التشغيلي. استخدم
`openclaw/plugin-sdk/channel-outbound` لسلوك الإرسال
الأصلي، والإيصال، والتسليم الدائم، والمعاينة المباشرة.

## المساعدات الأساسية

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: إسقاط حقائق القناة المطبعة في
  سياق الموجه/الجلسة. استخدم `channelContext` لتمرير بيانات تعريف
  المرسل/الدردشة المملوكة للقناة إلى hook الـ Plugin `ctx.channelContext`؛ ووسّع
  `PluginHookChannelSenderContext` أو `PluginHookChannelChatContext` من هذا
  المسار الفرعي للحقول الخاصة بالقناة.
- `runChannelInboundEvent(...)`: تشغيل الإدخال، والتصنيف، والتحقق المسبق، والحل،
  والتسجيل، والإرسال، والإنهاء لحدث منصة inbound واحد.
- `dispatchChannelInboundReply(...)`: تسجيل وإرسال رد inbound مجمّع مسبقًا
  باستخدام محول تسليم.

يعرض runtime الـ Plugin المحقون المساعدات عالية المستوى نفسها ضمن
`runtime.channel.inbound.*` للقنوات المضمنة/الأصلية التي تتلقى كائن
runtime بالفعل.

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

ينبغي أن تجمع مرسلات التوافق مدخلات `dispatchChannelInboundReply(...)`
وتُبقي تسليم المنصة داخل محول التسليم. ينبغي أن تفضّل مسارات الإرسال الجديدة
محولات الرسائل ومساعدات الرسائل الدائمة.

## الترحيل

أزيلت أسماء runtime المستعارة القديمة `runtime.channel.turn.*`. استخدم:

- `runtime.channel.inbound.run(...)` لأحداث inbound الخام.
- `runtime.channel.inbound.dispatchReply(...)` لسياقات الردود المجمّعة.
- `runtime.channel.inbound.buildContext(...)` لحمولات سياق inbound.
- `runtime.channel.inbound.runPreparedReply(...)` فقط لمسارات الإرسال المجهزة
  المملوكة للقناة التي تجمع مسبقًا closure الإرسال الخاص بها.

ينبغي ألا يقدم كود Plugin الجديد واجهات API للقنوات مسماة باسم `turn`. أبقِ مفردات
model أو turn الخاصة بالوكيل داخل كود الوكيل/الموفر؛ تستخدم Plugins القنوات مصطلحات inbound،
والرسالة، والتسليم، والرد.

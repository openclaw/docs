---
read_when:
    - أنت تبني أو تعيد هيكلة مسار استقبال في Plugin لقناة مراسلة
    - تحتاج إلى إنشاء سياق وارد مشترك، أو تسجيل الجلسة، أو إرسال رد مُجهّز
    - أنت ترحّل الأدوات المساعدة القديمة لأدوار القنوات إلى واجهات برمجة تطبيقات الوارد/الرسائل
summary: 'أدوات مساعدة للأحداث الواردة الخاصة بملحقات القنوات: بناء السياق، وتنسيق المُشغِّل المشترك، وسجل الجلسة، وإرسال الرد المُعَدّ مسبقًا'
title: واجهة API الواردة للقناة
x-i18n:
    generated_at: "2026-07-12T06:17:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

تتبع مسارات استقبال القنوات تدفقًا واحدًا:

```text
حدث المنصة -> حقائق/سياق وارد -> رد الوكيل -> تسليم الرسالة
```

استخدم `openclaw/plugin-sdk/channel-inbound` لتسوية الأحداث الواردة وتنسيقها وجذورها وتنسيق عملياتها. واستخدم
`openclaw/plugin-sdk/channel-outbound` للإرسال الأصلي وإيصال الاستلام والتسليم الدائم وسلوك المعاينة المباشرة.

## المساعدات الأساسية

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: يُسقط حقائق القناة بعد تسويتها
  في سياق المطالبة/الجلسة. مرّر البيانات الوصفية للمرسل/المحادثة التي تملكها القناة
  عبر `channelContext`، والتي تراها خطافات Plugin على هيئة `ctx.channelContext`.
  وسّع `PluginHookChannelSenderContext` أو `PluginHookChannelChatContext`
  من هذا المسار الفرعي لإضافة الحقول الخاصة بالقناة.
- `runChannelInboundEvent(...)`: يشغّل الاستيعاب والتصنيف والفحص المسبق والحل
  والتسجيل والإرسال والإنهاء لحدث وارد واحد من المنصة.
- `dispatchChannelInboundReply(...)`: يسجّل ردًا واردًا جرى تجميعه مسبقًا
  ويرسله باستخدام مهايئ تسليم.

يمكن للقنوات المضمّنة/الأصلية التي تستقبل بالفعل كائن وقت تشغيل Plugin المحقون
استدعاء المساعدات نفسها عبر `runtime.channel.inbound.*` بدلًا من
استيراد هذا المسار الفرعي مباشرةً:

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

جمّع مدخلات `dispatchChannelInboundReply(...)` لمرسلات التوافق
التي تُبقي تسليم المنصة داخل مهايئ التسليم. ينبغي لمسارات الإرسال الجديدة
استخدام مهايئات الرسائل ومساعدات الرسائل الدائمة من
`channel-outbound` بدلًا من ذلك.

## الترحيل

أُزيلت الأسماء المستعارة لوقت التشغيل `runtime.channel.turn.*`. استخدم:

- `runtime.channel.inbound.run(...)` للأحداث الواردة الخام.
- `runtime.channel.inbound.dispatchReply(...)` لسياقات الردود المجمّعة.
- `runtime.channel.inbound.buildContext(...)` لحمولات السياق الوارد.
- `runtime.channel.inbound.runPreparedReply(...)`، وهي مهملة، فقط لمسارات
  الإرسال المُعَدّة التي تملكها القناة وتُجمّع بالفعل دالة الإرسال الخاصة بها.

ينبغي ألا تُدخل شيفرة Plugin الجديدة واجهات API للقنوات تحمل اسم `turn`. أبقِ مفردات دور النموذج أو
الوكيل داخل شيفرة الوكيل/المزوّد؛ وتستخدم Plugins القنوات مصطلحات الوارد
والرسالة والتسليم والرد.

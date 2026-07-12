---
read_when:
    - تحتاج إلى نظرة عامة على بنية الشبكة والأمان
    - أنت تعمل على تصحيح أخطاء الوصول المحلي مقارنةً بالوصول عبر شبكة tailnet أو الاقتران
    - تريد القائمة المرجعية لوثائق الشبكات
summary: 'مركز الشبكة: واجهات Gateway، والاقتران، والاكتشاف، والأمان'
title: الشبكة
x-i18n:
    generated_at: "2026-07-12T06:11:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

يربط هذا المحور الوثائق الأساسية التي تشرح كيفية اتصال OpenClaw بالأجهزة وإقرانها وتأمينها عبر المضيف المحلي والشبكة المحلية وشبكة Tailscale.

## النموذج الأساسي

تتدفق معظم العمليات عبر Gateway (`openclaw gateway`)، وهي عملية واحدة طويلة التشغيل تدير اتصالات القنوات ومستوى تحكم WebSocket.

- **local loopback أولًا**: يستخدم WebSocket الخاص بـ Gateway العنوان `ws://127.0.0.1:18789` افتراضيًا.
  ترفض عمليات الربط خارج local loopback البدء من دون مسار مصادقة صالح لـ Gateway:
  مصادقة برمز مميز ذي سر مشترك أو بكلمة مرور، أو نشر `trusted-proxy`
  خارج local loopback ومهيأ تهيئة صحيحة.
- **يوصى بتشغيل Gateway واحدة لكل مضيف**. لتحقيق العزل، شغّل عدة مثيلات من Gateway باستخدام ملفات تعريف ومنافذ معزولة ([مثيلات Gateway المتعددة](/ar/gateway/multiple-gateways)).
- **مضيف Canvas** متاح عبر منفذ Gateway نفسه (`/__openclaw__/canvas/`، و`/__openclaw__/a2ui/`)، وتحميه مصادقة Gateway عند ربطه بعنوان يتجاوز local loopback.
- **الوصول عن بُعد** يكون عادةً عبر نفق SSH أو شبكة Tailscale الافتراضية الخاصة ([الوصول عن بُعد](/ar/gateway/remote)).

المراجع الرئيسية:

- [بنية Gateway](/ar/concepts/architecture)
- [بروتوكول Gateway](/ar/gateway/protocol)
- [دليل تشغيل Gateway](/ar/gateway)
- [واجهات الويب وأوضاع الربط](/ar/web)

## الإقران والهوية

- [نظرة عامة على الإقران (الرسائل المباشرة وعُقد Node)](/ar/channels/pairing)
- [إقران عُقد Node الذي تديره Gateway](/ar/gateway/pairing)
- [CLI للأجهزة (الإقران وتدوير الرموز المميزة)](/ar/cli/devices)
- [CLI للإقران (الموافقات عبر الرسائل المباشرة)](/ar/cli/pairing)

الثقة المحلية:

- يمكن اعتماد اتصالات local loopback المحلية المباشرة (من دون ترويسات إعادة توجيه أو وكيل) تلقائيًا للإقران، للحفاظ على سلاسة تجربة الاستخدام على المضيف نفسه.
- يتضمن OpenClaw أيضًا مسارًا محدودًا للاتصال الذاتي المحلي من الواجهة الخلفية أو الحاوية، مخصصًا لتدفقات الأدوات المساعدة الموثوقة التي تستخدم سرًا مشتركًا.
- يظل عملاء شبكة Tailscale والشبكة المحلية، بما في ذلك عمليات ربط شبكة Tailscale على المضيف نفسه، بحاجة إلى موافقة صريحة على الإقران.

## الاكتشاف ووسائل النقل

- [الاكتشاف ووسائل النقل](/ar/gateway/discovery)
- [Bonjour وmDNS](/ar/gateway/bonjour)
- [الوصول عن بُعد (SSH)](/ar/gateway/remote)
- [Tailscale](/ar/gateway/tailscale)

## عُقد Node ووسائل النقل

- [نظرة عامة على عُقد Node](/ar/nodes)
- [بروتوكول الجسر (عُقد Node القديمة، تاريخي)](/ar/gateway/bridge-protocol)
- [دليل تشغيل عُقدة Node: iOS](/ar/platforms/ios)
- [دليل تشغيل عُقدة Node: Android](/ar/platforms/android)

## الأمان

- [نظرة عامة على الأمان](/ar/gateway/security)
- [مرجع إعدادات Gateway](/ar/gateway/configuration)
- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [أداة التشخيص](/ar/gateway/doctor)

## ذو صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [الوصول عن بُعد](/ar/gateway/remote)

---
read_when:
    - تحتاج إلى نظرة عامة على بنية الشبكة + الأمان
    - أنت تستكشف أخطاء الوصول المحلي مقابل الوصول عبر شبكة tailnet أو الاقتران وإصلاحها
    - تريد القائمة المعتمدة لوثائق الشبكات
summary: 'محور الشبكة: واجهات Gateway، والاقتران، والاكتشاف، والأمان'
title: الشبكة
x-i18n:
    generated_at: "2026-05-06T08:02:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

يربط هذا المركز الوثائق الأساسية لكيفية اتصال OpenClaw بالأجهزة وإقرانها وتأمينها
عبر المضيف المحلي، وLAN، وشبكة tailnet.

## النموذج الأساسي

تمر معظم العمليات عبر Gateway (`openclaw gateway`)، وهي عملية واحدة طويلة التشغيل تمتلك اتصالات القنوات ومستوى التحكم WebSocket.

- **Loopback أولاً**: القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`.
  تتطلب الارتباطات خارج loopback مسار مصادقة Gateway صالحاً: مصادقة
  الرمز/كلمة المرور بسر مشترك، أو نشر `trusted-proxy`
  خارج loopback مهيأ بشكل صحيح.
- يوصى باستخدام **Gateway واحد لكل مضيف**. للعزل، شغّل عدة بوابات بملفات تعريف ومنافذ معزولة ([بوابات متعددة](/ar/gateway/multiple-gateways)).
- يتم تقديم **مضيف Canvas** على المنفذ نفسه مثل Gateway (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`)، ومحمي بمصادقة Gateway عند ربطه بما يتجاوز loopback.
- يكون **الوصول البعيد** عادةً عبر نفق SSH أو Tailscale VPN ([الوصول البعيد](/ar/gateway/remote)).

المراجع الرئيسية:

- [بنية Gateway](/ar/concepts/architecture)
- [بروتوكول Gateway](/ar/gateway/protocol)
- [دليل تشغيل Gateway](/ar/gateway)
- [أسطح الويب + أوضاع الربط](/ar/web)

## الإقران + الهوية

- [نظرة عامة على الإقران (رسائل مباشرة + عُقد)](/ar/channels/pairing)
- [إقران العُقد المملوك لـ Gateway](/ar/gateway/pairing)
- [CLI الأجهزة (الإقران + تدوير الرموز)](/ar/cli/devices)
- [CLI الإقران (موافقات الرسائل المباشرة)](/ar/cli/pairing)

الثقة المحلية:

- يمكن اعتماد اتصالات local loopback المباشرة تلقائياً للإقران للحفاظ على
  سلاسة تجربة المستخدم على المضيف نفسه.
- لدى OpenClaw أيضاً مسار ضيق للاتصال الذاتي المحلي داخل الخلفية/الحاوية
  لتدفقات المساعد الموثوقة ذات السر المشترك.
- لا يزال عملاء tailnet وLAN، بما في ذلك ارتباطات tailnet على المضيف نفسه، يتطلبون
  موافقة إقران صريحة.

## الاكتشاف + وسائل النقل

- [الاكتشاف ووسائل النقل](/ar/gateway/discovery)
- [Bonjour / mDNS](/ar/gateway/bonjour)
- [الوصول البعيد (SSH)](/ar/gateway/remote)
- [Tailscale](/ar/gateway/tailscale)

## العُقد + وسائل النقل

- [نظرة عامة على العُقد](/ar/nodes)
- [بروتوكول الجسر (العُقد القديمة، تاريخي)](/ar/gateway/bridge-protocol)
- [دليل تشغيل العُقد: iOS](/ar/platforms/ios)
- [دليل تشغيل العُقد: Android](/ar/platforms/android)

## الأمان

- [نظرة عامة على الأمان](/ar/gateway/security)
- [مرجع إعدادات Gateway](/ar/gateway/configuration)
- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [Doctor](/ar/gateway/doctor)

## ذات صلة

- [دليل تشغيل Gateway](/ar/gateway)
- [الوصول البعيد](/ar/gateway/remote)

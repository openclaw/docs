---
read_when:
    - تحتاج إلى نظرة عامة على بنية الشبكة + الأمان
    - أنت تقوم بتصحيح الوصول المحلي مقابل tailnet أو الاقتران
    - تريد القائمة المرجعية لوثائق الشبكات الرسمية
summary: 'مركز الشبكة: أسطح Gateway، والاقتران، والاكتشاف، والأمان'
title: الشبكة
x-i18n:
    generated_at: "2026-04-24T07:50:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 663f372555f044146a5d381566371e9a38185e7f295243bfd61314f12e3a4f06
    source_path: network.md
    workflow: 15
---

# مركز الشبكة

يربط هذا المركز المستندات الأساسية الخاصة بكيفية اتصال OpenClaw، واقترانه، وتأمينه
للأجهزة عبر localhost، وLAN، وtailnet.

## النموذج الأساسي

تتدفق معظم العمليات عبر Gateway ‏(`openclaw gateway`)، وهي عملية واحدة طويلة التشغيل تمتلك اتصالات القنوات وcontrol plane الخاص بـ WebSocket.

- **أولًا loopback**: تكون القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`.
  وتتطلب عمليات الربط خارج loopback مسار مصادقة صالحًا لـ gateway: مصادقة
  الرمز/كلمة المرور بالسر المشترك، أو نشر `trusted-proxy`
  مضبوطًا بشكل صحيح خارج loopback.
- يوصى باستخدام **Gateway واحدة لكل مضيف**. ومن أجل العزل، شغّل عدة Gateways مع ملفات تعريف ومنافذ معزولة ([Gateways متعددة](/ar/gateway/multiple-gateways)).
- يتم تقديم **مضيف Canvas** على المنفذ نفسه الخاص بـ Gateway ‏(`/__openclaw__/canvas/` و`/__openclaw__/a2ui/`) ويُحمى بواسطة مصادقة Gateway عند الربط خارج loopback.
- يكون **الوصول البعيد** عادةً عبر نفق SSH أو Tailscale VPN ‏([الوصول البعيد](/ar/gateway/remote)).

المراجع الأساسية:

- [بنية Gateway](/ar/concepts/architecture)
- [بروتوكول Gateway](/ar/gateway/protocol)
- [دليل تشغيل Gateway](/ar/gateway)
- [أسطح الويب + أوضاع الربط](/ar/web)

## الاقتران + الهوية

- [نظرة عامة على الاقتران (الرسائل المباشرة + Nodes)](/ar/channels/pairing)
- [اقتران Node المملوك لـ Gateway](/ar/gateway/pairing)
- [CLI الخاص بالأجهزة (الاقتران + تدوير الرموز)](/ar/cli/devices)
- [CLI الخاص بالاقتران (موافقات الرسائل المباشرة)](/ar/cli/pairing)

الثقة المحلية:

- يمكن الموافقة تلقائيًا على اتصالات loopback المحلية المباشرة من أجل الاقتران للحفاظ على سلاسة تجربة الاستخدام على المضيف نفسه.
- يمتلك OpenClaw أيضًا مسار self-connect ضيقًا محليًا للواجهة الخلفية/الحاوية من أجل تدفقات helper الموثوقة ذات السر المشترك.
- لا تزال عملاء tailnet وLAN، بما في ذلك ارتباطات tailnet على المضيف نفسه، تتطلب موافقة اقتران صريحة.

## الاكتشاف + وسائل النقل

- [الاكتشاف ووسائل النقل](/ar/gateway/discovery)
- [Bonjour / mDNS](/ar/gateway/bonjour)
- [الوصول البعيد (SSH)](/ar/gateway/remote)
- [Tailscale](/ar/gateway/tailscale)

## Nodes + وسائل النقل

- [نظرة عامة على Nodes](/ar/nodes)
- [بروتوكول Bridge ‏(Nodes القديمة، تاريخي)](/ar/gateway/bridge-protocol)
- [دليل تشغيل Node: iOS](/ar/platforms/ios)
- [دليل تشغيل Node: Android](/ar/platforms/android)

## الأمان

- [نظرة عامة على الأمان](/ar/gateway/security)
- [مرجع إعدادات Gateway](/ar/gateway/configuration)
- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting)
- [Doctor](/ar/gateway/doctor)

## ذو صلة

- [نموذج شبكة Gateway](/ar/gateway/network-model)
- [الوصول البعيد](/ar/gateway/remote)

---
read_when:
    - تريد عرضًا موجزًا لنموذج شبكة Gateway
summary: كيفية اتصال Gateway وNodes ومضيف canvas.
title: نموذج الشبكة
x-i18n:
    generated_at: "2026-04-24T07:42:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68637b72c4b3a6110556909da9a454e4be480fe2f3b42b09d054949c1104a62c
    source_path: gateway/network-model.md
    workflow: 15
---

> تم دمج هذا المحتوى في [الشبكة](/ar/network#core-model). راجع تلك الصفحة للحصول على الدليل الحالي.

تتدفق معظم العمليات عبر Gateway ‏(`openclaw gateway`)، وهي عملية واحدة طويلة التشغيل
تمتلك اتصالات القنوات وcontrol plane الخاص بـ WebSocket.

## القواعد الأساسية

- يوصى باستخدام Gateway واحد لكل مضيف. وهي العملية الوحيدة المسموح لها بامتلاك جلسة WhatsApp Web. وبالنسبة إلى روبوتات الإنقاذ أو العزل الصارم، شغّل عدة Gateways مع ملفات تعريف ومنافذ معزولة. راجع [Gateways متعددة](/ar/gateway/multiple-gateways).
- أولًا loopback: تكون القيمة الافتراضية لـ Gateway WS هي `ws://127.0.0.1:18789`. وينشئ المعالج مصادقة بالسر المشترك افتراضيًا وعادةً ما يولّد رمزًا، حتى مع loopback. أما للوصول غير loopback، فاستخدم مسار مصادقة صالحًا لـ gateway: مصادقة الرمز/كلمة المرور بالسر المشترك، أو نشر `trusted-proxy` مضبوطًا بشكل صحيح خارج loopback. وعادةً ما تعمل إعدادات tailnet/mobile بشكل أفضل عبر Tailscale Serve أو نقطة نهاية `wss://` أخرى بدلًا من `ws://` الخام على tailnet.
- تتصل Nodes بـ Gateway WS عبر LAN أو tailnet أو SSH حسب الحاجة. وقد
  تمت إزالة جسر TCP القديم.
- يتم تقديم مضيف Canvas بواسطة خادم HTTP الخاص بـ Gateway على **المنفذ نفسه** الخاص بـ Gateway (الافتراضي `18789`):
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    عند إعداد `gateway.auth` وربط Gateway خارج loopback، تتم حماية هذه المسارات بواسطة مصادقة Gateway. وتستخدم عملاء Node عناوين URL بقدرات على مستوى node مرتبطة بجلسة WS النشطة الخاصة بها. راجع [إعدادات Gateway](/ar/gateway/configuration) ‏(`canvasHost` و`gateway`).
- يكون الاستخدام البعيد عادةً عبر نفق SSH أو VPN على tailnet. راجع [الوصول البعيد](/ar/gateway/remote) و[الاكتشاف](/ar/gateway/discovery).

## ذو صلة

- [الوصول البعيد](/ar/gateway/remote)
- [مصادقة trusted proxy](/ar/gateway/trusted-proxy-auth)
- [بروتوكول Gateway](/ar/gateway/protocol)

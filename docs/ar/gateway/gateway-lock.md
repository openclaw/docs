---
read_when:
    - تشغيل عملية gateway أو تصحيح أخطائها
    - التحقيق في فرض مثيل واحد فقط
summary: حارس مثيل Gateway الوحيد باستخدام ربط مستمع WebSocket
title: قفل Gateway
x-i18n:
    generated_at: "2026-04-24T07:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f52405d1891470592cb2f9328421dc910c15f4fdc4d34d57c1fec8b322c753f
    source_path: gateway/gateway-lock.md
    workflow: 15
---

## لماذا

- ضمان تشغيل مثيل Gateway واحد فقط لكل منفذ أساسي على المضيف نفسه؛ ويجب أن تستخدم Gateways الإضافية profiles معزولة ومنافذ فريدة.
- النجاة من الأعطال/SIGKILL من دون ترك ملفات قفل قديمة.
- الفشل السريع مع خطأ واضح عندما يكون منفذ التحكم مشغولًا بالفعل.

## الآلية

- يربط gateway مستمع WebSocket ‏(الافتراضي `ws://127.0.0.1:18789`) فورًا عند البدء باستخدام مستمع TCP حصري.
- إذا فشل الربط مع `EADDRINUSE`، فإن البدء يطلق `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- يقوم نظام التشغيل بتحرير المستمع تلقائيًا عند أي خروج للعملية، بما في ذلك الأعطال وSIGKILL — ولا حاجة إلى ملف قفل منفصل أو خطوة تنظيف.
- عند الإيقاف، تغلق gateway خادم WebSocket وخادم HTTP الأساسي لتحرير المنفذ بسرعة.

## سطح الخطأ

- إذا كانت عملية أخرى تمسك بالمنفذ، فإن البدء يطلق `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`.
- تظهر إخفاقات الربط الأخرى على شكل `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`.

## ملاحظات تشغيلية

- إذا كان المنفذ مشغولًا بواسطة عملية _أخرى_، فسيكون الخطأ نفسه؛ حرر المنفذ أو اختر منفذًا آخر باستخدام `openclaw gateway --port <port>`.
- لا يزال تطبيق macOS يحتفظ بحارس PID خفيف خاص به قبل إنشاء gateway؛ لكن قفل وقت التشغيل يُفرض عبر ربط WebSocket.

## ذو صلة

- [Gateways متعددة](/ar/gateway/multiple-gateways) — تشغيل عدة مثيلات بمنافذ فريدة
- [استكشاف الأخطاء وإصلاحها](/ar/gateway/troubleshooting) — تشخيص `EADDRINUSE` وتعارضات المنافذ

---
read_when:
    - تصحيح أخطاء WebChat أو تهيئة الوصول إليها
summary: مضيف WebChat الثابت عبر loopback واستخدام Gateway WS لواجهة الدردشة
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:43:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

الحالة: تتحدث واجهة الدردشة SwiftUI على macOS/iOS مباشرةً مع Gateway WebSocket.

## ما هي

- واجهة دردشة أصلية للـ gateway (من دون متصفح مضمّن ومن دون خادم ثابت محلي).
- تستخدم الجلسات نفسها وقواعد التوجيه نفسها التي تستخدمها القنوات الأخرى.
- توجيه حتمي: تعود الردود دائمًا إلى WebChat.

## البدء السريع

1. ابدأ gateway.
2. افتح واجهة WebChat ‏(تطبيق macOS/iOS) أو تبويب الدردشة في Control UI.
3. تأكد من تهيئة مسار مصادقة صالح للـ gateway (السر المشترك افتراضيًا،
   حتى على loopback).

## كيف تعمل (السلوك)

- تتصل الواجهة بـ Gateway WebSocket وتستخدم `chat.history` و`chat.send` و`chat.inject`.
- تكون `chat.history` محدودة من أجل الاستقرار: قد تقوم Gateway باقتطاع الحقول النصية الطويلة، وحذف البيانات الوصفية الثقيلة، واستبدال الإدخالات كبيرة الحجم بالقيمة `[chat.history omitted: message too large]`.
- كما أن `chat.history` تُطبَّع للعرض: إذ تتم إزالة سياق OpenClaw المخصص لوقت التشغيل فقط،
  وأغلفة الرسائل الواردة، وعلامات توجيهات التسليم المضمنة
  مثل `[[reply_to_*]]` و`[[audio_as_voice]]`، وحمولات XML الخاصة باستدعاءات الأدوات كنص عادي
  (بما في ذلك `<tool_call>...</tool_call>`،
  و`<function_call>...</function_call>`،
  و`<tool_calls>...</tool_calls>`،
  و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)، و
  tokens التحكم الخاصة بالـ model المسرّبة بصيغ ASCII/العرض الكامل من النص المرئي،
  كما تُحذف إدخالات المساعد التي يكون كامل نصها المرئي هو فقط
  token الصامت الدقيقة `NO_REPLY` / `no_reply`.
- تُستبعد حمولات الرد المعلَّمة على أنها استدلال (`isReasoning: true`) من محتوى المساعد في WebChat، ونص إعادة تشغيل transcript، وكتل المحتوى الصوتي، حتى لا تظهر الحمولات الخاصة بالتفكير فقط كرسائل مساعدة مرئية أو كصوت قابل للتشغيل.
- يضيف `chat.inject` ملاحظة من المساعد مباشرةً إلى transcript ويبثها إلى الواجهة (من دون تشغيل وكيل).
- يمكن للتشغيلات المُجهضة أن تُبقي خرجًا جزئيًا من المساعد مرئيًا في الواجهة.
- تحتفظ Gateway بالنص الجزئي للمساعد الناتج عن التشغيلات المُجهضة داخل transcript history عندما يكون هناك خرج مخزَّن مؤقتًا، وتضع علامة على تلك الإدخالات ببيانات وصفية تخص الإجهاض.
- يتم دائمًا جلب السجل من gateway (من دون مراقبة ملفات محلية).
- إذا كانت gateway غير قابلة للوصول، تصبح WebChat للقراءة فقط.

## لوحة أدوات الوكلاء في Control UI

- تحتوي لوحة Tools في `/agents` داخل Control UI على عرضين منفصلين:
  - **المتاح الآن** يستخدم `tools.effective(sessionKey=...)` ويعرض ما الذي يمكن
    للجلسة الحالية استخدامه فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugins، والأدوات المملوكة للقنوات.
  - **تهيئة الأدوات** تستخدم `tools.catalog` وتظل مركزة على الملفات التعريفية، والتجاوزات،
    ودلالات الفهرس.
- إن التوفر في وقت التشغيل مرتبط بنطاق الجلسة. ويمكن لتبديل الجلسات على الوكيل نفسه أن يغير
  قائمة **المتاح الآن**.
- لا يعني محرر الإعدادات توفر الأداة في وقت التشغيل؛ إذ يظل الوصول الفعلي خاضعًا
  لأولوية السياسة (`allow`/`deny`، والتجاوزات لكل وكيل ولكل provider/قناة).

## الاستخدام البعيد

- يمرّر الوضع البعيد Gateway WebSocket عبر SSH/Tailscale.
- لا تحتاج إلى تشغيل خادم WebChat منفصل.

## مرجع الإعدادات (WebChat)

الإعدادات الكاملة: [الإعدادات](/ar/gateway/configuration)

خيارات WebChat:

- `gateway.webchat.chatHistoryMaxChars`: الحد الأقصى لعدد الأحرف في الحقول النصية داخل ردود `chat.history`. وعندما يتجاوز إدخال transcript هذا الحد، تقوم Gateway باقتطاع الحقول النصية الطويلة وقد تستبدل الرسائل كبيرة الحجم بعنصر نائب. كما يمكن للعميل إرسال `maxChars` لكل طلب لتجاوز هذا الافتراضي في استدعاء `chat.history` واحد.

خيارات عامة ذات صلة:

- `gateway.port`، `gateway.bind`: مضيف/منفذ WebSocket.
- `gateway.auth.mode`، `gateway.auth.token`، `gateway.auth.password`:
  مصادقة WebSocket بالسر المشترك.
- `gateway.auth.allowTailscale`: يمكن لتبويب الدردشة في Control UI داخل المتصفح استخدام
  ترويسات هوية Tailscale Serve عند التفعيل.
- `gateway.auth.mode: "trusted-proxy"`: مصادقة reverse-proxy لعملاء المتصفح خلف مصدر **غير loopback** وواعٍ بالهوية (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)).
- `gateway.remote.url`، `gateway.remote.token`، `gateway.remote.password`: هدف gateway البعيد.
- `session.*`: تخزين الجلسة وإعدادات المفتاح الرئيسي الافتراضية.

## ذو صلة

- [Control UI](/ar/web/control-ui)
- [Dashboard](/ar/web/dashboard)

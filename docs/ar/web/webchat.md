---
read_when:
    - تصحيح أو تكوين الوصول إلى WebChat
summary: الاستضافة الثابتة لـ WebChat على loopback واستخدام Gateway WS لواجهة الدردشة
title: WebChat
x-i18n:
    generated_at: "2026-04-24T08:12:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

الحالة: تتحدث واجهة الدردشة SwiftUI على macOS/iOS مباشرةً مع Gateway WebSocket.

## ما هي

- واجهة دردشة أصلية لـ gateway ‏(من دون متصفح مضمّن ومن دون خادم ثابت محلي).
- تستخدم الجلسات نفسها وقواعد التوجيه نفسها مثل القنوات الأخرى.
- توجيه حتمي: تعود الردود دائمًا إلى WebChat.

## البدء السريع

1. ابدأ gateway.
2. افتح واجهة WebChat ‏(تطبيق macOS/iOS) أو علامة تبويب الدردشة في Control UI.
3. تأكد من تكوين مسار مصادقة صالح لـ gateway ‏(المفتاح السري المشترك افتراضيًا،
   حتى على loopback).

## كيف يعمل (السلوك)

- تتصل الواجهة بـ Gateway WebSocket وتستخدم `chat.history` و`chat.send` و`chat.inject`.
- يكون `chat.history` محدودًا من أجل الاستقرار: قد يقوم Gateway باختصار حقول النص الطويلة، وحذف البيانات الوصفية الثقيلة، واستبدال الإدخالات كبيرة الحجم بـ `[chat.history omitted: message too large]`.
- كما أن `chat.history` مُطبَّع للعرض: إذ تُزال من النص المرئي وسوم تعليمات التسليم المضمنة
  مثل `[[reply_to_*]]` و`[[audio_as_voice]]`، وحمولات XML النصية العادية لاستدعاء الأدوات
  (بما في ذلك `<tool_call>...</tool_call>`،
  و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
  و`<function_calls>...</function_calls>`، وكتل استدعاء الأدوات المبتورة)، وكذلك
  رموز التحكم المسرّبة من النموذج بصيغ ASCII/العرض الكامل، كما تُحذف إدخالات المساعد
  التي يكون نصها المرئي بالكامل هو الرمز الصامت المطابق تمامًا
  `NO_REPLY` / `no_reply`.
- يضيف `chat.inject` ملاحظة مساعد مباشرةً إلى النص التفريغي ويبثها إلى الواجهة (من دون تشغيل وكيل).
- يمكن أن تبقي التشغيلات المجهضة خرج المساعد الجزئي مرئيًا في الواجهة.
- يحفظ Gateway نص المساعد الجزئي المجهض في سجل النص التفريغي عندما يوجد خرج مخزن مؤقتًا، ويضع على هذه الإدخالات بيانات تعريف خاصة بالإجهاض.
- يتم دائمًا جلب السجل من gateway ‏(من دون مراقبة ملفات محلية).
- إذا تعذر الوصول إلى gateway، يكون WebChat للقراءة فقط.

## لوحة أدوات الوكلاء في Control UI

- تحتوي لوحة الأدوات Tools ضمن `/agents` في Control UI على عرضين منفصلين:
  - يستخدم **Available Right Now** القيمة `tools.effective(sessionKey=...)` ويعرض ما يمكن
    للجلسة الحالية استخدامه فعليًا وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugin، والأدوات المملوكة للقنوات.
  - يستخدم **Tool Configuration** القيمة `tools.catalog` ويبقى مركّزًا على الملفات الشخصية، والتجاوزات،
    ودلالات الفهرس.
- يكون توفر Runtime على مستوى الجلسة. وقد يؤدي تبديل الجلسات على الوكيل نفسه إلى تغيير قائمة
  **Available Right Now**.
- لا يعني محرر التكوين توفرًا وقت التشغيل؛ إذ يظل الوصول الفعلي خاضعًا لتسلسل أولوية السياسة
  (`allow`/`deny`، والتجاوزات لكل وكيل ولكل مزوّد/قناة).

## الاستخدام البعيد

- يقوم الوضع البعيد بتمرير Gateway WebSocket عبر SSH/Tailscale.
- لا تحتاج إلى تشغيل خادم WebChat منفصل.

## مرجع التكوين (WebChat)

التكوين الكامل: [التكوين](/ar/gateway/configuration)

خيارات WebChat:

- `gateway.webchat.chatHistoryMaxChars`: الحد الأقصى لعدد الأحرف في حقول النص ضمن استجابات `chat.history`. وعندما يتجاوز إدخال في النص التفريغي هذا الحد، يقوم Gateway باختصار حقول النص الطويلة وقد يستبدل الرسائل كبيرة الحجم بعنصر نائب. ويمكن للعميل أيضًا إرسال `maxChars` لكل طلب لتجاوز هذا الافتراضي في استدعاء واحد لـ `chat.history`.

الخيارات العامة ذات الصلة:

- `gateway.port` و`gateway.bind`: المضيف/المنفذ الخاصان بـ WebSocket.
- `gateway.auth.mode` و`gateway.auth.token` و`gateway.auth.password`:
  مصادقة WebSocket بالمفتاح السري المشترك.
- `gateway.auth.allowTailscale`: يمكن لعلامة تبويب الدردشة الخاصة بـ Control UI في المتصفح استخدام
  رؤوس هوية Tailscale Serve عند تفعيلها.
- `gateway.auth.mode: "trusted-proxy"`: مصادقة reverse-proxy لعملاء المتصفح خلف مصدر **غير loopback** يدرك الهوية (راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth)).
- `gateway.remote.url` و`gateway.remote.token` و`gateway.remote.password`: هدف gateway البعيد.
- `session.*`: تخزين الجلسات وافتراضيات المفتاح الرئيسي.

## ذو صلة

- [Control UI](/ar/web/control-ui)
- [Dashboard](/ar/web/dashboard)

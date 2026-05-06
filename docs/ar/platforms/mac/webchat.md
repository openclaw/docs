---
read_when:
    - تصحيح أخطاء عرض WebChat على mac أو منفذ الاسترجاع
summary: كيف يضمّن تطبيق Mac ‏WebChat الخاص بـ Gateway وكيفية تصحيح أخطائه
title: الدردشة عبر الويب (macOS)
x-i18n:
    generated_at: "2026-05-06T08:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

يُضمّن تطبيق شريط قوائم macOS واجهة WebChat كعرض SwiftUI أصلي. يتصل بـ Gateway ويستخدم **الجلسة الرئيسية** افتراضيًا للوكيل المحدد (مع مبدّل جلسات للجلسات الأخرى).

- **الوضع المحلي**: يتصل مباشرةً بـ WebSocket المحلي لـ Gateway.
- **الوضع البعيد**: يمرّر منفذ تحكم Gateway عبر SSH ويستخدم ذلك النفق كمستوى بيانات.

## التشغيل وتصحيح الأخطاء

- يدويًا: قائمة Lobster ← "فتح الدردشة".
- الفتح التلقائي للاختبار:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- السجلات: `./scripts/clawlog.sh` (النظام الفرعي `ai.openclaw`، الفئة `WebChatSwiftUI`).

## كيفية توصيله

- مستوى البيانات: طرائق Gateway WS وهي `chat.history`، و`chat.send`، و`chat.abort`،
  و`chat.inject` والأحداث `chat`، و`agent`، و`presence`، و`tick`، و`health`.
- يعيد `chat.history` صفوف سجل محادثة مطبّعة للعرض: تُزال وسوم التوجيه المضمنة
  من النص المرئي، وتُزال حمولات XML ذات النص العادي لاستدعاءات الأدوات
  (بما في ذلك `<tool_call>...</tool_call>`،
  و`<function_call>...</function_call>`، و`<tool_calls>...</tool_calls>`،
  و`<function_calls>...</function_calls>`، وكتل استدعاءات الأدوات المقتطعة)،
  كما تُزال رموز التحكم المسرّبة الخاصة بالنموذج بصيغة ASCII/العرض الكامل، وتُحذف
  صفوف المساعد التي تحتوي على رموز صامتة فقط مثل `NO_REPLY` / `no_reply` المطابقة
  تمامًا، ويمكن استبدال الصفوف كبيرة الحجم بعناصر نائبة.
- الجلسة: تستخدم الجلسة الأساسية افتراضيًا (`main`، أو `global` عندما يكون النطاق
  عامًا). يمكن لواجهة المستخدم التبديل بين الجلسات.
- يستخدم الإعداد الأولي جلسة مخصصة لإبقاء إعداد التشغيل الأول منفصلًا.

## سطح الأمان

- يمرّر الوضع البعيد منفذ تحكم WebSocket الخاص بـ Gateway فقط عبر SSH.

## القيود المعروفة

- واجهة المستخدم محسّنة لجلسات الدردشة (وليست صندوق رمل كاملًا للمتصفح).

## ذات صلة

- [WebChat](/ar/web/webchat)
- [تطبيق macOS](/ar/platforms/macos)

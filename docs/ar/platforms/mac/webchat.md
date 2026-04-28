---
read_when:
    - تصحيح عرض WebChat على Mac أو منفذ loopback
summary: كيف يضمّن تطبيق Mac واجهة WebChat الخاصة بـ gateway وكيفية تصحيح أخطائها
title: WebChat (macOS)
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:52:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: c3e291a4b2a28e1016a9187f952b18ca4ea70660aa081564eeb27637cd8e8ae2
    source_path: platforms/mac/webchat.md
    workflow: 15
---

يضمّن تطبيق شريط القائمة على macOS واجهة WebChat كعرض SwiftUI أصلي. وهو
يتصل بـ Gateway ويستخدم افتراضيًا **الجلسة الرئيسية** للوكيل المحدد
(مع مبدّل جلسات للجلسات الأخرى).

- **الوضع المحلي**: يتصل مباشرة بـ Gateway WebSocket المحلية.
- **الوضع البعيد**: يمرر منفذ تحكم Gateway عبر SSH ويستخدم ذلك
  النفق كطبقة بيانات.

## التشغيل والتصحيح

- يدويًا: قائمة Lobster → "Open Chat".
- فتح تلقائي للاختبار:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- السجلات: `./scripts/clawlog.sh` ‏(subsystem ‏`ai.openclaw`، والفئة `WebChatSwiftUI`).

## كيف يتم توصيله

- طبقة البيانات: أساليب Gateway WS ‏`chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` والأحداث `chat`, `agent`, `presence`, `tick`, `health`.
- يعيد `chat.history` صفوف سجل مطبّعة للعرض: تتم إزالة وسوم التوجيه المضمنة
  من النص المرئي، كما تتم إزالة حمولات XML النصية العادية الخاصة باستدعاءات الأدوات
  (بما في ذلك `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>` وكتل استدعاء الأدوات المبتورة)
  وعناصر التحكم الخاصة بالنموذج المتسربة بصيغة ASCII/العرض الكامل، كما يتم
  حذف صفوف المساعد الصامتة البحتة مثل `NO_REPLY` / `no_reply` المطابقة
  تمامًا، ويمكن استبدال الصفوف الكبيرة جدًا بعناصر نائبة.
- الجلسة: تكون افتراضيًا هي الجلسة الأساسية (`main`، أو `global` عندما يكون النطاق
  عالميًا). ويمكن لواجهة المستخدم التبديل بين الجلسات.
- يستخدم onboarding جلسة مخصصة للحفاظ على فصل إعداد التشغيل الأول.

## السطح الأمني

- يمرر الوضع البعيد فقط منفذ تحكم Gateway WebSocket عبر SSH.

## القيود المعروفة

- تم تحسين واجهة المستخدم لجلسات الدردشة (وليست بيئة متصفح معزولة كاملة).

## ذو صلة

- [WebChat](/ar/web/webchat)
- [تطبيق macOS](/ar/platforms/macos)

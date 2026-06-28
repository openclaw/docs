---
read_when:
    - تريد إدراج حدث نظام في قائمة الانتظار دون إنشاء مهمة Cron
    - تحتاج إلى تمكين إشارات Heartbeat أو تعطيلها
    - تريد فحص إدخالات التواجد الخاصة بالنظام
summary: مرجع CLI لـ `openclaw system` (أحداث النظام، Heartbeat، الحضور)
title: النظام
x-i18n:
    generated_at: "2026-05-11T20:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

مساعدات على مستوى النظام لـ Gateway: أدرج أحداث النظام في قائمة الانتظار، وتحكم في Heartbeat،
واعرض الحضور.

تستخدم كل أوامر `system` الفرعية Gateway RPC وتقبل خيارات العميل المشتركة:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## الأوامر الشائعة

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

أدرج حدث نظام في قائمة الانتظار على الجلسة **الرئيسية** افتراضيًا. سيحقنه Heartbeat التالي
كسطر `System:` في الموجه. استخدم `--mode now` لتشغيل
Heartbeat فورًا؛ وينتظر `next-heartbeat` النبضة المجدولة التالية.

مرر `--session-key` لاستهداف جلسة محددة (مثلًا لترحيل اكتمال
مهمة غير متزامنة إلى القناة التي بدأتها).

> **استثناء التوقيت مع `--session-key`:** عند توفير `--session-key`،
> ينهار `--mode next-heartbeat` إلى إيقاظ مستهدف فوري بدلًا من
> انتظار النبضة المجدولة التالية. تستخدم الإيقاظات المستهدفة نية Heartbeat
> `immediate` بحيث تتجاوز بوابة عدم حلول الموعد في المشغل، والتي كانت ستؤجل
> بخلاف ذلك إيقاظًا بنية `event` (وتسقطه فعليًا). إذا أردت تسليمًا
> مؤجلًا، فاحذف `--session-key` ليصل الحدث إلى الجلسة الرئيسية و
> يركب Heartbeat المنتظم التالي.

الخيارات:

- `--text <text>`: نص حدث النظام المطلوب.
- `--mode <mode>`: `now` أو `next-heartbeat` (الافتراضي).
- `--session-key <sessionKey>`: اختياري؛ استهدف جلسة وكيل محددة
  بدلًا من الجلسة الرئيسية للوكيل. تعود المفاتيح التي لا تنتمي إلى
  الوكيل المحدد إلى الجلسة الرئيسية للوكيل.
- `--json`: إخراج قابل للقراءة آليًا.
- `--url`، `--token`، `--timeout`، `--expect-final`: خيارات Gateway RPC المشتركة.

## `system heartbeat last|enable|disable`

عناصر التحكم في Heartbeat:

- `last`: اعرض آخر حدث Heartbeat.
- `enable`: أعد تشغيل Heartbeat (استخدم هذا إذا كانت معطلة).
- `disable`: أوقف Heartbeat مؤقتًا.

الخيارات:

- `--json`: إخراج قابل للقراءة آليًا.
- `--url`، `--token`، `--timeout`، `--expect-final`: خيارات Gateway RPC المشتركة.

## `system presence`

اسرد إدخالات حضور النظام الحالية التي يعرفها Gateway (العقد،
والمثيلات، وأسطر الحالة المشابهة).

الخيارات:

- `--json`: إخراج قابل للقراءة آليًا.
- `--url`، `--token`، `--timeout`، `--expect-final`: خيارات Gateway RPC المشتركة.

## ملاحظات

- يتطلب Gateway قيد التشغيل ويمكن الوصول إليه عبر إعدادك الحالي (محليًا أو عن بعد).
- أحداث النظام عابرة ولا تستمر عبر عمليات إعادة التشغيل.

## ذو صلة

- [مرجع CLI](/ar/cli)

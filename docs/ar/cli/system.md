---
read_when:
    - أنت تريد وضع حدث نظام في قائمة الانتظار دون إنشاء وظيفة Cron
    - أنت تحتاج إلى تفعيل أو تعطيل Heartbeat
    - أنت تريد فحص إدخالات حضور النظام
summary: مرجع CLI لـ `openclaw system` (أحداث النظام، وHeartbeat، والحضور)
title: النظام
x-i18n:
    generated_at: "2026-04-24T07:36:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

مساعدات على مستوى النظام لـ Gateway: وضع أحداث النظام في قائمة الانتظار، والتحكم في Heartbeat،
وعرض الحضور.

تستخدم جميع الأوامر الفرعية ضمن `system` واجهة Gateway RPC وتقبل أعلام العميل المشتركة:

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

ضع حدث نظام في قائمة الانتظار على الجلسة **main**. سيقوم Heartbeat التالي بحقنه
كسطر `System:` في المطالبة. استخدم `--mode now` لتشغيل Heartbeat
فورًا؛ أما `next-heartbeat` فينتظر النبضة المجدولة التالية.

الأعلام:

- `--text <text>`: نص حدث النظام المطلوب.
- `--mode <mode>`: `now` أو `next-heartbeat` (الافتراضي).
- `--json`: خرج قابل للقراءة آليًا.
- `--url` و`--token` و`--timeout` و`--expect-final`: أعلام Gateway RPC المشتركة.

## `system heartbeat last|enable|disable`

عناصر التحكم في Heartbeat:

- `last`: عرض آخر حدث Heartbeat.
- `enable`: إعادة تشغيل Heartbeat (استخدم هذا إذا كانت معطلة).
- `disable`: إيقاف Heartbeat مؤقتًا.

الأعلام:

- `--json`: خرج قابل للقراءة آليًا.
- `--url` و`--token` و`--timeout` و`--expect-final`: أعلام Gateway RPC المشتركة.

## `system presence`

اعرض إدخالات حضور النظام الحالية التي تعرفها Gateway (العُقد،
والنسخ، وأسطر الحالة المشابهة).

الأعلام:

- `--json`: خرج قابل للقراءة آليًا.
- `--url` و`--token` و`--timeout` و`--expect-final`: أعلام Gateway RPC المشتركة.

## ملاحظات

- يتطلب Gateway قيد التشغيل ويمكن الوصول إليها عبر إعدادك الحالي (محلي أو بعيد).
- أحداث النظام مؤقتة ولا تُحفَظ عبر عمليات إعادة التشغيل.

## ذو صلة

- [مرجع CLI](/ar/cli)

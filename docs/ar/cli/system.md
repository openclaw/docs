---
read_when:
    - تريد إضافة حدث نظام إلى قائمة الانتظار دون إنشاء مهمة Cron
    - تحتاج إلى تفعيل نبضات Heartbeat أو تعطيلها
    - تريد فحص إدخالات تواجد النظام
summary: مرجع CLI للأمر `openclaw system` (أحداث النظام، Heartbeat، الحضور)
title: النظام
x-i18n:
    generated_at: "2026-07-12T05:44:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

أدوات مساعدة على مستوى النظام لـ Gateway: وضع أحداث النظام في قائمة الانتظار، والتحكم في Heartbeat، وعرض حالة الحضور.

تستخدم جميع الأوامر الفرعية لـ `system` استدعاء RPC الخاص بـ Gateway، وتقبل أعلام العميل المشتركة:

| العلم             | القيمة الافتراضية                     | الوصف                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | `gateway.remote.url` عند ضبطه        | عنوان URL لاتصال WebSocket الخاص بـ Gateway.                                                                                                                                                          |
| `--token <token>` | لا شيء                               | رمز Gateway المميز (إذا كان مطلوبًا).                                                                                                                                                                |
| `--timeout <ms>`  | `30000`                              | مهلة RPC بالمللي ثانية.                                                                                                                                                                               |
| `--expect-final`  | معطّل                                | انتظار الاستجابة النهائية (الوكيل).                                                                                                                                                                  |
| `--json`          | معطّل                                | إخراج JSON. تطبع `heartbeat last/enable/disable` و`system presence` دائمًا حمولة JSON الأولية من RPC بصرف النظر عن هذا العلم؛ ويستخدمه `system event` للتبديل بين JSON وسطر `ok` عادي. |

## الأوامر الشائعة

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

يضع حدث نظام في قائمة الانتظار ضمن الجلسة **الرئيسية** افتراضيًا. تدرجه نبضة Heartbeat التالية كسطر `System:` في الموجّه. استخدم `--mode now` لتشغيل Heartbeat فورًا؛ أما `next-heartbeat` (الافتراضي) فينتظر النبضة المجدولة التالية.

مرّر `--session-key` لاستهداف جلسة محددة، مثلًا لإعادة نتيجة اكتمال مهمة غير متزامنة إلى القناة التي بدأتها.

<Note>
**استثناء التوقيت مع `--session-key`:** عند تمرير `--session-key`، يتحول `--mode next-heartbeat` إلى إيقاظ موجّه فوري بدلًا من انتظار النبضة المجدولة التالية. تستخدم عمليات الإيقاظ الموجّهة مقصد Heartbeat بالقيمة `immediate`، لذا تتجاوز بوابة عدم حلول الموعد في المشغّل، التي كانت ستؤجل بخلاف ذلك عملية إيقاظ ذات مقصد `event` (وتسقطها فعليًا). إذا أردت التسليم المتأخر، فأغفل `--session-key` كي يصل الحدث إلى الجلسة الرئيسية وينتظر Heartbeat الدورية التالية.
</Note>

الأعلام:

- `--text <text>`: نص حدث النظام المطلوب.
- `--mode <mode>`: إما `now` أو `next-heartbeat` (الافتراضي).
- `--session-key <sessionKey>`: اختياري؛ يستهدف جلسة وكيل محددة بدلًا من الجلسة الرئيسية للوكيل. تعود المفاتيح التي لا تنتمي إلى الوكيل المحدد إلى الجلسة الرئيسية للوكيل.

## `system heartbeat last|enable|disable`

- `last`: عرض آخر حدث Heartbeat.
- `enable`: إعادة تشغيل Heartbeat (استخدمه إذا كانت معطّلة).
- `disable`: إيقاف Heartbeat مؤقتًا.

## `system presence`

يسرد إدخالات حضور النظام الحالية التي يعرفها Gateway (العُقد، والمثيلات، وأسطر الحالة المشابهة).

## ملاحظات

- يتطلب Gateway قيد التشغيل يمكن الوصول إليه عبر إعدادك الحالي (محليًا أو عن بُعد).
- أحداث النظام مؤقتة ولا تُحفظ بعد عمليات إعادة التشغيل.

## ذو صلة

- [مرجع CLI](/ar/cli)

---
read_when:
    - أنت تدير العُقد المقترنة (الكاميرات، الشاشة، لوحة الرسم)
    - تحتاج إلى الموافقة على الطلبات أو استدعاء أوامر Node
summary: مرجع CLI لـ `openclaw nodes` (الحالة، الاقتران، الاستدعاء، الكاميرا/اللوحة/الشاشة)
title: العُقَد
x-i18n:
    generated_at: "2026-05-06T17:54:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f3eb0d23037c939e4022115a2d65e0e9cb25a872daed715b8652979ce6707cf7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

إدارة العقد (الأجهزة) المقترنة واستدعاء قدرات العقد.

ذات صلة:

- نظرة عامة على العقد: [العقد](/ar/nodes)
- الكاميرا: [عقد الكاميرا](/ar/nodes/camera)
- الصور: [عقد الصور](/ar/nodes/images)

الخيارات الشائعة:

- `--url`, `--token`, `--timeout`, `--json`

## الأوامر الشائعة

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

يطبع `nodes list` جداول الطلبات المعلقة/المقترنة. تتضمن الصفوف المقترنة عمر أحدث اتصال (آخر اتصال).
استخدم `--connected` لعرض العقد المتصلة حاليًا فقط. استخدم `--last-connected <duration>` من أجل
التصفية إلى العقد التي اتصلت خلال مدة معينة (مثل `24h` و`7d`).
استخدم `nodes remove --node <id|name|ip>` لحذف سجل اقتران عقدة قديم يملكه Gateway.

ملاحظة الموافقة:

- لا يحتاج `openclaw nodes pending` إلا إلى نطاق الاقتران.
- يمكن لـ `gateway.nodes.pairing.autoApproveCidrs` تخطي خطوة الانتظار فقط عند
  اقتران جهاز `role: node` موثوق به صراحةً ولأول مرة. يكون معطلًا
  افتراضيًا ولا يوافق على الترقيات.
- يرث `openclaw nodes approve <requestId>` متطلبات النطاق الإضافية من
  الطلب المعلق:
  - طلب بلا أوامر: الاقتران فقط
  - أوامر العقدة غير التنفيذية: الاقتران + الكتابة
  - `system.run` / `system.run.prepare` / `system.which`: الاقتران + الإدارة

## الاستدعاء

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

أعلام الاستدعاء:

- `--params <json>`: سلسلة كائن JSON (الافتراضي `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء العقدة (الافتراضي `15000`).
- `--idempotency-key <key>`: مفتاح اختيارية لضمان عدم التكرار.
- يتم حظر `system.run` و`system.run.prepare` هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ الصدفة.

لتنفيذ الصدفة على عقدة، استخدم أداة `exec` مع `host=node` بدلًا من `openclaw nodes run`.
أصبح CLI الخاص بـ `nodes` يركز الآن على القدرات: RPC مباشر عبر `nodes invoke`، بالإضافة إلى الاقتران والكاميرا
والشاشة والموقع واللوحة والإشعارات.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [العقد](/ar/nodes)

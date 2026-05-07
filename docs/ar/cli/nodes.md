---
read_when:
    - أنت تدير العُقَد المقترنة (الكاميرات، الشاشة، اللوحة)
    - تحتاج إلى الموافقة على الطلبات أو استدعاء أوامر Node
summary: مرجع CLI لـ `openclaw nodes` (الحالة، الاقتران، الاستدعاء، الكاميرا/لوحة الرسم/الشاشة)
title: العُقد
x-i18n:
    generated_at: "2026-05-07T13:14:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

إدارة العُقد (الأجهزة) المقترنة واستدعاء قدرات العقدة.

ذات صلة:

- نظرة عامة على العُقد: [العُقد](/ar/nodes)
- الكاميرا: [عُقد الكاميرا](/ar/nodes/camera)
- الصور: [عُقد الصور](/ar/nodes/images)

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

يطبع `nodes list` جداول الطلبات المعلّقة/المقترنة. تتضمن الصفوف المقترنة عمر أحدث اتصال (آخر اتصال).
استخدم `--connected` لعرض العُقد المتصلة حاليًا فقط. استخدم `--last-connected <duration>` من أجل
التصفية إلى العُقد التي اتصلت ضمن مدة محددة (مثل `24h`، `7d`).
استخدم `nodes remove --node <id|name|ip>` لحذف سجل اقتران عقدة قديم مملوك لـ Gateway.

ملاحظة الموافقة:

- لا يحتاج `openclaw nodes pending` إلا إلى نطاق الاقتران.
- يمكن لـ `gateway.nodes.pairing.autoApproveCidrs` تخطي خطوة التعليق فقط لاقتران جهاز `role: node` موثوق به صراحة لأول مرة. يكون متوقفًا
  افتراضيًا ولا يوافق على الترقيات.
- يرث `openclaw nodes approve <requestId>` متطلبات نطاق إضافية من
  الطلب المعلّق:
  - طلب بلا أمر: الاقتران فقط
  - أوامر عقدة غير تنفيذية: الاقتران + الكتابة
  - `system.run` / `system.run.prepare` / `system.which`: الاقتران + الإدارة

## الاستدعاء

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

علامات الاستدعاء:

- `--params <json>`: سلسلة كائن JSON (الافتراضي `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء العقدة (الافتراضي `15000`).
- `--idempotency-key <key>`: مفتاح اختيارى لضمان عدم تكرار التنفيذ.
- يتم حظر `system.run` و`system.run.prepare` هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ أوامر الصدفة.

لتنفيذ أوامر الصدفة على عقدة، استخدم أداة `exec` مع `host=node` بدلًا من `openclaw nodes run`.
أصبح CLI الخاص بـ `nodes` يركز الآن على القدرات: RPC مباشر عبر `nodes invoke`، إلى جانب الاقتران، والكاميرا،
والشاشة، والموقع، وCanvas، والإشعارات. تُنفَّذ أوامر Canvas بواسطة Plugin التجريبي المضمن لـ Canvas؛ ويحافظ النواة على خطاف توافق بحيث تبقى ضمن `openclaw nodes canvas`.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [العُقد](/ar/nodes)

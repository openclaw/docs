---
read_when:
    - أنت تدير عُقدًا مقترنة (الكاميرات، والشاشة، واللوحة)
    - أنت بحاجة إلى الموافقة على الطلبات أو استدعاء أوامر node
summary: مرجع CLI لـ `openclaw nodes` (الحالة، والاقتران، والاستدعاء، والكاميرا/اللوحة/الشاشة)
title: العُقد
x-i18n:
    generated_at: "2026-04-24T07:35:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f1b440b3113b71338ae9cab5e1ded607dba79b9429f5c0b1b5f9e758b9f73e
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

أدِر العُقد (الأجهزة) المقترنة واستدعِ قدرات node.

ذو صلة:

- نظرة عامة على العُقد: [العُقد](/ar/nodes)
- الكاميرا: [عُقد الكاميرا](/ar/nodes/camera)
- الصور: [عُقد الصور](/ar/nodes/images)

الخيارات الشائعة:

- `--url` و`--token` و`--timeout` و`--json`

## الأوامر الشائعة

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

يطبع `nodes list` جداول الطلبات المعلقة/المقترنة. وتتضمن الصفوف المقترنة أحدث مدة منذ الاتصال (Last Connect).
استخدم `--connected` لإظهار العُقد المتصلة حاليًا فقط. واستخدم `--last-connected <duration>` من أجل
التصفية إلى العُقد التي اتصلت خلال مدة معينة (مثل `24h` أو `7d`).

ملاحظة الموافقة:

- يحتاج `openclaw nodes pending` إلى نطاق الاقتران فقط.
- يرث `openclaw nodes approve <requestId>` متطلبات نطاق إضافية من
  الطلب المعلق:
  - طلب بلا أوامر: الاقتران فقط
  - أوامر node غير التنفيذية: الاقتران + الكتابة
  - `system.run` / `system.run.prepare` / `system.which`: الاقتران + الإدارة

## الاستدعاء

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

علامات الاستدعاء:

- `--params <json>`: سلسلة كائن JSON (الافتراضي `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء node (الافتراضي `15000`).
- `--idempotency-key <key>`: مفتاح idempotency اختياري.
- يتم حظر `system.run` و`system.run.prepare` هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ shell.

لتنفيذ shell على node، استخدم أداة `exec` مع `host=node` بدلًا من `openclaw nodes run`.
أصبح CLI الخاص بـ `nodes` الآن متمحورًا حول القدرات: RPC مباشر عبر `nodes invoke`، بالإضافة إلى الاقتران، والكاميرا،
والشاشة، والموقع، واللوحة، والإشعارات.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [العُقد](/ar/nodes)

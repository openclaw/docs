---
read_when:
    - أنت تدير عُقَدًا مقترنة (كاميرات، شاشة، لوحة رسم)
    - تحتاج إلى الموافقة على الطلبات أو استدعاء أوامر node
summary: مرجع CLI لـ `openclaw nodes` (الحالة، الاقتران، الاستدعاء، الكاميرا/canvas/الشاشة)
title: العُقَد
x-i18n:
    generated_at: "2026-06-27T17:23:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e752e4a5809e01ee7970204c84d9f1008f146d8a55954f6ed5de527a6a124bc7
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

إدارة العُقد المقترنة (الأجهزة) واستدعاء قدرات العُقد.

ذات صلة:

- نظرة عامة على العُقد: [العُقد](/ar/nodes)
- الكاميرا: [عُقد الكاميرا](/ar/nodes/camera)
- الصور: [عُقد الصور](/ar/nodes/images)

الخيارات الشائعة:

- `--url`، `--token`، `--timeout`، `--json`

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
استخدم `--connected` لعرض العُقد المتصلة حاليًا فقط. استخدم `--last-connected <duration>` من أجل
التصفية إلى العُقد التي اتصلت ضمن مدة زمنية (مثل `24h`، `7d`).
استخدم `nodes remove --node <id|name|ip>` لإزالة اقتران عقدة. بالنسبة إلى
عقدة مدعومة بجهاز، يؤدي ذلك إلى إبطال دور `node` الخاص بالجهاز في `devices/paired.json`
وقطع جلساته ذات دور العقدة (يحتفظ الجهاز متعدد الأدوار بصفه ويفقد
دور `node` فقط؛ أما الجهاز ذو دور العقدة فقط فيُحذف)؛ كما يمسح أي
سجل اقتران عقدة قديم مطابق مملوك من Gateway. يستطيع `operator.pairing` إزالة
صفوف العُقد غير الخاصة بالمشغّل؛ ويحتاج مستدعي رمز الجهاز الذي يبطل دور العقدة الخاص به على
جهاز متعدد الأدوار إلى `operator.admin` أيضًا.

ملاحظة الموافقة:

- لا يحتاج `openclaw nodes pending` إلا إلى نطاق الاقتران.
- يمكن لـ `gateway.nodes.pairing.autoApproveCidrs` تخطي خطوة الانتظار فقط لأجل
  اقتران جهاز `role: node` موثوق صراحةً ولأول مرة. يكون ذلك متوقفًا
  افتراضيًا ولا يوافق على الترقيات.
- يرث `openclaw nodes approve <requestId>` متطلبات نطاق إضافية من
  الطلب المعلّق:
  - طلب بلا أوامر: الاقتران فقط
  - أوامر العُقد غير التنفيذية: الاقتران + الكتابة
  - `system.run` / `system.run.prepare` / `system.which`: الاقتران + الإدارة

## الاستدعاء

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

أعلام الاستدعاء:

- `--params <json>`: سلسلة كائن JSON (الافتراضي `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء العقدة (الافتراضي `15000`).
- `--idempotency-key <key>`: مفتاح اختيارية لضمان التكرارية الآمنة.
- `system.run` و`system.run.prepare` محظوران هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ الصدفة.

لتنفيذ الصدفة على عقدة، استخدم أداة `exec` مع `host=node` بدلًا من `openclaw nodes run`.
أصبحت CLI الخاصة بـ `nodes` تركز الآن على القدرات: RPC مباشر عبر `nodes invoke`، إضافةً إلى الاقتران والكاميرا
والشاشة والموقع وCanvas والإشعارات. تُنفّذ أوامر Canvas بواسطة Plugin Canvas التجريبي المضمّن؛ ويحتفظ النواة بخطاف توافق بحيث تبقى ضمن `openclaw nodes canvas`.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [العُقد](/ar/nodes)

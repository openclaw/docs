---
read_when:
    - أنت تدير عُقدًا مقترنة (الكاميرات، الشاشة، اللوحة)
    - تحتاج إلى الموافقة على الطلبات أو استدعاء أوامر Node
summary: مرجع CLI لـ `openclaw nodes` (الحالة، الاقتران، الاستدعاء، الكاميرا/اللوحة/الشاشة/الموقع/الإشعار)
title: العُقد
x-i18n:
    generated_at: "2026-07-16T13:38:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

إدارة العُقد المقترنة (الأجهزة) واستدعاء إمكانات العُقد.

ذات صلة: [نظرة عامة على العُقد](/ar/nodes) - [وجود الحاسوب النشط](/nodes/presence) - [عُقد الكاميرا](/ar/nodes/camera) - [عُقد الصور](/ar/nodes/images)

الخيارات الشائعة في كل أمر فرعي: `--url <url>`، و`--token <token>`، و`--timeout <ms>` (القيمة الافتراضية `10000`)، و`--json`.

## الحالة

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

يقبل كل من `status` و`list` الخيارين `--connected` (العُقد المتصلة فقط) و`--last-connected <duration>` (مثل `24h` و`7d`؛ العُقد التي اتصلت خلال المدة فقط). يعرض `list` العُقد المعلّقة والمقترنة في جدولين منفصلين، وتتضمن صفوف العُقد المقترنة المدة المنقضية منذ أحدث اتصال (Last Connect)؛ بينما يعرض `status` جدولًا موحدًا يتضمن تفاصيل الإمكانات والإصدار وآخر إدخال لكل عقدة. لا تُبلغ عقدة macOS المتصلة عن آخر إدخال إلا عند منح إذن Accessibility، ويُميَّز الصف الأحدث بالعلامة `active`؛ راجع [وجود الحاسوب النشط](/nodes/presence). يطبع `describe` إمكانات عقدة واحدة وأذوناتها ونشاطها وأوامر الاستدعاء الفعلية أو المعلّقة.

## الاقتران

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

تدير هذه الأوامر مخزن `node.pair.*` المملوك لـ Gateway، وهو منفصل عن اقتران الأجهزة (`openclaw devices approve`) الذي يتحكم في مصافحة `connect` الخاصة بـ WS للعقدة. راجع [العُقد](/ar/nodes) لمعرفة العلاقة بينهما.

- يلغي `remove` إدخال الدور المقترن للعقدة. بالنسبة إلى عقدة مدعومة بجهاز، يُلغي هذا الدور `node` في مخزن اقتران الأجهزة ويفصل جلسات دور العقدة الخاصة بها: يحتفظ الجهاز متعدد الأدوار بصفه ولا يفقد سوى الدور `node`، بينما يُحذف صف الجهاز ذي دور العقدة فقط. ويزيل أيضًا أي سجل مطابق قديم لاقتران العُقد مملوك لـ Gateway.
- لا يحتاج `pending` إلا إلى النطاق `operator.pairing`.
- يمكن لـ `gateway.nodes.pairing.autoApproveCidrs` تخطي خطوة التعليق عند اقتران جهاز `role: node` موثوق به صراحةً للمرة الأولى. يكون معطّلًا افتراضيًا، ولا يوافق على ترقيات الأدوار.
- يوافق `gateway.nodes.pairing.sshVerify` (مفعّل افتراضيًا) تلقائيًا على اقتران جهاز `role: node` للمرة الأولى عندما يستطيع Gateway التحقق من مفتاح الجهاز عبر SSH إلى مضيف العقدة؛ وتتم الموافقة على سطح الإمكانات الأول في الخطوة نفسها. راجع [اقتران العُقد](/ar/gateway/pairing#ssh-verified-device-auto-approval-default).
- تتبع متطلبات نطاق `approve` الأوامر المعلنة في الطلب المعلّق:
  - طلب بلا أوامر: `operator.pairing`
  - أوامر العُقد العادية: `operator.pairing` + `operator.write`
  - الأوامر الحساسة إداريًا (`system.run`، و`system.run.prepare`، و`system.which`، و`browser.proxy`، و`fs.listDir`، و`system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- نطاق `remove`: يستطيع `operator.pairing` إزالة صفوف العُقد غير التابعة للمشغّل؛ ويحتاج المستدعي الذي يستخدم رمز جهاز ويلغي دور عقدته على جهاز متعدد الأدوار أيضًا إلى `operator.admin`.

## الاستدعاء

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

العلامات:

- `--command <command>` (مطلوب): مثل `canvas.eval`.
- `--params <json>`: سلسلة كائن JSON (القيمة الافتراضية `{}`).
- `--invoke-timeout <ms>`: مهلة استدعاء العقدة (القيمة الافتراضية `15000`).
- `--idempotency-key <key>`: مفتاح اختياري لضمان تكرار العملية دون تغيير النتيجة.

يُحظر `system.run` و`system.run.prepare` هنا؛ استخدم أداة `exec` مع `host=node` لتنفيذ أوامر الصدفة بدلًا من ذلك. يُسمح بـ `system.which` عبر `invoke`.

## الإشعارات والدفع والموقع والشاشة

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- يرسل `notify` إشعارًا محليًا على عقدة تعلن `system.notify`، بما في ذلك عُقد macOS وiOS وAndroid وعُقد watchOS المباشرة. يتطلب التسليم المباشر إلى watchOS أن يكون OpenClaw نشطًا. يتطلب `--title` أو `--body`. الخيارات: `--sound <name>`، و`--priority <passive|active|timeSensitive>`، و`--delivery <system|overlay|auto>` (القيمة الافتراضية `system`)، و`--invoke-timeout <ms>` (القيمة الافتراضية `15000`).
- يرسل `push` دفعة اختبار APNs إلى عقدة iOS. الخيارات: `--title <text>` (القيمة الافتراضية `OpenClaw`)، و`--body <text>`، و`--environment <sandbox|production>` لتجاوز بيئة APNs المكتشفة.
- يجلب `location get` الموقع الحالي للعقدة. الخيارات: `--max-age <ms>` (إعادة استخدام تحديد موقع مخزّن مؤقتًا)، و`--accuracy <coarse|balanced|precise>`، و`--location-timeout <ms>` (القيمة الافتراضية `10000`)، و`--invoke-timeout <ms>` (القيمة الافتراضية `20000`).
- يلتقط `screen record` مقطعًا قصيرًا ويطبع المسار المحفوظ (أو يكتب JSON باستخدام `--json`). الخيارات: `--screen <index>` (القيمة الافتراضية `0`)، و`--duration <ms|10s>` (القيمة الافتراضية `10000`)، و`--fps <fps>` (القيمة الافتراضية `10`)، و`--no-audio`، و`--out <path>`، و`--invoke-timeout <ms>` (القيمة الافتراضية `120000`).

لأوامر الكاميرا وCanvas وثائقهما الخاصة: [عُقد الكاميرا](/ar/nodes/camera)، و[Canvas](/ar/platforms/mac/canvas). يُنفَّذ Canvas بواسطة Plugin Canvas التجريبي المضمّن؛ ويحتفظ النواة بـ `openclaw nodes canvas` كنقطة تركيب للتوافق.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [العُقد](/ar/nodes)

---
read_when:
    - تريد تشغيل دورة وكيل واحدة من السكربتات (مع إمكانية تسليم الرد اختياريًا)
summary: مرجع CLI لـ `openclaw agent` (إرسال دورة وكيل واحدة عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-06-27T17:19:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

تشغيل دورة وكيل عبر Gateway (استخدم `--local` للتضمين).
استخدم `--agent <id>` لاستهداف وكيل مُعدّ مباشرةً.

مرّر محدد جلسة واحدًا على الأقل:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

ذات صلة:

- أداة إرسال الوكيل: [إرسال الوكيل](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة
- `--message-file <path>`: قراءة نص الرسالة من ملف UTF-8
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-key <key>`: مفتاح جلسة صريح لاستخدامه في التوجيه
- `--session-id <id>`: معرف جلسة صريح
- `--agent <id>`: معرف الوكيل؛ يتجاوز ارتباطات التوجيه
- `--model <id>`: تجاوز النموذج لهذا التشغيل (`provider/model` أو معرف النموذج)
- `--thinking <level>`: مستوى تفكير الوكيل (`off`، `minimal`، `low`، `medium`، `high`، بالإضافة إلى المستويات المخصصة المدعومة من المزود مثل `xhigh` أو `adaptive` أو `max`)
- `--verbose <on|off>`: الاحتفاظ بمستوى الإسهاب للجلسة
- `--channel <channel>`: قناة التسليم؛ اتركه لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: تشغيل الوكيل المضمن مباشرةً (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: إرسال الرد مرة أخرى إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600 أو قيمة الإعدادات)
- `--json`: إخراج JSON

## أمثلة

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## ملاحظات

- مرّر واحدًا بالضبط من `--message` أو `--message-file`. يحتفظ `--message-file` بمحتوى الملف متعدد الأسطر بعد إزالة UTF-8 BOM اختياري، ويرفض الملفات غير الصالحة كـ UTF-8.
- يعود وضع Gateway إلى الوكيل المضمن عند فشل طلب Gateway. استخدم `--local` لفرض التنفيذ المضمن من البداية.
- لا يزال `--local` يحمّل سجل Plugin مسبقًا أولًا، لذلك تبقى المزودات والأدوات والقنوات المقدمة من Plugin متاحة أثناء التشغيلات المضمنة.
- تُعامل تشغيلات `--local` وتشغيلات الرجوع المضمنة كتشغيلات لمرة واحدة. تُتقاعد موارد loopback الخاصة بـ MCP المجمّعة وجلسات stdio الدافئة لـ Claude التي فُتحت لذلك العملية المحلية بعد الرد، بحيث لا تبقي الاستدعاءات النصية العمليات الفرعية المحلية حيّة.
- تترك التشغيلات المدعومة من Gateway موارد loopback الخاصة بـ MCP المملوكة لـ Gateway ضمن عملية Gateway قيد التشغيل؛ قد يظل العملاء الأقدم يرسلون علم التنظيف التاريخي، لكن Gateway يقبله كعملية توافق بلا أثر.
- يؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، لا في توجيه الجلسة.
- يحدد `--session-key` مفتاح جلسة صريحًا. يجب أن تستخدم المفاتيح ذات بادئة الوكيل `agent:<agent-id>:<session-key>`، ويجب أن يطابق `--agent` معرف وكيل المفتاح عند تقديمهما معًا. تُنطاق المفاتيح العارية غير sentinel إلى `--agent` عند توفيره، أو إلى الوكيل الافتراضي المُعدّ بخلاف ذلك؛ على سبيل المثال، يوجّه `--agent ops --session-key incident-42` إلى `agent:ops:incident-42`. يبقى الحرفيان `global` و`unknown` بلا نطاق فقط عند عدم توفير `--agent`؛ في تلك الحالة، يستخدم الرجوع المضمن وملكية المخزن الوكيل الافتراضي المُعدّ.
- يبقي `--json` stdout محجوزًا لاستجابة JSON. تُوجّه تشخيصات Gateway وPlugin والرجوع المضمن إلى stderr حتى تتمكن السكربتات من تحليل stdout مباشرةً.
- تتضمن JSON الرجوع المضمنة `meta.transport: "embedded"` و`meta.fallbackFrom: "gateway"` حتى تتمكن السكربتات من تمييز تشغيلات الرجوع عن تشغيلات Gateway.
- إذا قبل Gateway تشغيل وكيل لكن CLI انتهت مهلته أثناء انتظار الرد النهائي، يستخدم الرجوع المضمن معرف جلسة/تشغيل صريحًا جديدًا من نمط `gateway-fallback-*` ويبلغ عن `meta.fallbackReason: "gateway_timeout"` بالإضافة إلى حقول جلسة الرجوع. يتجنب ذلك التسابق مع قفل النص المملوك لـ Gateway أو استبدال جلسة المحادثة الأصلية الموجّهة بصمت.
- بالنسبة إلى التشغيلات المدعومة من Gateway، يقاطع `SIGTERM` و`SIGINT` طلب CLI المنتظر. إذا كان Gateway قد قبل التشغيل بالفعل، ترسل CLI أيضًا `chat.abort` لمعرف التشغيل المقبول ذلك قبل الخروج. تتلقى تشغيلات `--local` المحلية وتشغيلات الرجوع المضمنة إشارة الإجهاض نفسها، لكنها لا ترسل `chat.abort`. إذا وصل `--run-id` مكرر إلى Gateway بينما تشغيل الوكيل الأصلي لا يزال نشطًا، تبلغ الاستجابة المكررة عن `status: "in_flight"` وتطبع CLI غير JSON تشخيص stderr بدلًا من رد فارغ. بالنسبة إلى أغلفة cron/systemd الخارجية، احتفظ بمسند إيقاف قسري خارجي مثل `timeout -k 60 600 openclaw agent ...` حتى يتمكن المشرف من حصاد العملية إذا تعذر تصريف إيقاف التشغيل.
- عندما يؤدي هذا الأمر إلى إعادة إنشاء `models.json`، تُحفظ بيانات اعتماد المزودين المُدارة عبر SecretRef كعلامات غير سرية (على سبيل المثال أسماء متغيرات البيئة، أو `secretref-env:ENV_VAR_NAME`، أو `secretref-managed`)، لا كنصوص أسرار صريحة محلولة.
- كتابات العلامات ذات مصدر موثوق: يحفظ OpenClaw العلامات من لقطة إعدادات المصدر النشطة، لا من قيم أسرار وقت التشغيل المحلولة.

## حالة تسليم JSON

عند استخدام `--json --deliver`، قد تتضمن استجابة JSON من CLI حقل `deliveryStatus` في المستوى الأعلى حتى تتمكن السكربتات من التمييز بين الإرسالات المُسلّمة والمكبوتة والجزئية والفاشلة:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

`deliveryStatus.status` هو أحد `sent` أو `suppressed` أو `partial_failed` أو `failed`. تعني `suppressed` أن التسليم لم يُرسل عمدًا، على سبيل المثال ألغاه خطاف إرسال الرسائل أو لم تكن هناك نتيجة مرئية؛ ولا يزال ذلك نتيجة نهائية بلا إعادة محاولة. تعني `partial_failed` أنه تم إرسال حمولة واحدة على الأقل قبل فشل حمولة لاحقة. تعني `failed` أنه لم يكتمل أي إرسال دائم أو أن الفحص المسبق للتسليم فشل.

تحافظ استجابات CLI المدعومة من Gateway أيضًا على شكل نتيجة Gateway الخام، حيث يكون الكائن نفسه متاحًا عند `result.deliveryStatus`.

الحقول الشائعة:

- `requested`: دائمًا `true` عند وجود الكائن.
- `attempted`: ‏`true` بعد تشغيل مسار الإرسال الدائم؛ و`false` لإخفاقات الفحص المسبق أو عند عدم وجود حمولات مرئية.
- `succeeded`: ‏`true` أو `false` أو `"partial"`؛ تقترن `"partial"` مع `status: "partial_failed"`.
- `reason`: سبب بأحرف صغيرة وبنمط snake-case من التسليم الدائم أو تحقق الفحص المسبق. تشمل الأسباب المعروفة `cancelled_by_message_sending_hook` و`no_visible_payload` و`no_visible_result` و`channel_resolved_to_internal` و`unknown_channel` و`invalid_delivery_target` و`no_delivery_target`؛ وقد تبلغ الإرسالات الدائمة الفاشلة أيضًا عن المرحلة الفاشلة. عامل القيم غير المعروفة كمعتمة لأن المجموعة قابلة للتوسع.
- `resultCount`: عدد نتائج إرسال القناة عند توفره.
- `sentBeforeError`: ‏`true` عندما يرسل فشل جزئي حمولة واحدة على الأقل قبل الخطأ.
- `error`: قيمة منطقية `true` للإرسالات الفاشلة أو الفاشلة جزئيًا.
- `errorMessage`: يُضمّن فقط عند التقاط رسالة خطأ تسليم أساسية. تحمل إخفاقات الفحص المسبق `error` و`reason` ولكن لا تحمل `errorMessage`.
- `payloadOutcomes`: نتائج اختيارية لكل حمولة مع `index` أو `status` أو `reason` أو `resultCount` أو `error` أو `stage` أو `sentBeforeError` أو بيانات تعريف الخطاف عند توفرها.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [زمن تشغيل الوكيل](/ar/concepts/agent)

---
read_when:
    - تريد تشغيل دورة واحدة للوكيل من السكربتات (مع إمكانية تسليم الرد اختياريًا)
summary: مرجع CLI لـ `openclaw agent` (إرسال دور واحد للوكيل عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-05-10T19:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

شغّل دورة وكيل عبر Gateway (استخدم `--local` للوضع المضمّن).
استخدم `--agent <id>` لاستهداف وكيل مُهيّأ مباشرةً.

مرّر محدد جلسة واحدًا على الأقل:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ذات صلة:

- أداة إرسال الوكيل: [إرسال الوكيل](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة المطلوب
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-id <id>`: معرّف جلسة صريح
- `--agent <id>`: معرّف الوكيل؛ يتجاوز ارتباطات التوجيه
- `--model <id>`: تجاوز النموذج لهذه العملية (`provider/model` أو معرّف النموذج)
- `--thinking <level>`: مستوى تفكير الوكيل (`off`، `minimal`، `low`، `medium`، `high`، إضافةً إلى المستويات المخصصة المدعومة من المزوّد مثل `xhigh` أو `adaptive` أو `max`)
- `--verbose <on|off>`: حفظ مستوى الإسهاب للجلسة
- `--channel <channel>`: قناة التسليم؛ اتركه لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: شغّل الوكيل المضمّن مباشرةً (بعد التحميل المسبق لسجل plugin)
- `--deliver`: أرسل الرد مرة أخرى إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (القيمة الافتراضية 600 أو قيمة الإعداد)
- `--json`: إخراج JSON

## أمثلة

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## ملاحظات

- يعود وضع Gateway إلى الوكيل المضمّن عند فشل طلب Gateway. استخدم `--local` لفرض التنفيذ المضمّن من البداية.
- ما يزال `--local` يحمّل سجل plugin مسبقًا أولًا، لذلك تبقى المزوّدات والأدوات والقنوات المقدمة من plugin متاحة أثناء العمليات المضمّنة.
- تُعامل عمليات `--local` وعمليات الرجوع المضمّنة كعمليات لمرة واحدة. تُزال موارد loopback الخاصة بـ MCP المضمنة وجلسات Claude stdio الدافئة المفتوحة لذلك المسار المحلي بعد الرد، وبذلك لا تُبقي الاستدعاءات النصية العمليات الفرعية المحلية قيد التشغيل.
- تترك العمليات المدعومة من Gateway موارد loopback الخاصة بـ MCP التي يملكها Gateway ضمن عملية Gateway قيد التشغيل؛ قد لا يزال العملاء الأقدم يرسلون علامة التنظيف التاريخية، لكن Gateway يقبلها كعملية توافق بلا أثر.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، لا في توجيه الجلسة.
- يحافظ `--json` على stdout مخصصًا لاستجابة JSON. تُوجّه تشخيصات Gateway وplugin والرجوع المضمّن إلى stderr لكي تتمكن السكربتات من تحليل stdout مباشرةً.
- يتضمن JSON الخاص بالرجوع المضمّن `meta.transport: "embedded"` و`meta.fallbackFrom: "gateway"` لكي تتمكن السكربتات من تمييز عمليات الرجوع عن عمليات Gateway.
- إذا قبل Gateway تشغيل وكيل لكن CLI انتهت مهلته أثناء انتظار الرد النهائي، يستخدم الرجوع المضمّن معرّف جلسة/تشغيل صريحًا جديدًا على نمط `gateway-fallback-*` ويبلّغ عن `meta.fallbackReason: "gateway_timeout"` إضافةً إلى حقول جلسة الرجوع. يمنع ذلك التسابق مع قفل نص المحادثة الذي يملكه Gateway أو استبدال جلسة المحادثة الأصلية الموجّهة بصمت.
- عندما يطلق هذا الأمر إعادة توليد `models.json`، تُحفظ بيانات اعتماد المزوّد التي يديرها SecretRef كعلامات غير سرية (مثل أسماء متغيرات البيئة، أو `secretref-env:ENV_VAR_NAME`، أو `secretref-managed`)، لا كنص سرّي صريح محلول.
- كتابات العلامات موثوقة المصدر: يحفظ OpenClaw العلامات من لقطة إعداد المصدر النشطة، لا من قيم الأسرار المحلولة وقت التشغيل.

## حالة تسليم JSON

عند استخدام `--json --deliver`، قد تتضمن استجابة CLI بصيغة JSON الحقل العلوي `deliveryStatus` لكي تتمكن السكربتات من التمييز بين الإرسالات التي تم تسليمها أو كبتها أو التي نجحت جزئيًا أو فشلت:

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

`deliveryStatus.status` هو أحد القيم `sent` أو `suppressed` أو `partial_failed` أو `failed`. تعني `suppressed` أن التسليم لم يُرسل عمدًا، مثلًا لأن خطاف إرسال الرسائل ألغاه أو لأنه لم تكن هناك نتيجة مرئية؛ ومع ذلك تبقى نتيجة نهائية بلا إعادة محاولة. تعني `partial_failed` أنه تم إرسال حمولة واحدة على الأقل قبل فشل حمولة لاحقة. تعني `failed` أنه لم يكتمل أي إرسال دائم أو أن الفحص المسبق للتسليم فشل.

تحافظ استجابات CLI المدعومة من Gateway أيضًا على شكل نتيجة Gateway الخام، حيث يتوفر الكائن نفسه في `result.deliveryStatus`.

الحقول الشائعة:

- `requested`: دائمًا `true` عند وجود الكائن.
- `attempted`: `true` بعد تشغيل مسار الإرسال الدائم؛ و`false` عند فشل الفحص المسبق أو عدم وجود حمولات مرئية.
- `succeeded`: `true` أو `false` أو `"partial"`؛ تقترن `"partial"` مع `status: "partial_failed"`.
- `reason`: سبب بأحرف صغيرة وبصيغة snake-case من التسليم الدائم أو التحقق المسبق. تشمل الأسباب المعروفة `cancelled_by_message_sending_hook` و`no_visible_payload` و`no_visible_result` و`channel_resolved_to_internal` و`unknown_channel` و`invalid_delivery_target` و`no_delivery_target`؛ وقد تبلّغ الإرسالات الدائمة الفاشلة أيضًا عن المرحلة الفاشلة. تعامل مع القيم المجهولة كقيم معتمة لأن المجموعة قد تتوسع.
- `resultCount`: عدد نتائج إرسال القناة عند توفرها.
- `sentBeforeError`: `true` عندما يرسل فشل جزئي حمولة واحدة على الأقل قبل الخطأ.
- `error`: القيمة المنطقية `true` للإرسالات الفاشلة أو الفاشلة جزئيًا.
- `errorMessage`: يُضمّن فقط عند التقاط رسالة خطأ تسليم أساسية. تحمل حالات فشل الفحص المسبق `error` و`reason` ولكن لا تحمل `errorMessage`.
- `payloadOutcomes`: نتائج اختيارية لكل حمولة مع `index` أو `status` أو `reason` أو `resultCount` أو `error` أو `stage` أو `sentBeforeError` أو بيانات تعريف الخطاف عند توفرها.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [وقت تشغيل الوكيل](/ar/concepts/agent)

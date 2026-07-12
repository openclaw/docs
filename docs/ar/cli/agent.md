---
read_when:
    - تريد تشغيل دورة واحدة للوكيل من خلال البرامج النصية (مع إمكانية تسليم الرد)
summary: مرجع CLI للأمر `openclaw agent` (إرسال دورة وكيل واحدة عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-07-12T05:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

شغّل دورة واحدة للوكيل عبر Gateway. يعود إلى الوكيل المضمّن إذا فشل طلب Gateway؛ مرّر `--local` لفرض التنفيذ المضمّن منذ البداية.

مرّر محدد جلسة واحدًا على الأقل: `--to` أو `--session-key` أو `--session-id` أو `--agent`.

ذو صلة: [أداة إرسال الوكيل](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة
- `--message-file <path>`: قراءة نص الرسالة من ملف بترميز UTF-8
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-key <key>`: مفتاح جلسة صريح لاستخدامه في التوجيه
- `--session-id <id>`: معرّف جلسة صريح
- `--agent <id>`: معرّف الوكيل؛ يتجاوز ارتباطات التوجيه
- `--model <id>`: تجاوز النموذج لهذا التشغيل (`provider/model` أو معرّف النموذج)
- `--thinking <level>`: مستوى تفكير الوكيل (`off` و`minimal` و`low` و`medium` و`high`، بالإضافة إلى المستويات المخصصة التي يدعمها المزوّد مثل `xhigh` أو `adaptive` أو `max`)
- `--verbose <on|off>`: حفظ مستوى الإسهاب للجلسة
- `--channel <channel>`: قناة التسليم؛ احذفه لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: تشغيل الوكيل المضمّن مباشرةً (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: إرسال الرد إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600، أو `agents.defaults.timeoutSeconds`)؛ تعطّل القيمة `0` المهلة
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

- مرّر واحدًا فقط من `--message` أو `--message-file`. يزيل `--message-file` علامة BOM البادئة بترميز UTF-8 ويحافظ على المحتوى متعدد الأسطر؛ ويرفض الملفات غير الصالحة بترميز UTF-8.
- لا يمكن تشغيل أوامر الشرطة المائلة (مثل `/compact`) عبر `--message`. يرفضها CLI ويوجّهك بدلًا من ذلك إلى الأمر المخصص (`openclaw sessions compact <key>` لإجراء Compaction).
- عمليات `--local` والعودة إلى التنفيذ المضمّن أحادية التشغيل: تُنهى موارد الاسترجاع الحلقي لـ MCP المضمّنة وجلسات Claude الدافئة عبر stdio التي فُتحت للتشغيل بعد الرد، بحيث لا تترك الاستدعاءات البرمجية عمليات فرعية محلية قيد التشغيل. أما عمليات التشغيل المدعومة بـ Gateway فتُبقي موارد الاسترجاع الحلقي لـ MCP التي يملكها Gateway ضمن عملية Gateway الجارية.
- عند استخدام `--agent` و`--channel` و`--to` معًا، يتبع توجيه الجلسة المستلم القانوني للقناة و`session.dmScope`. تستخدم القنوات ذات هوية مستلم مستقرة ومخصصة للإرسال فقط جلسة يملكها المزوّد ومعزولة عن الجلسة الرئيسية للوكيل. يؤثر `--reply-channel` و`--reply-account` في التسليم فقط.
- يحدد `--session-key` مفتاح جلسة صريحًا. يجب أن تستخدم المفاتيح ذات بادئة الوكيل الصيغة `agent:<agent-id>:<session-key>`، ويجب أن يطابق `--agent` معرّف وكيل المفتاح عند تقديمهما معًا. تُنسب المفاتيح المجردة غير الحارسة إلى `--agent` عند تقديمه، أو إلى الوكيل الافتراضي المضبوط خلاف ذلك؛ فعلى سبيل المثال، يوجّه `--agent ops --session-key incident-42` إلى `agent:ops:incident-42`. يظل المفتاحان الحرفيان `global` و`unknown` بلا نطاق فقط عند عدم تقديم `--agent`.
- يحجز `--json` المخرج القياسي لاستجابة JSON؛ وتُرسل تشخيصات Gateway وPlugin والعودة إلى التنفيذ المضمّن إلى مخرج الخطأ القياسي كي تتمكن البرامج النصية من تحليل المخرج القياسي مباشرةً.
- يتضمن JSON الخاص بالعودة إلى التنفيذ المضمّن `meta.transport: "embedded"` و`meta.fallbackFrom: "gateway"` كي تتمكن البرامج النصية من اكتشاف تشغيل العودة.
- إذا قبل Gateway تشغيلًا لكن انتهت مهلة انتظار CLI للرد النهائي، تستخدم العودة إلى التنفيذ المضمّن معرّف جلسة/تشغيل جديدًا بالصيغة `gateway-fallback-*`، وتبلغ عن `meta.fallbackReason: "gateway_timeout"` إلى جانب حقول جلسة العودة، بدلًا من التسابق مع نص الجلسة الذي يملكه Gateway أو استبدال الجلسة الأصلية بصمت.
- تقاطع `SIGTERM`/`SIGINT` طلبًا مدعومًا بـ Gateway قيد الانتظار؛ وإذا كان Gateway قد قبل التشغيل بالفعل، يرسل CLI أيضًا `chat.abort` لمعرّف ذلك التشغيل قبل الخروج. تتلقى عمليات `--local` والعودة إلى التنفيذ المضمّن الإشارة نفسها، لكنها لا ترسل `chat.abort`. إذا كان مفتاح إزالة تكرار التشغيل الداخلي يحتوي بالفعل على تشغيل نشط لهذه الجلسة، تبلغ الاستجابة عن `status: "in_flight"` ويطبع CLI غير المستخدم لـ JSON تشخيصًا في مخرج الخطأ القياسي بدلًا من رد فارغ. بالنسبة إلى أغلفة cron/systemd الخارجية، احتفظ بآلية احتياطية للإنهاء القسري مثل `timeout -k 60 600 openclaw agent ...` حتى يتمكن المشرف من حصد العملية إذا تعذر إفراغها عند الإيقاف.
- عندما يؤدي هذا الأمر إلى إعادة إنشاء `models.json`، تُحفظ بيانات اعتماد المزوّد المُدارة بواسطة SecretRef كعلامات غير سرية (مثل أسماء متغيرات البيئة أو `secretref-env:ENV_VAR_NAME` أو `secretref-managed`)، ولا تُحفظ أبدًا كنص صريح للأسرار بعد تحليلها. تأتي عمليات كتابة العلامات من لقطة إعداد المصدر النشطة، لا من قيم الأسرار المحلولة في وقت التشغيل.

## حالة تسليم JSON

مع `--json --deliver`، تتضمن استجابة JSON الخاصة بـ CLI الحقل `deliveryStatus` في المستوى الأعلى كي تتمكن البرامج النصية من التمييز بين عمليات الإرسال التي تم تسليمها أو منعها أو فشلها جزئيًا أو فشلها بالكامل:

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

تحافظ استجابات CLI المدعومة بـ Gateway أيضًا على الشكل الخام لنتيجة Gateway في `result.deliveryStatus`.

تكون قيمة `deliveryStatus.status` واحدة من:

| الحالة           | المعنى                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `sent`           | اكتمل التسليم.                                                                                                                        |
| `suppressed`     | لم يُرسل التسليم عمدًا (على سبيل المثال، ألغاه خطاف إرسال الرسائل، أو لم تكن هناك نتيجة مرئية). حالة نهائية، بلا إعادة محاولة. |
| `partial_failed` | أُرسلت حمولة واحدة على الأقل قبل فشل حمولة لاحقة.                                                                                   |
| `failed`         | لم تكتمل أي عملية إرسال دائمة، أو فشل الفحص المسبق للتسليم.                                                                                   |

الحقول الشائعة:

- `requested`: تكون دائمًا `true` عند وجود الكائن.
- `attempted`: تكون `true` بعد تشغيل مسار الإرسال الدائم؛ وتكون `false` عند فشل الفحص المسبق أو عدم وجود حمولات مرئية.
- `succeeded`: تكون `true` أو `false` أو `"partial"`؛ وتقترن `"partial"` مع `status: "partial_failed"`.
- `reason`: سبب بأحرف صغيرة وبصيغة snake-case صادر عن التسليم الدائم أو التحقق المسبق. تشمل القيم المعروفة `cancelled_by_message_sending_hook` و`no_visible_payload` و`no_visible_result` و`channel_resolved_to_internal` و`unknown_channel` و`invalid_delivery_target` و`no_delivery_target`؛ وقد تبلغ عمليات الإرسال الدائم الفاشلة أيضًا عن المرحلة التي فشلت. تعامل مع القيم غير المعروفة على أنها مبهمة، إذ يمكن أن تتوسع المجموعة.
- `resultCount`: عدد نتائج الإرسال عبر القناة، عند توفره.
- `sentBeforeError`: تكون `true` عندما يرسل فشل جزئي حمولة واحدة على الأقل قبل حدوث الخطأ.
- `error`: تكون `true` لعمليات الإرسال الفاشلة أو الفاشلة جزئيًا.
- `errorMessage`: لا تكون موجودة إلا عند التقاط رسالة خطأ تسليم أساسية. تحمل حالات فشل الفحص المسبق `error`/`reason` ولكن بلا `errorMessage`.
- `payloadOutcomes`: نتائج اختيارية لكل حمولة تتضمن `index` أو `status` أو `reason` أو `resultCount` أو `error` أو `stage` أو `sentBeforeError`، أو بيانات وصفية للخطاف عند توفرها.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وقت تشغيل الوكيل](/ar/concepts/agent)

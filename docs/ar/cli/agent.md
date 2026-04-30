---
read_when:
    - تريد تشغيل دورة واحدة للوكيل من السكربتات (وتسليم الرد اختيارياً)
summary: مرجع CLI لـ `openclaw agent` (إرسال جولة وكيل واحدة عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-04-30T07:45:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

شغّل دورة وكيل عبر Gateway (استخدم `--local` للوضع المضمّن).
استخدم `--agent <id>` لاستهداف وكيل مُهيّأ مباشرةً.

مرّر مُحدِّد جلسة واحدًا على الأقل:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ذو صلة:

- أداة إرسال الوكيل: [إرسال الوكيل](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة المطلوب
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-id <id>`: معرّف جلسة صريح
- `--agent <id>`: معرّف الوكيل؛ يتجاوز ارتباطات التوجيه
- `--model <id>`: تجاوز النموذج لهذا التشغيل (`provider/model` أو معرّف النموذج)
- `--thinking <level>`: مستوى تفكير الوكيل (`off`, `minimal`, `low`, `medium`, `high`، بالإضافة إلى المستويات المخصّصة التي يدعمها المزوّد مثل `xhigh` أو `adaptive` أو `max`)
- `--verbose <on|off>`: الاحتفاظ بمستوى الإسهاب للجلسة
- `--channel <channel>`: قناة التسليم؛ اتركها لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: تشغيل الوكيل المضمّن مباشرةً (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: إرسال الرد مرة أخرى إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600 أو قيمة الإعداد)
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
- يظل `--local` يحمّل سجل Plugin مسبقًا أولًا، لذلك تبقى المزوّدات والأدوات والقنوات التي يوفّرها Plugin متاحة أثناء عمليات التشغيل المضمّنة.
- تُعامَل عمليات `--local` وعمليات الرجوع المضمّنة كتشغيلات لمرة واحدة. تُزال موارد MCP loopback المجمّعة وجلسات Claude stdio الدافئة المفتوحة لتلك العملية المحلية بعد الرد، لذلك لا تُبقي الاستدعاءات النصية العمليات الفرعية المحلية حية.
- تترك عمليات التشغيل المدعومة من Gateway موارد MCP loopback المملوكة لـ Gateway ضمن عملية Gateway الجارية؛ قد يظل العملاء الأقدم يرسلون علامة التنظيف التاريخية، لكن Gateway يقبلها كعدم تنفيذ لغرض التوافق.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، وليس في توجيه الجلسة.
- يُبقي `--json` stdout محجوزًا لاستجابة JSON. تُوجَّه تشخيصات Gateway وPlugin والرجوع المضمّن إلى stderr حتى تتمكن النصوص من تحليل stdout مباشرةً.
- يتضمن JSON الرجوع المضمّن `meta.transport: "embedded"` و`meta.fallbackFrom: "gateway"` حتى تتمكن النصوص من تمييز عمليات الرجوع عن عمليات Gateway.
- إذا قبل Gateway تشغيل وكيل لكن انتهت مهلة CLI أثناء انتظار الرد النهائي، يستخدم الرجوع المضمّن معرّف جلسة/تشغيل صريحًا وجديدًا بصيغة `gateway-fallback-*` ويبلغ عن `meta.fallbackReason: "gateway_timeout"` بالإضافة إلى حقول جلسة الرجوع. يتجنب هذا التسابق على قفل النص المنسوخ المملوك لـ Gateway أو استبدال جلسة المحادثة الأصلية الموجّهة بصمت.
- عندما يؤدي هذا الأمر إلى إعادة توليد `models.json`، تُحفَظ بيانات اعتماد المزوّد المُدارة بواسطة SecretRef كعلامات غير سرية (على سبيل المثال أسماء متغيرات البيئة، أو `secretref-env:ENV_VAR_NAME`، أو `secretref-managed`)، وليس كنص أسرار صريح محلول.
- كتابات العلامات ذات سلطة مصدرية: يحتفظ OpenClaw بالعلامات من لقطة إعدادات المصدر النشطة، وليس من قيم الأسرار وقت التشغيل المحلولة.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وقت تشغيل الوكيل](/ar/concepts/agent)

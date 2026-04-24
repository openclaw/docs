---
read_when:
    - تريد تشغيل دورة وكيل واحدة من البرامج النصية (مع إمكانية تسليم الرد اختياريًا)
summary: مرجع CLI لـ `openclaw agent` (إرسال دورة وكيل واحدة عبر Gateway)
title: الوكيل
x-i18n:
    generated_at: "2026-04-24T07:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

شغّل دورة وكيل عبر Gateway (استخدم `--local` للوضع المضمّن).
استخدم `--agent <id>` لاستهداف وكيل مهيأ مباشرةً.

مرّر محدد جلسة واحدًا على الأقل:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

ذو صلة:

- أداة إرسال الوكيل: [إرسال الوكيل](/ar/tools/agent-send)

## الخيارات

- `-m, --message <text>`: نص الرسالة المطلوب
- `-t, --to <dest>`: المستلم المستخدم لاشتقاق مفتاح الجلسة
- `--session-id <id>`: معرّف جلسة صريح
- `--agent <id>`: معرّف الوكيل؛ يتجاوز روابط التوجيه
- `--thinking <level>`: مستوى تفكير الوكيل (`off` و`minimal` و`low` و`medium` و`high`، بالإضافة إلى المستويات المخصصة المدعومة من المزوّد مثل `xhigh` و`adaptive` و`max`)
- `--verbose <on|off>`: حفظ مستوى التفصيل للجلسة
- `--channel <channel>`: قناة التسليم؛ احذفه لاستخدام قناة الجلسة الرئيسية
- `--reply-to <target>`: تجاوز هدف التسليم
- `--reply-channel <channel>`: تجاوز قناة التسليم
- `--reply-account <id>`: تجاوز حساب التسليم
- `--local`: شغّل الوكيل المضمّن مباشرةً (بعد التحميل المسبق لسجل Plugin)
- `--deliver`: أرسل الرد مرة أخرى إلى القناة/الهدف المحدد
- `--timeout <seconds>`: تجاوز مهلة الوكيل (الافتراضي 600 أو قيمة التهيئة)
- `--json`: إخراج JSON

## أمثلة

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## ملاحظات

- يعود وضع Gateway إلى الوكيل المضمّن عندما يفشل طلب Gateway. استخدم `--local` لفرض التنفيذ المضمّن من البداية.
- يحمّل `--local` أيضًا سجل Plugin مسبقًا أولًا، بحيث تظل المزوّدات والأدوات والقنوات التي يوفّرها Plugin متاحة أثناء التشغيلات المضمّنة.
- تؤثر `--channel` و`--reply-channel` و`--reply-account` في تسليم الرد، وليس في توجيه الجلسة.
- عندما يؤدي هذا الأمر إلى إعادة توليد `models.json`، تُحفَظ بيانات اعتماد المزوّد المُدارة بواسطة SecretRef كعلامات غير سرية (مثل أسماء متغيرات البيئة أو `secretref-env:ENV_VAR_NAME` أو `secretref-managed`)، وليس كنصوص أسرار مكشوفة تم حلّها.
- تكون كتابات العلامات معتمدة على المصدر: يحفظ OpenClaw العلامات من لقطة تهيئة المصدر النشطة، وليس من قيم الأسرار المحلولة وقت التشغيل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وقت تشغيل الوكيل](/ar/concepts/agent)

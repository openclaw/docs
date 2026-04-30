---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (سرد الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-04-30T07:50:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اعرض جلسات المحادثة المخزنة.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المكوَّن
- `--verbose`: تسجيل مفصل
- `--agent <id>`: مخزن وكيل مكوَّن واحد
- `--all-agents`: تجميع كل مخازن الوكلاء المكوَّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
أن يوافق المالك على طلب التنفيذ. يُحلّ مجلد الإخراج دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوَّنة. أما اكتشاف جلسات Gateway وACP
فهو أوسع نطاقًا: فهو يتضمن أيضًا المخازن الموجودة على القرص فقط تحت
جذر `agents/` الافتراضي أو جذر `session.store` ذي القالب. يجب أن تُحلّ
هذه المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
جذر الوكيل؛ ويتم تخطي الروابط الرمزية والمسارات الخارجة عن الجذر.

أمثلة JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## صيانة التنظيف

شغّل الصيانة الآن (بدلًا من انتظار دورة الكتابة التالية):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من التكوين:

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات والنصوص المكتوبة والملفات الجانبية للمسارات. وهو لا يقلّم سجلات تشغيل Cron (`cron/runs/<jobId>.jsonl`)، التي يديرها `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [تكوين Cron](/ar/automation/cron-jobs#configuration) والمشروحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: اعرض معاينة لعدد الإدخالات التي ستُقلَّم/تُحدّد دون كتابة.
  - في وضع النص، يطبع التشغيل التجريبي جدول إجراءات لكل جلسة (`Action`, `Key`, `Age`, `Model`, `Flags`) حتى تتمكن من رؤية ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: أزل الإدخالات التي تكون ملفات نصوصها المكتوبة مفقودة، حتى لو لم تكن لتخرج عادةً بسبب العمر/العدد بعد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإخلاء بسبب ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مكوَّن واحد.
- `--all-agents`: شغّل التنظيف لكل مخازن الوكلاء المكوَّنة.
- `--store <path>`: شغّل على ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

ذات صلة:

- تكوين الجلسة: [مرجع التكوين](/ar/gateway/config-agents#session)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

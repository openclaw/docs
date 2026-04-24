---
read_when:
    - تريد عرض الجلسات المخزنة ورؤية النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (عرض الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-04-24T07:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

اعرض جلسات المحادثات المخزنة.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المهيأ
- `--verbose`: تسجيل تفصيلي
- `--agent <id>`: مخزن وكيل مهيأ واحد
- `--all-agents`: تجميع جميع مخازن الوكلاء المهيأة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المهيأة. أما اكتشاف جلسات Gateway وACP
فهو أوسع: إذ يتضمن أيضًا المخازن الموجودة على القرص فقط والمكتشفة تحت جذر `agents/`
الافتراضي أو جذر `session.store` ذي القالب. ويجب أن تُحل تلك
المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
جذر الوكيل؛ وتُتخطى الروابط الرمزية والمسارات الخارجة عن الجذر.

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

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من التهيئة:

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات/النصوص فقط. ولا يقوم بإزالة سجلات تشغيل Cron ‏(`cron/runs/<jobId>.jsonl`)، إذ تُدار عبر `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [تهيئة Cron](/ar/automation/cron-jobs#configuration) ومشروحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: معاينة عدد الإدخالات التي ستُزال/تُحدّ من دون كتابة.
  - في الوضع النصي، يطبع التشغيل التجريبي جدول إجراءات لكل جلسة (`Action`, `Key`, `Age`, `Model`, `Flags`) حتى تتمكن من رؤية ما سيتم الاحتفاظ به مقابل ما سيتم حذفه.
- `--enforce`: طبّق الصيانة حتى عندما تكون قيمة `session.maintenance.mode` هي `warn`.
- `--fix-missing`: أزل الإدخالات التي تفتقد ملفات transcript الخاصة بها، حتى إذا لم تكن عادةً قد تجاوزت العمر/العدد بعد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإزالة بسبب ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مهيأ واحد.
- `--all-agents`: شغّل التنظيف لجميع مخازن الوكلاء المهيأة.
- `--store <path>`: شغّل على ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. ومع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

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

ذو صلة:

- تهيئة الجلسة: [مرجع التهيئة](/ar/gateway/config-agents#session)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

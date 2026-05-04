---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير.
summary: مرجع CLI لـ `openclaw sessions` (سرد الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-05-04T07:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اسرد جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات لحيوية القناة/المزوّد. إنها تعرض
صفوف المحادثات المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram
أو أي قناة أخرى هادئة أن تعيد الاتصال بنجاح من دون إنشاء صف جلسة جديد
حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe`،
`openclaw status --deep`، أو `openclaw health --verbose` عندما تحتاج إلى اتصال
مباشر بالقناة.

تكون استجابات Gateway `sessions.list` محدودة افتراضيًا حتى لا تتمكن المخازن
الكبيرة وطويلة العمر من احتكار حلقة أحداث Gateway. مرّر قيمة موجبة صريحة
لـ `limit` من عملاء RPC عندما تكون هناك حاجة إلى نافذة نتائج مختلفة؛ تتضمن
الاستجابات `totalCount` و`limitApplied` و`hasMore` عندما يحتاج المستدعون إلى إظهار
وجود المزيد من الصفوف.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المكوّن
- `--verbose`: تسجيل مفصل
- `--agent <id>`: مخزن وكيل مكوّن واحد
- `--all-agents`: تجميع جميع مخازن الوكلاء المكوّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
موافقة المالك على طلب التنفيذ. يُحل دليل الإخراج دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوّنة. اكتشاف جلسات Gateway وACP
أوسع نطاقًا: فهو يتضمن أيضًا المخازن الموجودة على القرص فقط والموجودة ضمن
جذر `agents/` الافتراضي أو جذر `session.store` ذي قالب. يجب أن تُحل تلك
المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل جذر
الوكيل؛ يتم تخطي الروابط الرمزية والمسارات خارج الجذر.

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

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات والنصوص الجلسية وملفات المسارات الجانبية. لا يقلّم سجلات تشغيل Cron (`cron/runs/<jobId>.jsonl`)، فهي تُدار عبر `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [تكوين Cron](/ar/automation/cron-jobs#configuration) وموضحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: عاين عدد الإدخالات التي ستُقلّم/تُحد من دون كتابة.
  - في وضع النص، تطبع التجربة الجافة جدول إجراءات لكل جلسة (`Action`, `Key`, `Age`, `Model`, `Flags`) حتى تتمكن من معرفة ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: أزل الإدخالات التي تكون ملفات نصوصها الجلسية مفقودة، حتى لو لم تكن ستخرج عادةً بسبب العمر/العدد بعد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإخلاء بسبب ميزانية القرص. كما يتم الاحتفاظ بمؤشرات المحادثات الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة الخيط، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مكوّن واحد.
- `--all-agents`: شغّل التنظيف لجميع مخازن الوكلاء المكوّنة.
- `--store <path>`: شغّل مقابل ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

عندما يكون Gateway قابلًا للوصول، يُرسل التنظيف غير الجاف لمخازن الوكلاء
المكوّنة عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه المستخدم في حركة مرور
وقت التشغيل. استخدم `--store <path>` للإصلاح الصريح دون اتصال لملف مخزن.

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

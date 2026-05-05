---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (عرض الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-05-05T01:44:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اعرض جلسات المحادثة المخزنة.

ليست قوائم الجلسات فحوصات لحيوية القناة/المزوّد. إنها تعرض صفوف
المحادثة المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram أو
قناة أخرى هادئة أن تعيد الاتصال بنجاح من دون إنشاء صف جلسة جديد
إلى أن تتم معالجة رسالة. استخدم `openclaw channels status --probe` أو
`openclaw status --deep` أو `openclaw health --verbose` عندما تحتاج إلى اتصال
مباشر بالقنوات.

تكون استجابات `openclaw sessions` و Gateway `sessions.list` محدودة
افتراضيًا حتى لا تتمكن المخازن الكبيرة وطويلة العمر من احتكار عملية CLI أو حلقة
أحداث Gateway. يعيد CLI أحدث 100 جلسة افتراضيًا؛ مرّر
`--limit <n>` لنافذة أصغر/أكبر أو `--limit all` عندما تحتاج عمدًا
إلى المخزن الكامل. تتضمن استجابات JSON الحقول `totalCount` و `limitApplied` و
`hasMore` عندما يحتاج المستدعون إلى إظهار وجود صفوف إضافية.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المكوّن
- `--verbose`: تسجيل مفصل
- `--agent <id>`: مخزن وكيل مكوّن واحد
- `--all-agents`: تجميع جميع مخازن الوكلاء المكوّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)
- `--limit <n|all>`: الحد الأقصى للصفوف المراد إخراجها (الافتراضي `100`؛ يعيد `all` الإخراج الكامل)

صدّر حزمة مسار تنفيذ لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
أن يوافق المالك على طلب التنفيذ. يتم حل دليل الإخراج دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوّنة. أما اكتشاف جلسات Gateway و ACP
فهو أوسع: إذ يتضمن أيضًا المخازن الموجودة على القرص فقط تحت
الجذر الافتراضي `agents/` أو جذر `session.store` ذي القالب. يجب أن
تتحلل هذه المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
جذر الوكيل؛ ويتم تخطي الروابط الرمزية والمسارات خارج الجذر.

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
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
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

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات والنصوص الجارية وملفات مسارات التنفيذ الجانبية. لا يقوم بتنقية سجلات تشغيل Cron (`cron/runs/<jobId>.jsonl`)، التي يديرها `cron.runLog.maxBytes` و `cron.runLog.keepLines` في [تكوين Cron](/ar/automation/cron-jobs#configuration) وتشرحها [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: عاين عدد الإدخالات التي ستتم تنقيتها/تقييدها من دون كتابة.
  - في وضع النص، تطبع التجربة الجافة جدول إجراءات لكل جلسة (`Action`، `Key`، `Age`، `Model`، `Flags`) حتى تتمكن من رؤية ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: أزِل الإدخالات التي تكون ملفات نصوصها الجارية مفقودة، حتى لو لم تكن عادةً ستخرج بعد بسبب العمر/العدد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإخلاء بسبب ميزانية القرص. كما يتم الاحتفاظ بمؤشرات المحادثات الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة الخيط، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مكوّن واحد.
- `--all-agents`: شغّل التنظيف لجميع مخازن الوكلاء المكوّنة.
- `--store <path>`: شغّل الأمر مقابل ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

عندما يكون Gateway قابلًا للوصول، يتم إرسال التنظيف غير الجاف لمخازن الوكلاء المكوّنة
عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه المستخدم في حركة مرور وقت التشغيل.
استخدم `--store <path>` للإصلاح غير المتصل الصريح لملف مخزن.

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

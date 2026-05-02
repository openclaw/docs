---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (سرد الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-05-02T20:43:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اسرد جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات لحيوية القناة/المزوّد. فهي تعرض صفوف
المحادثات المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram أو
قناة أخرى هادئة أن تعيد الاتصال بنجاح من دون إنشاء صف جلسة جديد
حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe` أو
`openclaw status --deep` أو `openclaw health --verbose` عندما تحتاج إلى اتصال
مباشر بالقنوات.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المضبوط
- `--verbose`: تسجيل تفصيلي
- `--agent <id>`: مخزن وكيل مضبوط واحد
- `--all-agents`: تجميع كل مخازن الوكلاء المضبوطة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد أن
يوافق المالك على طلب التنفيذ. يُحلّ دليل الإخراج دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المضبوطة. اكتشاف جلسات Gateway و ACP
أوسع نطاقًا: فهو يتضمن أيضًا المخازن الموجودة على القرص فقط تحت
جذر `agents/` الافتراضي أو جذر `session.store` ذي قالب. يجب أن تُحلّ تلك
المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
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

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من الضبط:

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات والنصوص الجلسية والملفات الجانبية للمسارات. لا يقلّم سجلات تشغيل cron (`cron/runs/<jobId>.jsonl`)، التي يديرها `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [ضبط Cron](/ar/automation/cron-jobs#configuration) والمشروحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: عاين عدد الإدخالات التي سيجري تقليمها/تقييدها من دون كتابة.
  - في وضع النص، تطبع التجربة الجافة جدول إجراءات لكل جلسة (`Action`, `Key`, `Age`, `Model`, `Flags`) حتى تتمكن من رؤية ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: أزل الإدخالات التي تكون ملفات نصوصها الجلسية مفقودة، حتى لو لم تكن ستخرج عادةً بعد بسبب العمر/العدد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإخلاء بسبب ميزانية القرص. تُحتفظ أيضًا بمؤشرات المحادثات الخارجية المتينة، مثل جلسات المجموعات وجلسات الدردشة محددة السلاسل، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مضبوط واحد.
- `--all-agents`: شغّل التنظيف لكل مخازن الوكلاء المضبوطة.
- `--store <path>`: شغّل على ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

عندما يكون Gateway قابلًا للوصول، يُرسل التنظيف غير الجاف لمخازن الوكلاء المضبوطة
عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه مثل حركة تشغيل وقت التنفيذ.
استخدم `--store <path>` للإصلاح الصريح دون اتصال لملف مخزن.

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

- ضبط الجلسة: [مرجع الضبط](/ar/gateway/config-agents#session)

## ذات صلة

- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

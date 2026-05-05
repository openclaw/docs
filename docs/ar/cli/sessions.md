---
read_when:
    - تريد عرض قائمة بالجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (عرض الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-05-05T07:31:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اعرض جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات لحيوية القنوات/المزوّدين. فهي تعرض صفوف
المحادثات المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram
أو قناة أخرى هادئة أن تعيد الاتصال بنجاح دون إنشاء صف جلسة جديد
حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe` أو
`openclaw status --deep` أو `openclaw health --verbose` عندما تحتاج إلى اتصال
القناة المباشر.

استجابات `openclaw sessions` وGateway `sessions.list` محدودة افتراضيًا
حتى لا تتمكن المخازن الكبيرة طويلة العمر من احتكار عملية CLI أو حلقة أحداث Gateway.
يعيد CLI أحدث 100 جلسة افتراضيًا؛ مرّر
`--limit <n>` لنافذة أصغر/أكبر أو `--limit all` عندما تحتاج عمدًا
إلى المخزن الكامل. تتضمن استجابات JSON `totalCount` و`limitApplied` و
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

تحديد النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المكوّن
- `--verbose`: تسجيل مفصل
- `--agent <id>`: مخزن وكيل مكوّن واحد
- `--all-agents`: تجميع كل مخازن الوكلاء المكوّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)
- `--limit <n|all>`: الحد الأقصى للصفوف المراد إخراجها (الافتراضي `100`؛ يعيد `all` الإخراج الكامل)

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
أن يوافق المالك على طلب التنفيذ. يتم دائمًا حل دليل الإخراج
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوّنة. اكتشاف جلسات Gateway وACP
أوسع نطاقًا: فهو يشمل أيضًا المخازن الموجودة على القرص فقط تحت
جذر `agents/` الافتراضي أو جذر `session.store` ذي القالب. يجب أن
تتحول هذه المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
جذر الوكيل؛ يتم تخطي الروابط الرمزية والمسارات الخارجة عن الجذر.

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

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من التهيئة:

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات، والنصوص، والملحقات الجانبية للمسارات. لا يشذّب سجلات تشغيل Cron (`cron/runs/<jobId>.jsonl`)، التي تُدار بواسطة `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [تهيئة Cron](/ar/automation/cron-jobs#configuration) والمشروحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).
- يشذّب التنظيف أيضًا النصوص الأساسية غير المشار إليها، ونقاط تحقق Compaction، والملحقات الجانبية للمسارات الأقدم من `session.maintenance.pruneAfter`؛ يتم الحفاظ على الملفات التي ما زالت مشارًا إليها بواسطة `sessions.json`.

- `--dry-run`: معاينة عدد الإدخالات التي سيتم تشذيبها/تقييدها دون كتابة.
  - في وضع النص، يطبع التشغيل التجريبي جدول إجراءات لكل جلسة (`Action`, `Key`, `Age`, `Model`, `Flags`) حتى تتمكن من رؤية ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: تطبيق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: إزالة الإدخالات التي تكون ملفات نصوصها مفقودة، حتى لو لم تكن ستخرج عادةً بسبب العمر/العدد بعد.
- `--active-key <key>`: حماية مفتاح نشط محدد من الإخلاء بسبب ميزانية القرص. يتم أيضًا الاحتفاظ بمؤشرات المحادثات الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة السلاسل، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: تشغيل التنظيف لمخزن وكيل مكوّن واحد.
- `--all-agents`: تشغيل التنظيف لكل مخازن الوكلاء المكوّنة.
- `--store <path>`: التشغيل على ملف `sessions.json` محدد.
- `--json`: طباعة ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

عندما يكون Gateway قابلًا للوصول، يتم إرسال التنظيف غير التجريبي لمخازن الوكلاء المكوّنة
عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه مثل حركة مرور وقت التشغيل.
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

ذو صلة:

- تهيئة الجلسة: [مرجع التهيئة](/ar/gateway/config-agents#session)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

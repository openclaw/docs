---
read_when:
    - تريد عرض الجلسات المحفوظة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (سرد الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-05-02T07:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اسرد جلسات المحادثة المخزنة.

ليست قوائم الجلسات فحوصات لحيوية القناة/المزوّد. فهي تعرض صفوف
المحادثات المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram أو
أي قناة أخرى هادئة إعادة الاتصال بنجاح من دون إنشاء صف جلسة جديد
حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe`،
أو `openclaw status --deep`، أو `openclaw health --verbose` عندما تحتاج إلى
اتصال مباشر بالقناة.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

تحديد النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المُهيأ
- `--verbose`: تسجيل تفصيلي
- `--agent <id>`: مخزن وكيل مُهيأ واحد
- `--all-agents`: تجميع كل مخازن الوكلاء المُهيأة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر slash `/export-trajectory` بعد
أن يوافق المالك على طلب التنفيذ. يُحلّ دليل الإخراج دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المُهيأة. اكتشاف جلسات Gateway وACP
أوسع: فهو يتضمن أيضًا المخازن الموجودة على القرص فقط تحت
جذر `agents/` الافتراضي أو جذر `session.store` المُنمذج. يجب أن
تُحلّ تلك المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
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

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات والنصوص الجارية وملحقات المسارات. لا يقلّم سجلات تشغيل Cron (`cron/runs/<jobId>.jsonl`)، التي تُدار بواسطة `cron.runLog.maxBytes` و`cron.runLog.keepLines` في [تكوين Cron](/ar/automation/cron-jobs#configuration) والمشروحة في [صيانة Cron](/ar/automation/cron-jobs#maintenance).

- `--dry-run`: عاين عدد الإدخالات التي ستُقلّم/تُحدّ من دون كتابة.
  - في وضع النص، تطبع التجربة الجافة جدول إجراءات لكل جلسة (`Action`، `Key`، `Age`، `Model`، `Flags`) كي ترى ما سيُحتفظ به مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما تكون `session.maintenance.mode` هي `warn`.
- `--fix-missing`: أزل الإدخالات التي تكون ملفات نصوصها الجارية مفقودة، حتى لو لم تكن ستخرج عادةً بسبب العمر/العدد بعد.
- `--active-key <key>`: احمِ مفتاحًا نشطًا محددًا من الإخلاء بسبب ميزانية القرص. كما يُحتفظ بمؤشرات المحادثات الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة الخيط، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مُهيأ واحد.
- `--all-agents`: شغّل التنظيف لكل مخازن الوكلاء المُهيأة.
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

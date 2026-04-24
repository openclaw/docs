---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: الوكلاء
x-i18n:
    generated_at: "2026-04-24T07:33:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه).

ذو صلة:

- التوجيه متعدد الوكلاء: [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- مساحة عمل الوكيل: [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- تكوين ظهور Skills: [تكوين Skills](/ar/tools/skills-config)

## أمثلة

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## روابط التوجيه

استخدم روابط التوجيه لتثبيت حركة القنوات الواردة على وكيل محدد.

إذا كنت تريد أيضًا Skills مرئية مختلفة لكل وكيل، فقم بتكوين
`agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع
[تكوين Skills](/ar/tools/skills-config) و
[مرجع التكوين](/ar/gateway/config-agents#agents-defaults-skills).

عرض الروابط:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

إضافة روابط:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

إذا حذفت `accountId` (`--bind <channel>`)، فسيقوم OpenClaw بتحليله من القيم الافتراضية للقناة ومن خطافات إعداد Plugin عند توفرها.

إذا حذفت `--agent` في `bind` أو `unbind`، فسيستهدف OpenClaw الوكيل الافتراضي الحالي.

### سلوك نطاق الربط

- الربط بدون `accountId` يطابق الحساب الافتراضي للقناة فقط.
- `accountId: "*"` هو البديل الاحتياطي على مستوى القناة (كل الحسابات) وهو أقل تحديدًا من ربط حساب صريح.
- إذا كان الوكيل نفسه لديه بالفعل ربط قناة مطابق بدون `accountId`، ثم أضفت لاحقًا ربطًا مع `accountId` صريح أو محلَّل، فسيقوم OpenClaw بترقية ذلك الربط الموجود في مكانه بدلًا من إضافة ربط مكرر.

مثال:

```bash
# ربط أولي على مستوى القناة فقط
openclaw agents bind --agent work --bind telegram

# ترقية لاحقة إلى ربط بنطاق حساب
openclaw agents bind --agent work --bind telegram:ops
```

بعد الترقية، يصبح التوجيه لذلك الربط محصورًا في `telegram:ops`. إذا كنت تريد أيضًا توجيه الحساب الافتراضي، فأضفه صراحةً (على سبيل المثال `--bind telegram:default`).

إزالة الروابط:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من `--bind`، وليس كليهما.

## سطح الأوامر

### `agents`

تشغيل `openclaw agents` بدون أمر فرعي يكافئ `openclaw agents list`.

### `agents list`

الخيارات:

- `--json`
- `--bindings`: تضمين قواعد التوجيه الكاملة، وليس فقط الأعداد/الملخصات لكل وكيل

### `agents add [name]`

الخيارات:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--non-interactive`
- `--json`

ملاحظات:

- تمرير أي علامات إضافة صريحة يحوّل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي اسم وكيل و`--workspace` معًا.
- `main` اسم محجوز ولا يمكن استخدامه كمعرّف وكيل جديد.

### `agents bindings`

الخيارات:

- `--agent <id>`
- `--json`

### `agents bind`

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

### `agents unbind`

الخيارات:

- `--agent <id>` (الافتراضي هو الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--all`
- `--json`

### `agents delete <id>`

الخيارات:

- `--force`
- `--json`

ملاحظات:

- لا يمكن حذف `main`.
- بدون `--force`، يلزم تأكيد تفاعلي.
- يتم نقل أدلة مساحة العمل، وحالة الوكيل، ونصوص الجلسات إلى سلة المهملات، ولا يتم حذفها نهائيًا.

## ملفات الهوية

يمكن أن تتضمن مساحة عمل كل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مثال على المسار: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

يتم تحليل مسارات الصورة الرمزية نسبةً إلى جذر مساحة العمل.

## ضبط الهوية

يكتب `set-identity` الحقول إلى `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبةً إلى مساحة العمل، أو عنوان URL من نوع http(s)، أو data URI)

الخيارات:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

ملاحظات:

- يمكن استخدام `--agent` أو `--workspace` لاختيار الوكيل المستهدف.
- إذا كنت تعتمد على `--workspace` وكان عدة وكلاء يشاركون مساحة العمل نفسها، فسيفشل الأمر ويطلب منك تمرير `--agent`.
- عندما لا يتم توفير أي حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحةً:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

عينة تكوين:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## ذو صلة

- [مرجع CLI](/ar/cli)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

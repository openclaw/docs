---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: الوكلاء
x-i18n:
    generated_at: "2026-04-30T07:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

إدارة وكلاء معزولين (مساحات العمل + المصادقة + التوجيه).

ذات صلة:

- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [إعدادات Skills](/ar/tools/skills-config): إعدادات رؤية Skills.

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

## ارتباطات التوجيه

استخدم ارتباطات التوجيه لتثبيت حركة القنوات الواردة على وكيل محدد.

إذا كنت تريد أيضا Skills مرئية مختلفة لكل وكيل، فاضبط `agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع [إعدادات Skills](/ar/tools/skills-config) و[مرجع التهيئة](/ar/gateway/config-agents#agents-defaults-skills).

عرض الارتباطات:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

إضافة ارتباطات:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

إذا حذفت `accountId` (`--bind <channel>`)، يحلّه OpenClaw من افتراضيات القناة وخطافات إعداد Plugin عند توفرها.

إذا حذفت `--agent` للأمر `bind` أو `unbind`، يستهدف OpenClaw الوكيل الافتراضي الحالي.

### سلوك نطاق الارتباط

- الارتباط من دون `accountId` يطابق حساب القناة الافتراضي فقط.
- `accountId: "*"` هو الاحتياطي على مستوى القناة (كل الحسابات)، وهو أقل تحديدا من ارتباط حساب صريح.
- إذا كان لدى الوكيل نفسه مسبقا ارتباط قناة مطابق من دون `accountId`، ثم أضفت لاحقا ارتباطا باستخدام `accountId` صريح أو محلول، يرقي OpenClaw ذلك الارتباط الموجود في مكانه بدلا من إضافة نسخة مكررة.

مثال:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

بعد الترقية، يكون التوجيه لذلك الارتباط محدودا بالنطاق `telegram:ops`. إذا كنت تريد أيضا توجيه حساب افتراضي، فأضفه صراحة (مثلا `--bind telegram:default`).

إزالة الارتباطات:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من قيم `--bind`، وليس كليهما.

## واجهة الأوامر

### `agents`

تشغيل `openclaw agents` من دون أمر فرعي يكافئ `openclaw agents list`.

### `agents list`

الخيارات:

- `--json`
- `--bindings`: تضمين قواعد التوجيه كاملة، وليس فقط الأعداد/الملخصات لكل وكيل

### `agents add [name]`

الخيارات:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--non-interactive`
- `--json`

ملاحظات:

- تمرير أي رايات إضافة صريحة يحول الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي اسم وكيل و`--workspace` معا.
- `main` محجوز ولا يمكن استخدامه كمعرف الوكيل الجديد.
- في الوضع التفاعلي، ينسخ تمهيد المصادقة الملفات الشخصية الثابتة المحمولة فقط
  (`api_key` و`token` ثابت افتراضيا). تظل الملفات الشخصية ذات رموز تحديث OAuth
  متاحة فقط عبر وراثة القراءة من مخزن الوكيل `main` الحقيقي.
  إذا لم يكن الوكيل الافتراضي المضبوط هو `main`، فسجل الدخول بشكل منفصل للملفات
  الشخصية الخاصة بـ OAuth على الوكيل الجديد.

### `agents bindings`

الخيارات:

- `--agent <id>`
- `--json`

### `agents bind`

الخيارات:

- `--agent <id>` (افتراضيا الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

### `agents unbind`

الخيارات:

- `--agent <id>` (افتراضيا الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--all`
- `--json`

### `agents delete <id>`

الخيارات:

- `--force`
- `--json`

ملاحظات:

- لا يمكن حذف `main`.
- من دون `--force`، يلزم تأكيد تفاعلي.
- تُنقل مساحة العمل وحالة الوكيل وأدلة نصوص الجلسات إلى سلة المهملات، ولا تُحذف نهائيا.
- إذا كانت مساحة عمل وكيل آخر هي المسار نفسه، أو داخل مساحة العمل هذه، أو تحتوي على مساحة العمل هذه،
  فيُحتفظ بمساحة العمل ويبلغ `--json` عن `workspaceRetained`،
  و`workspaceRetainedReason`، و`workspaceSharedWith`.

## ملفات الهوية

يمكن أن تتضمن كل مساحة عمل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مثال مسار: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

تُحل مسارات الصورة الرمزية نسبة إلى جذر مساحة العمل.

## تعيين الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبي لمساحة العمل، أو URL بنمط http(s)، أو data URI)

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

- يمكن استخدام `--agent` أو `--workspace` لاختيار الوكيل الهدف.
- إذا اعتمدت على `--workspace` وكان عدة وكلاء يشاركون مساحة العمل تلك، يفشل الأمر ويطلب منك تمرير `--agent`.
- عندما لا تُقدم حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحة:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

نموذج تهيئة:

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

## ذات صلة

- [مرجع CLI](/ar/cli)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

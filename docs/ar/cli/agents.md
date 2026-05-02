---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: الوكلاء
x-i18n:
    generated_at: "2026-05-02T20:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3522394dd416a9c8b4bf25767a14073484df0ff3d7c546cf6c730f111c5c51dc
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه).

ذات صلة:

- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [تكوين Skills](/ar/tools/skills-config): تكوين إتاحة المهارات.

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

استخدم ارتباطات التوجيه لتثبيت حركة مرور القنوات الواردة على وكيل محدد.

إذا كنت تريد أيضا Skills مرئية مختلفة لكل وكيل، فكوّن `agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع [تكوين Skills](/ar/tools/skills-config) و[مرجع التكوين](/ar/gateway/config-agents#agents-defaults-skills).

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

إذا حذفت `accountId` (`--bind <channel>`)، فسيحله OpenClaw من إعدادات القناة الافتراضية وخطافات إعداد Plugin عند توفرها.

إذا حذفت `--agent` مع `bind` أو `unbind`، فسيستهدف OpenClaw الوكيل الافتراضي الحالي.

### سلوك نطاق الارتباط

- الارتباط من دون `accountId` يطابق حساب القناة الافتراضي فقط.
- `accountId: "*"` هو خيار الرجوع على مستوى القناة (كل الحسابات)، وهو أقل تحديدا من ارتباط حساب صريح.
- إذا كان لدى الوكيل نفسه مسبقا ارتباط قناة مطابق من دون `accountId`، ثم ربطت لاحقا باستخدام `accountId` صريح أو محلول، فسيحدّث OpenClaw ذلك الارتباط الموجود في مكانه بدلا من إضافة نسخة مكررة.

مثال:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

بعد الترقية، يصبح توجيه ذلك الارتباط محصورا في `telegram:ops`. إذا كنت تريد أيضا توجيه حساب افتراضي، فأضفه صراحة (مثلا `--bind telegram:default`).

إزالة الارتباطات:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من قيم `--bind`، وليس كليهما.

## واجهة الأوامر

### `agents`

تشغيل `openclaw agents` بلا أمر فرعي يعادل `openclaw agents list`.

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

- تمرير أي أعلام إضافة صريحة ينقل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي كلا من اسم وكيل و`--workspace`.
- `main` محجوز ولا يمكن استخدامه كمعرف الوكيل الجديد.
- في الوضع التفاعلي، تنسخ تعبئة المصادقة ملفات التعريف الثابتة القابلة للنقل فقط
  (`api_key` و`token` الثابت افتراضيا). تظل ملفات تعريف رموز تحديث OAuth
  متاحة فقط عبر الوراثة بالقراءة من مخزن وكيل `main` الحقيقي.
  إذا لم يكن الوكيل الافتراضي المكوّن هو `main`، فسجّل الدخول بشكل منفصل إلى ملفات تعريف OAuth
  على الوكيل الجديد.

### `agents bindings`

الخيارات:

- `--agent <id>`
- `--json`

### `agents bind`

الخيارات:

- `--agent <id>` (يعود افتراضيا إلى الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

### `agents unbind`

الخيارات:

- `--agent <id>` (يعود افتراضيا إلى الوكيل الافتراضي الحالي)
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
- تُنقل أدلة مساحة العمل وحالة الوكيل ونصوص الجلسات إلى المهملات، ولا تُحذف حذفا نهائيا.
- عندما يكون Gateway قابلا للوصول، يُرسل الحذف عبر Gateway بحيث يشترك تنظيف التكوين ومخزن الجلسات في الكاتب نفسه مثل حركة المرور وقت التشغيل. إذا تعذر الوصول إلى Gateway، يعود CLI إلى المسار المحلي غير المتصل.
- إذا كانت مساحة عمل وكيل آخر هي المسار نفسه، أو داخل مساحة العمل هذه، أو تحتوي على مساحة العمل هذه،
  فيتم الاحتفاظ بمساحة العمل ويبلّغ `--json` عن `workspaceRetained`،
  و`workspaceRetainedReason`، و`workspaceSharedWith`.

## ملفات الهوية

يمكن أن تتضمن كل مساحة عمل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مسار مثال: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

تُحل مسارات الصور الرمزية نسبيا إلى جذر مساحة العمل.

## تعيين الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبي إلى مساحة العمل، أو عنوان URL بنمط http(s)، أو URI بيانات)

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
- إذا اعتمدت على `--workspace` وكان عدة وكلاء يتشاركون مساحة العمل تلك، فسيفشل الأمر ويطلب منك تمرير `--agent`.
- عندما لا تُقدَّم حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحة:

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

## ذات صلة

- [مرجع CLI](/ar/cli)
- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

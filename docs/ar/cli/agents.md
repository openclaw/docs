---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI لـ `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: الوكلاء
x-i18n:
    generated_at: "2026-06-27T17:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه).

ذو صلة:

- [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [إعدادات Skills](/ar/tools/skills-config): إعدادات إظهار Skills.

## أمثلة

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
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

إذا أردت أيضًا Skills مرئية مختلفة لكل وكيل، فاضبط `agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع [إعدادات Skills](/ar/tools/skills-config) و[مرجع الإعدادات](/ar/gateway/config-agents#agents-defaults-skills).

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

يمكنك أيضًا إضافة ارتباطات عند إنشاء وكيل:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

إذا حذفت `accountId` (`--bind <channel>`)، فإن OpenClaw يستخرجه من خطافات إعداد Plugin، أو ربط الحساب القسري، أو عدد الحسابات المضبوط للقناة.

إذا حذفت `--agent` مع `bind` أو `unbind`، يستهدف OpenClaw الوكيل الافتراضي الحالي.

### صيغة `--bind`

| الصيغة                       | المعنى                                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | يطابق كل الحسابات على القناة.                                                                |
| `--bind <channel>:<account>` | يطابق حسابًا واحدًا.                                                                                |
| `--bind <channel>`           | يطابق الحساب الافتراضي فقط ما لم تستطع CLI استخراج نطاق حساب خاص بـ Plugin بأمان. |

### سلوك نطاق الارتباط

- الارتباط المخزّن من دون `accountId` يطابق الحساب الافتراضي للقناة فقط.
- `accountId: "*"` هو الاحتياطي على مستوى القناة (كل الحسابات)، وهو أقل تحديدًا من ارتباط حساب صريح.
- إذا كان لدى الوكيل نفسه بالفعل ارتباط قناة مطابق من دون `accountId`، ثم ربطته لاحقًا باستخدام `accountId` صريح أو مستخرج، يرقّي OpenClaw ذلك الارتباط الموجود في مكانه بدلًا من إضافة نسخة مكررة.

أمثلة:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

بعد الترقية، يكون التوجيه لذلك الارتباط مقيدًا بالنطاق `telegram:alerts`. إذا أردت أيضًا توجيه الحساب الافتراضي، فأضفه صراحةً (مثلًا `--bind telegram:default`).

إزالة الارتباطات:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

يقبل `unbind` إما `--all` أو قيمة واحدة أو أكثر من قيم `--bind`، وليس كليهما.

## واجهة الأوامر

### `agents`

تشغيل `openclaw agents` من دون أمر فرعي يعادل `openclaw agents list`.

### `agents list`

الخيارات:

- `--json`
- `--bindings`: تضمين قواعد التوجيه كاملة، وليس فقط العدادات/الملخصات لكل وكيل

### `agents add [name]`

الخيارات:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--non-interactive`
- `--json`

ملاحظات:

- تمرير أي أعلام إضافة صريحة يحوّل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي اسم وكيل و`--workspace` معًا.
- `main` محجوز ولا يمكن استخدامه كمعرّف الوكيل الجديد.
- في الوضع التفاعلي، ينسخ زرع المصادقة الملفات الشخصية الثابتة القابلة للنقل فقط
  (`api_key` و`token` الثابت افتراضيًا). تبقى ملفات OAuth الشخصية ذات رموز التحديث
  متاحة فقط عبر الوراثة بالقراءة من مخزن الوكيل `main` الحقيقي.
  إذا لم يكن الوكيل الافتراضي المضبوط هو `main`، فسجّل الدخول بشكل منفصل لملفات OAuth
  الشخصية على الوكيل الجديد.

### `agents bindings`

الخيارات:

- `--agent <id>`
- `--json`

### `agents bind`

الخيارات:

- `--agent <id>` (يضبط افتراضيًا على الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--json`

### `agents unbind`

الخيارات:

- `--agent <id>` (يضبط افتراضيًا على الوكيل الافتراضي الحالي)
- `--bind <channel[:accountId]>` (قابل للتكرار)
- `--all`
- `--json`

### `agents delete <id>`

الخيارات:

- `--force`
- `--json`

ملاحظات:

- لا يمكن حذف `main`.
- من دون `--force`، يكون التأكيد التفاعلي مطلوبًا.
- تُنقل مساحة العمل وحالة الوكيل ومجلدات نصوص الجلسات إلى سلة المهملات، ولا تُحذف حذفًا نهائيًا.
- عندما يكون Gateway قابلًا للوصول، يُرسل الحذف عبر Gateway لكي تشترك عملية تنظيف الإعدادات ومخزن الجلسات في الكاتب نفسه مثل حركة وقت التشغيل. إذا تعذر الوصول إلى Gateway، تعود CLI إلى المسار المحلي غير المتصل.
- إذا كانت مساحة عمل وكيل آخر هي المسار نفسه، أو داخل مساحة العمل هذه، أو تحتوي مساحة العمل هذه،
  فيُحتفظ بمساحة العمل ويبلغ `--json` عن `workspaceRetained`،
  و`workspaceRetainedReason`، و`workspaceSharedWith`.

## ملفات الهوية

يمكن لكل مساحة عمل وكيل أن تتضمن ملف `IDENTITY.md` في جذر مساحة العمل:

- مثال على المسار: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح)

تُحل مسارات الصور الرمزية نسبةً إلى جذر مساحة العمل.

## ضبط الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (مسار نسبي إلى مساحة العمل، أو عنوان URL يبدأ بـ http(s)، أو معرّف URI للبيانات)

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
- إذا اعتمدت على `--workspace` وكان عدة وكلاء يتشاركون مساحة العمل هذه، يفشل الأمر ويطلب منك تمرير `--agent`.
- تقتصر ملفات صور الصورة الرمزية المحلية النسبية إلى مساحة العمل على 2 ميغابايت. لا تُفحص عناوين HTTP(S) URL ومعرّفات URI التي تبدأ بـ `data:` بحد حجم الملف المحلي.
- عندما لا تُقدَّم حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

التحميل من `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

تجاوز الحقول صراحةً:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

نموذج إعداد:

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

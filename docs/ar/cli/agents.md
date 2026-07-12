---
read_when:
    - تريد عدة وكلاء معزولين (مساحات عمل + توجيه + مصادقة)
summary: مرجع CLI للأمر `openclaw agents` (سرد/إضافة/حذف/الارتباطات/ربط/إلغاء الربط/تعيين الهوية)
title: الوكلاء
x-i18n:
    generated_at: "2026-07-12T05:38:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

إدارة الوكلاء المعزولين (مساحات العمل + المصادقة + التوجيه). تشغيل `openclaw agents` من دون أمر فرعي يعادل `openclaw agents list`.

مواضيع ذات صلة:

- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)
- [إعدادات Skills](/ar/tools/skills-config): إعداد إمكانية ظهور Skills.

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

## واجهة الأوامر

### `agents list`

الخيارات: `--json`، و`--bindings` (تضمين قواعد التوجيه الكاملة، وليس فقط الأعداد والملخصات لكل وكيل).

### `agents add [name]`

الخيارات: `--workspace <dir>`، و`--model <id>`، و`--agent-dir <dir>`، و`--bind <channel[:accountId]>` (قابل للتكرار)، و`--non-interactive`، و`--json`.

- يؤدي تمرير أي خيار صريح للإضافة إلى تحويل الأمر إلى المسار غير التفاعلي.
- يتطلب الوضع غير التفاعلي اسم الوكيل و`--workspace` معًا.
- المعرّف `main` محجوز ولا يمكن استخدامه معرّفًا للوكيل الجديد.
- يهيّئ الوضع التفاعلي المصادقة بنسخ بيانات الاعتماد الثابتة والقابلة للنقل فقط (ملفات تعريف `api_key` و`token` الثابتة)، ما لم تمنع إحدى بيانات الاعتماد ذلك باستخدام `copyToAgents: false`؛ ولا تُنسخ ملفات تعريف رمز تحديث OAuth إلا إذا سمح موفّر بذلك باستخدام `copyToAgents: true`. من دون النسخ، يظل OAuth متاحًا فقط عبر الوراثة بالقراءة من مخزن وكيل `main` الحقيقي. إذا لم يكن الوكيل الافتراضي المضبوط هو `main`، فسجّل الدخول بصورة منفصلة إلى ملفات تعريف OAuth على الوكيل الجديد.

### `agents bindings`

الخيارات: `--agent <id>`، و`--json`.

### `agents bind`

الخيارات: `--agent <id>` (القيمة الافتراضية هي الوكيل الافتراضي الحالي)، و`--bind <channel[:accountId]>` (قابل للتكرار)، و`--json`.

### `agents unbind`

الخيارات: `--agent <id>` (القيمة الافتراضية هي الوكيل الافتراضي الحالي)، و`--bind <channel[:accountId]>` (قابل للتكرار)، و`--all`، و`--json`. يقبل إما `--all` أو قيمة واحدة أو أكثر من قيم `--bind`، وليس كليهما.

### `agents set-identity`

الخيارات: `--agent <id>`، و`--workspace <dir>`، و`--identity-file <path>`، و`--from-identity`، و`--name <name>`، و`--theme <theme>`، و`--emoji <emoji>`، و`--avatar <value>`، و`--json`. راجع [تعيين الهوية](#set-identity) أدناه.

### `agents delete <id>`

الخيارات: `--force`، و`--json`.

- لا يمكن حذف `main`.
- من دون `--force`، يلزم تأكيد تفاعلي (ويفشل الأمر في جلسة لا تستخدم TTY؛ أعد تشغيله مع `--force`).
- تُنقل أدلة مساحة العمل وحالة الوكيل ونصوص الجلسات إلى سلة المهملات، ولا تُحذف نهائيًا.
- عندما يكون Gateway متاحًا، يمر الحذف عبر Gateway لكي تستخدم عملية تنظيف الإعدادات ومخزن الجلسات الجهة الكاتبة نفسها التي تستخدمها حركة بيانات وقت التشغيل. إذا تعذر الوصول إلى Gateway، يعود CLI إلى المسار المحلي غير المتصل.
- إذا كانت مساحة عمل وكيل آخر هي المسار نفسه، أو داخل مساحة العمل هذه، أو تحتوي مساحة العمل هذه، فسيُحتفظ بمساحة العمل، ويُبلغ `--json` عن `workspaceRetained` و`workspaceRetainedReason` و`workspaceSharedWith`.

## ارتباطات التوجيه

استخدم ارتباطات التوجيه لتثبيت حركة القناة الواردة على وكيل محدد.

إذا أردت أيضًا عرض Skills مختلفة لكل وكيل، فاضبط `agents.defaults.skills` و`agents.list[].skills` في `openclaw.json`. راجع [إعدادات Skills](/ar/tools/skills-config) و[مرجع الإعدادات](/ar/gateway/config-agents#agentsdefaultsskills).

سرد الارتباطات:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

إضافة ارتباطات:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

يمكنك أيضًا إضافة الارتباطات عند إنشاء وكيل:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

إذا حذفت `accountId` ‏(`--bind <channel>`)، فسيستنتجه OpenClaw من خطافات إعداد Plugin، أو ارتباط الحساب المفروض، أو عدد الحسابات المضبوطة للقناة.

إذا حذفت `--agent` من `bind` أو `unbind`، فسيستهدف OpenClaw الوكيل الافتراضي الحالي.

### تنسيق `--bind`

| التنسيق                     | المعنى                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | مطابقة جميع الحسابات على القناة.                                                                            |
| `--bind <channel>:<account>` | مطابقة حساب واحد.                                                                                           |
| `--bind <channel>`           | مطابقة الحساب الافتراضي فقط، ما لم يتمكن CLI من استنتاج نطاق حساب خاص بـPlugin بأمان.                       |

### سلوك نطاق الارتباط

- الارتباط المخزّن من دون `accountId` يطابق الحساب الافتراضي للقناة فقط.
- تمثل `accountId: "*"` الخيار الاحتياطي على مستوى القناة (جميع الحسابات)، وهي أقل تحديدًا من ارتباط صريح بحساب.
- إذا كان لدى الوكيل نفسه ارتباط قناة مطابق من دون `accountId`، ثم أضفت لاحقًا ارتباطًا باستخدام `accountId` صريح أو مستنتج، فسيحدّث OpenClaw ذلك الارتباط الحالي في موضعه بدلًا من إضافة ارتباط مكرر.

أمثلة:

```bash
# مطابقة جميع الحسابات على القناة
openclaw agents bind --agent work --bind telegram:*

# مطابقة حساب محدد
openclaw agents bind --agent work --bind telegram:ops

# ارتباط أولي بالقناة فقط
openclaw agents bind --agent work --bind telegram

# ترقية لاحقة إلى ارتباط محدد النطاق بحساب
openclaw agents bind --agent work --bind telegram:alerts
```

بعد الترقية، يصبح توجيه ذلك الارتباط محدد النطاق بـ`telegram:alerts`. إذا أردت أيضًا توجيه الحساب الافتراضي، فأضفه صراحةً (مثلًا `--bind telegram:default`).

إزالة الارتباطات:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## ملفات الهوية

يمكن أن تتضمن مساحة عمل كل وكيل ملف `IDENTITY.md` في جذر مساحة العمل:

- مثال للمسار: `~/.openclaw/workspace/IDENTITY.md`
- يقرأ `set-identity --from-identity` من جذر مساحة العمل (أو من `--identity-file` صريح).

تُحل مسارات الصور الرمزية نسبةً إلى جذر مساحة العمل، ولا يمكنها الخروج منه حتى عبر رابط رمزي.

## تعيين الهوية

يكتب `set-identity` الحقول في `agents.list[].identity`: ‏`name` و`theme` و`emoji` و`avatar` (مسار نسبي إلى مساحة العمل، أو عنوان URL يستخدم http(s)، أو معرّف URI للبيانات).

- يحدد `--agent` أو `--workspace` الوكيل المستهدف. إذا طابق `--workspace` أكثر من وكيل واحد، يفشل الأمر ويطلب منك تمرير `--agent`.
- يقتصر حجم ملفات الصور الرمزية المحلية ذات المسارات النسبية إلى مساحة العمل على 2 ميغابايت. ولا تخضع عناوين URL التي تستخدم HTTP(S) ومعرّفات URI من نوع `data:` لحد حجم الملف المحلي.
- عند عدم توفير حقول هوية صريحة، يقرأ الأمر بيانات الهوية من `IDENTITY.md`.

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

## مواضيع ذات صلة

- [مرجع CLI](/ar/cli)
- [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent)
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace)

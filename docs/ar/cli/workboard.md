---
read_when:
    - تريد فحص بطاقات Workboard أو إنشاؤها من الطرفية
    - تريد إرسال تشغيلات عمال Workboard من CLI
    - أنت تصحح أخطاء سلوك Workboard CLI أو أوامر الشرطة المائلة.
summary: مرجع CLI لبطاقات `openclaw workboard` والإرسال وتشغيلات العامل
title: لوحة العمل CLI
x-i18n:
    generated_at: "2026-06-27T17:26:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` هو واجهة الطرفية الخاصة بـ
[Plugin Workboard](/ar/plugins/workboard) المضمّن. يتيح للمشغّل عرض البطاقات، وإنشاء
بطاقة، وفحص بطاقة واحدة، وطلب إرسال العمل الجاهز من Gateway قيد التشغيل إلى
تشغيلات عمال الوكلاء الفرعيين.

فعّل Plugin قبل استخدام الأمر:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## الاستخدام

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

يقرأ الأمر ويكتب إلى قاعدة بيانات SQLite نفسها المملوكة لـ Plugin والمستخدمة من
لوحة المعلومات وأدوات وكيل Workboard. يمكن تمرير معرّفات البطاقات بالمعرّف الكامل
أو ببادئة غير ملتبسة عندما يقبل الأمر معرّف بطاقة.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

يكون الإخراج النصي مضغوطًا:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

الأعمدة هي بادئة المعرّف، والحالة، والأولوية، ومعرّف اللوحة، ومعرّف الوكيل
الاختياري، والعنوان.

الخيارات:

| الخيار               | الغرض                                                  |
| -------------------- | ------------------------------------------------------ |
| `--board <id>`       | قصر النتائج على مساحة أسماء لوحة واحدة                 |
| `--status <status>`  | قصر النتائج على حالة Workboard واحدة                   |
| `--include-archived` | تضمين البطاقات المؤرشفة في الإخراج النصي المضغوط       |
| `--json`             | طباعة قائمة البطاقات الكاملة بصيغة JSON قابلة للمعالجة |

يخفي الإخراج النصي المضغوط البطاقات المؤرشفة افتراضيًا حتى يطابق CLI الأمر
`/workboard list`. مرّر `--include-archived` لإظهارها. يحتفظ إخراج JSON بقائمة
البطاقات الكاملة، بما في ذلك البطاقات المؤرشفة، للتشغيل الآلي الحالي.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

الخيارات:

| الخيار                  | الغرض                                         |
| ----------------------- | --------------------------------------------- |
| `--notes <text>`        | ملاحظات البطاقة الأولية                       |
| `--status <status>`     | الحالة الأولية، الافتراضي `todo`              |
| `--priority <priority>` | الأولوية، الافتراضي `normal`                  |
| `--agent <id>`          | تعيين البطاقة إلى وكيل أو معرّف مالك           |
| `--board <id>`          | تخزين البطاقة في مساحة أسماء لوحة             |
| `--labels <items>`      | تسميات مفصولة بفواصل                          |
| `--json`                | طباعة البطاقة المنشأة بصيغة JSON قابلة للمعالجة |

يكتب `create` مباشرة إلى حالة Workboard في SQLite. تصبح البطاقة مرئية فورًا في
تبويب Workboard ضمن Control UI ولأدوات Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

يطبع الإخراج النصي سطر البطاقة المضغوط والملاحظات. يعيد إخراج JSON سجل البطاقة
الكامل، بما في ذلك بيانات تعريف التنفيذ، والمحاولات، والتعليقات، والروابط،
والإثبات، والمصنوعات، وسجلات العمال، وحالة البروتوكول، والتشخيصات، وبيانات
تعريف التشغيل الآلي.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

يستدعي `dispatch` أولًا طريقة Gateway RPC قيد التشغيل
`workboard.cards.dispatch`. يستخدم هذا المسار وقت تشغيل الوكيل الفرعي نفسه الذي
يستخدمه إجراء الإرسال في لوحة المعلومات، لذلك تتحول البطاقات الجاهزة إلى تشغيلات
عمال متتبعة كمهام مع مفاتيح جلسات مرتبطة. تستخدم البطاقات ذات الوكيل المعيّن
مفاتيح جلسات وكلاء فرعيين مقيّدة بنطاق الوكيل؛ وتحتفظ البطاقات غير المعيّنة
بمفتاح وكيل فرعي غير مقيّد النطاق حتى يُحافَظ على الوكيل الافتراضي المكوّن في
Gateway.

حلقة الإرسال:

1. ترقّي العناصر التابعة الجاهزة من ناحية الاعتماد إلى `ready`.
2. تحظر المطالبات المنتهية أو تشغيلات العمال التي انتهت مهلتها.
3. تسجل بيانات تعريف الإرسال على البطاقات الجاهزة.
4. تختار دفعة صغيرة من البطاقات الجاهزة غير المطالب بها.
5. تطالب بكل بطاقة محددة لصالح المرسل أو الوكيل المعيّن.
6. تبدأ تشغيل عامل وكيل فرعي بسياق بطاقة محدود ورمز مطالبة البطاقة.
7. تخزن معرّف تشغيل العامل، ومفتاح الجلسة، وربط المهمة عندما يبلّغ به دفتر مهام
   Gateway، وحالة التنفيذ، وسجل العامل على البطاقة.

الاختيار محافظ عمدًا. يبدأ إرسال واحد ثلاثة عمال كحد أقصى افتراضيًا، ويتجاوز
البطاقات المؤرشفة أو المطالب بها بالفعل، ولا يبدأ إلا بطاقة واحدة لكل مالك أو
وكيل في مرور واحد. تُترك البطاقات المملوكة بالفعل لعمل قيد التشغيل النشط أو قيد
المراجعة لإرسال لاحق.

إذا فشل بدء العامل بعد المطالبة ببطاقة، يحظر Workboard تلك البطاقة، ويمسح
المطالبة، ويسجل الفشل في بيانات تعريف تنفيذ البطاقة وسجل العامل. هذا يبقي
عمليات البدء الفاشلة مرئية بدلًا من إعادة البطاقة إلى قائمة الانتظار بصمت.

إذا لم يُقدَّم هدف Gateway صريح وكانت Gateway المحلية غير متاحة أو لا تعرض طريقة
إرسال Workboard بعد، يعود CLI إلى إرسال بيانات فقط مقابل حالة Workboard المحلية.
لا يزال بإمكان الإرسال المعتمد على البيانات فقط ترقية الاعتمادات، وتنظيف
المطالبات القديمة، وحظر التشغيلات التي انتهت مهلتها، لكنه لا يبدأ العمال. تُبلَّغ
إخفاقات المصادقة، والإذن، والتحقق، وإخفاقات هدف `--url` أو `--token` الصريح
مباشرة.

يبلغ الإخراج النصي عن بدء العمال:

```text
dispatch complete: started=2 failures=0
```

إخراج الرجوع صريح:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

يتضمن إخراج JSON نتيجة الإرسال. يمكن أن يتضمن الإرسال المدعوم بـ Gateway
`started` و`startFailures`؛ ويتضمن الرجوع إلى البيانات فقط
`gatewayUnavailable: true`. تُحجب رموز المطالبة من إخراج JSON الخاص بالبطاقات.

في لوحة المعلومات، تُعرض نتيجة الإرسال نفسها كملخص قصير حتى يتمكن المشغّل من
رؤية عدد البطاقات التي بدأت، أو رُقّيت، أو حُظرت، أو استُعيدت، أو فشلت دون فتح
تفاصيل البطاقة.

## تكافؤ أوامر الشرطة المائلة

يمكن للقنوات القادرة على الأوامر استخدام أمر الشرطة المائلة المطابق:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

يستخدم إرسال أمر الشرطة المائلة أيضًا وقت تشغيل الوكيل الفرعي في Gateway، لذلك
يتبع سلوك المطالبة، وبدء العامل، والفشل نفسه كما في مسار Gateway الخاص بلوحة
المعلومات وCLI.

`/workboard list` و`/workboard show` هما أمرا قراءة لمرسلي الأوامر المخوّلين.
`/workboard create` و`/workboard dispatch` يغيّران حالة اللوحة ويتطلبان حالة
مالك على أسطح الدردشة أو عميل Gateway لديه `operator.write` أو `operator.admin`.

## الأذونات

يستدعي مسار الإرسال في CLI واجهة Gateway RPC بنطاقي `operator.read` و
`operator.write`. يمكن لرمز Gateway للقراءة فقط فحص بيانات Workboard عبر طرق
القراءة، لكنه لا يستطيع إنشاء بطاقات أو إرسال عمال.

تعمل أوامر `list` و`create` و`show` المحلية على دليل حالة OpenClaw المحلي
المستخدم بواسطة الملف الشخصي الحالي. استخدم `--dev` أو `--profile <name>` على
أمر `openclaw` ذي المستوى الأعلى عندما تحتاج إلى جذر حالة مختلف.

## استكشاف الأخطاء وإصلاحها

### لا تظهر أي بطاقات

تأكد من تفعيل Plugin للملف الشخصي وجذر الحالة نفسيهما:

```bash
openclaw plugins inspect workboard --runtime --json
```

إذا كانت لوحة المعلومات تعرض بطاقات لكن CLI لا يعرضها، فتحقق من أن كلا الأمرين
يستخدم إعداد `--dev` أو `--profile` نفسه.

### يقول الإرسال إنه بيانات فقط

ابدأ Gateway أو أعد تشغيلها:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

ثم أعد محاولة `openclaw workboard dispatch`. الرجوع إلى البيانات فقط مفيد لتنظيف
الحالة المحلية، لكن تشغيلات العمال تحتاج إلى Gateway حيّة.

### الإرسال لا يبدأ شيئًا

تحقق من وجود بطاقة واحدة على الأقل بحالة `ready` دون مطالبة نشطة:

```bash
openclaw workboard list --status ready
```

يمكن أيضًا تجاوز البطاقات عندما يكون للمالك نفسه عمل قيد التشغيل أو المراجعة
بالفعل. انقل العمل المكتمل إلى `done`، أو حرر المطالبات القديمة عبر أدوات
Workboard، أو شغّل الإرسال مرة أخرى بعد انتهاء العامل النشط.

## ذات صلة

- [Plugin Workboard](/ar/plugins/workboard)
- [مرجع CLI](/ar/cli)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [Control UI](/ar/web/control-ui)

---
read_when:
    - تريد فحص بطاقات Workboard أو إنشاؤها من الطرفية
    - تريد إرسال عمليات تشغيل عمال Workboard من CLI
    - أنت تعمل على تصحيح سلوك CLI الخاص بـ Workboard أو الأوامر المائلة
summary: مرجع CLI لبطاقات `openclaw workboard` والإسناد وعمليات تشغيل العامل
title: واجهة سطر أوامر لوحة العمل
x-i18n:
    generated_at: "2026-07-12T05:45:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` هي واجهة الطرفية الخاصة بـ [Plugin ‏Workboard المضمّن](/ar/plugins/workboard). تتيح للمشغّل سرد البطاقات وإنشاء بطاقة وفحص بطاقة واحدة ومطالبة Gateway قيد التشغيل بإسناد العمل الجاهز إلى عمليات عامل لوكلاء فرعيين.

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

يقرأ الأمر ويكتب في قاعدة بيانات SQLite نفسها المملوكة لـ Plugin والتي تستخدمها لوحة المعلومات وأدوات وكيل Workboard. معرّفات البطاقات هي UUID؛ وتقبل الأوامر التي تستقبل معرّف بطاقة أيضًا بادئة معرّف غير ملتبسة (يعرض الإخراج النصي الموجز أول 8 محارف).

قيم `status` الصالحة: `triage` و`backlog` و`todo` و`scheduled` و`ready` و`running` و`review` و`blocked` و`done`. قيم `priority` الصالحة: `low` و`normal` و`high` و`urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

الإخراج النصي موجز:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

الأعمدة هي بادئة المعرّف والحالة والأولوية ومعرّف اللوحة ومعرّف الوكيل الاختياري والعنوان.

| الخيار               | الغرض                                              |
| -------------------- | -------------------------------------------------- |
| `--board <id>`       | حصر النتائج في نطاق لوحة واحد                      |
| `--status <status>`  | حصر النتائج في حالة واحدة من حالات Workboard       |
| `--include-archived` | تضمين البطاقات المؤرشفة في الإخراج النصي الموجز    |
| `--json`             | طباعة قائمة البطاقات الكاملة بصيغة JSON آلية       |

يخفي الإخراج النصي الموجز البطاقات المؤرشفة افتراضيًا كي تتطابق CLI مع `/workboard list`. مرّر `--include-archived` لإظهارها. يحتفظ إخراج JSON دائمًا بقائمة البطاقات الكاملة، بما فيها البطاقات المؤرشفة، لأغراض الأتمتة الحالية.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| الخيار                  | الغرض                                        |
| ----------------------- | -------------------------------------------- |
| `--notes <text>`        | ملاحظات البطاقة الأولية                      |
| `--status <status>`     | الحالة الأولية، والقيمة الافتراضية `todo`    |
| `--priority <priority>` | الأولوية، والقيمة الافتراضية `normal`        |
| `--agent <id>`          | إسناد البطاقة إلى معرّف وكيل أو مالك          |
| `--board <id>`          | تخزين البطاقة ضمن نطاق لوحة                  |
| `--labels <items>`      | تسميات مفصولة بفواصل                         |
| `--json`                | طباعة البطاقة المنشأة بصيغة JSON آلية         |

يكتب `create` مباشرةً في حالة SQLite الخاصة بـ Workboard. تظهر البطاقة فورًا في علامة تبويب Workboard ضمن واجهة التحكم ولأدوات Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

يطبع الإخراج النصي سطر البطاقة الموجز والملاحظات. يعيد إخراج JSON سجل البطاقة الكامل، بما في ذلك بيانات التنفيذ الوصفية والمحاولات والتعليقات والروابط والإثبات والعناصر الناتجة وسجلات العامل وحالة البروتوكول وبيانات التشخيص وبيانات الأتمتة الوصفية.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

يستدعي `dispatch` أولًا أسلوب RPC ‏`workboard.cards.dispatch` في Gateway قيد التشغيل، والذي يستخدم وقت تشغيل الوكلاء الفرعيين نفسه الذي يستخدمه إجراء الإسناد في لوحة المعلومات، وبذلك تتحول البطاقات الجاهزة إلى عمليات عامل متتبعة كمهام ومقترنة بمفاتيح جلسات. تستخدم البطاقات المسندة إلى وكيل مفاتيح جلسات وكلاء فرعيين ضمن نطاق الوكيل؛ بينما تحتفظ البطاقات غير المسندة بمفتاح وكيل فرعي غير مقيّد بنطاق كي يُحافظ على الوكيل الافتراضي المضبوط في Gateway.

حلقة الإسناد:

1. ترقّي العناصر التابعة الجاهزة من ناحية الاعتماديات إلى `ready`.
2. تحظر المطالبات المنتهية الصلاحية أو عمليات العامل التي انتهت مهلتها.
3. تسجّل بيانات الإسناد الوصفية في البطاقات الجاهزة.
4. تختار دفعة صغيرة من البطاقات الجاهزة غير المُطالب بها.
5. تطالب بكل بطاقة محددة لصالح المُسنِد أو الوكيل المعيّن.
6. تبدأ عملية عامل لوكيل فرعي بسياق محدود للبطاقة ورمز المطالبة الخاص بها.
7. تخزّن معرّف عملية العامل ومفتاح الجلسة والارتباط بالمهمة عندما يبلّغ به سجل مهام Gateway وحالة التنفيذ وسجل العامل في البطاقة.

الاختيار متحفّظ: يبدأ الإسناد الواحد ثلاثة عمال كحد أقصى افتراضيًا، ويتجاوز البطاقات المؤرشفة أو المُطالب بها بالفعل، ويبدأ بطاقة واحدة فقط لكل مالك أو وكيل في كل مرور. تُترك البطاقات المملوكة بالفعل لعمل نشط قيد التشغيل أو المراجعة لإسناد لاحق.

إذا فشل بدء العامل بعد المطالبة ببطاقة، يحظر Workboard تلك البطاقة ويمحو المطالبة ويسجّل الفشل في بيانات تنفيذ البطاقة وبيانات سجل العامل الوصفية، مما يُبقي عمليات البدء الفاشلة ظاهرة بدلًا من إعادة البطاقة إلى قائمة الانتظار بصمت.

إذا لم يُحدَّد هدف Gateway صراحةً وكان Gateway المحلي غير متاح أو لم يكن يوفّر أسلوب إسناد Workboard بعد، تعود CLI إلى الإسناد القائم على البيانات فقط باستخدام حالة Workboard المحلية. لا يزال الإسناد القائم على البيانات فقط قادرًا على ترقية الاعتماديات وتنظيف المطالبات القديمة وحظر العمليات التي انتهت مهلتها، لكنه لا يبدأ عمالًا. يُبلّغ مباشرةً عن حالات فشل المصادقة والأذونات والتحقق، وكذلك حالات الفشل لهدف `--url` أو `--token` محدد صراحةً، بدلًا من تشغيل المسار الاحتياطي.

يبلّغ الإخراج النصي عن عمليات بدء العامل:

```text
dispatch complete: started=2 failures=0
```

إخراج المسار الاحتياطي صريح:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

يتضمن إخراج JSON نتيجة الإسناد. قد يتضمن الإسناد المدعوم من Gateway الحقلين `started` و`startFailures`؛ ويتضمن المسار الاحتياطي القائم على البيانات فقط `gatewayUnavailable: true`. تُحجب رموز المطالبة من إخراج JSON الخاص بالبطاقات.

تُعرض نتيجة الإسناد نفسها في لوحة المعلومات كملخص قصير، بحيث يمكن للمشغّل معرفة عدد البطاقات التي بدأت أو ترقّت أو حُظرت أو أُعيدت المطالبة بها أو فشلت دون فتح تفاصيل البطاقات.

## التكافؤ مع أمر الشرطة المائلة

يمكن للقنوات التي تدعم الأوامر استخدام أمر الشرطة المائلة المطابق:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

يستخدم الإسناد عبر أمر الشرطة المائلة أيضًا وقت تشغيل الوكلاء الفرعيين في Gateway، لذا يتبع سلوك المطالبة وبدء العامل والفشل نفسه المتّبع في لوحة المعلومات ومسار Gateway في CLI.

الأمران `/workboard list` و`/workboard show` هما أمرا قراءة لمرسلي الأوامر المصرّح لهم. يغيّر الأمران `/workboard create` و`/workboard dispatch` حالة اللوحة ويتطلبان صفة المالك على واجهات الدردشة أو عميل Gateway بصلاحية `operator.write` أو `operator.admin`.

## الأذونات

يستدعي مسار الإسناد في CLI ‏RPC الخاص بـ Gateway بنطاقي `operator.read` و`operator.write`. يمكن لرمز Gateway المخصص للقراءة فقط فحص بيانات Workboard عبر أساليب القراءة، لكنه لا يستطيع إنشاء بطاقات أو إسناد عمال.

تعمل أوامر `list` و`create` و`show` المحلية على دليل حالة OpenClaw المحلي الذي يستخدمه الملف الشخصي الحالي. استخدم `--dev` أو `--profile <name>` مع أمر `openclaw` ذي المستوى الأعلى عند الحاجة إلى جذر حالة مختلف.

## استكشاف الأخطاء وإصلاحها

### لا تظهر أي بطاقات

تأكد من تمكين Plugin للملف الشخصي وجذر الحالة نفسيهما:

```bash
openclaw plugins inspect workboard --runtime --json
```

إذا كانت لوحة المعلومات تعرض البطاقات بينما لا تعرضها CLI، فتحقق من أن كلا الأمرين يستخدم إعداد `--dev` أو `--profile` نفسه.

### يشير الإسناد إلى أنه قائم على البيانات فقط

ابدأ Gateway أو أعد تشغيله:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

ثم أعد محاولة `openclaw workboard dispatch`. يُعد المسار الاحتياطي القائم على البيانات فقط مفيدًا لتنظيف الحالة المحلية، لكن عمليات العامل تحتاج إلى Gateway نشط.

### لا يبدأ الإسناد أي شيء

تحقق من وجود بطاقة واحدة على الأقل بحالة `ready` من دون مطالبة نشطة:

```bash
openclaw workboard list --status ready
```

قد تُتجاوز البطاقات أيضًا عندما يكون لدى المالك نفسه عمل قيد التشغيل أو المراجعة. انقل العمل المكتمل إلى `done`، أو حرّر المطالبات القديمة عبر أدوات Workboard، أو شغّل الإسناد مرة أخرى بعد انتهاء العامل النشط.

## ذو صلة

- [Plugin ‏Workboard](/ar/plugins/workboard)
- [مرجع CLI](/ar/cli)
- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [واجهة التحكم](/ar/web/control-ui)

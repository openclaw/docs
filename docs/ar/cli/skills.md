---
read_when:
    - تريد معرفة Skills المتاحة والجاهزة للتشغيل
    - تريد البحث في ClawHub أو تثبيت Skills من ClawHub أو Git أو الأدلة المحلية
    - تريد التحقق من إحدى مهارات ClawHub باستخدام ClawHub
    - تريد تصحيح أخطاء الملفات التنفيذية أو متغيرات البيئة أو الإعدادات المفقودة لـ Skills
summary: مرجع CLI لـ `openclaw skills` (البحث/التثبيت/التحديث/التحقق/سرد القائمة/المعلومات/الفحص/ورشة العمل)
title: Skills
x-i18n:
    generated_at: "2026-07-12T05:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3eafd40704b666e6be185aa8148b60613c861a2899fb9b0cc3353212e8e4d678
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

افحص Skills المحلية، وابحث في ClawHub، وثبّت Skills من ClawHub أو Git أو الأدلة المحلية، وتحقق من Skills في ClawHub، وحدّث عمليات التثبيت التي يتتبعها ClawHub.

ذات صلة:

- نظام Skills: [Skills](/ar/tools/skills)
- ورشة عمل Skills: [ورشة عمل Skills](/ar/tools/skill-workshop)
- إعدادات Skills: [إعدادات Skills](/ar/tools/skills-config)
- عمليات تثبيت ClawHub: [ClawHub](/ar/clawhub/cli)

## الأوامر

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install @owner/<slug>
openclaw skills install @owner/<slug> --version <version>
openclaw skills install git:owner/repo
openclaw skills install git:owner/repo@main
openclaw skills install ./path/to/skill --as custom-name
openclaw skills install @owner/<slug> --force
openclaw skills install @owner/<slug> --force-install
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
openclaw skills update @owner/<slug> --force-install
openclaw skills update @owner/<slug> --acknowledge-clawhub-risk
openclaw skills update @owner/<slug> --global
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills update --all --global
openclaw skills verify @owner/<slug>
openclaw skills verify @owner/<slug> --version <version>
openclaw skills verify @owner/<slug> --tag <tag>
openclaw skills verify @owner/<slug> --card
openclaw skills verify @owner/<slug> --global
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
openclaw skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Not reusable"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

تستخدم الأوامر `search` و`update` و`verify` منصة ClawHub مباشرةً. يثبّت `install @owner/<slug>` إحدى Skills من ClawHub، ويستنسخ `install git:owner/repo[@ref]` إحدى Skills من Git، وينسخ `install ./path` دليل Skill محليًا. تستهدف الأوامر `install` و`update` و`verify` افتراضيًا دليل `skills/` في مساحة العمل النشطة؛ ومع `--global`، تستهدف دليل Skills المُدارة المشترك. تواصل الأوامر `list` و`info` و`check` فحص Skills المحلية المرئية لمساحة العمل والإعدادات الحالية. تحدد الأوامر المرتبطة بمساحة العمل مساحة العمل المستهدفة أولًا من `--agent <id>`، ثم من دليل العمل الحالي عندما يكون داخل مساحة عمل وكيل مُعدّة، ثم من الوكيل الافتراضي.

تتوقع عمليات التثبيت من Git والأدلة المحلية وجود `SKILL.md` في جذر المصدر. يأتي المعرّف المختصر للتثبيت من قيمة `name` في البيانات الوصفية الأمامية لملف `SKILL.md` عندما تكون صالحة، ثم من اسم دليل المصدر أو المستودع؛ استخدم `--as <slug>` لتجاوزه. يقتصر `--version` على ClawHub. لا تدعم عمليات تثبيت Skills مواصفات حزم npm أو مسارات ملفات zip/الأرشيفات، ولا يحدّث `openclaw skills update` سوى عمليات التثبيت التي يتتبعها ClawHub.

تستخدم عمليات تثبيت تبعيات Skills المدعومة من Gateway، والتي تُشغّل من الإعداد الأولي أو إعدادات Skills، مسار طلب `skills.install` المنفصل بدلًا من ذلك.

ملاحظات:

| الخيار/السلوك                    | الوصف                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | استعلام اختياري؛ احذفه لاستعراض موجز البحث الافتراضي في ClawHub.                                                                                                                                                                                                                |
| `search --limit <n>`             | يحدّ عدد النتائج المُعادة.                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | يثبّت Skill من Git. يمكن أن تحتوي مراجع الفروع على شرطات مائلة، مثل `git:owner/repo@feature/foo`.                                                                                                                                                                                      |
| `install ./path/to/skill`        | يثبّت دليلًا محليًا يحتوي جذره على `SKILL.md`.                                                                                                                                                                                                                        |
| `install --as <slug>`            | يتجاوز المعرّف المختصر المستنتج لعمليات التثبيت من Git والأدلة المحلية.                                                                                                                                                                                                                 |
| `install --version <version>`    | ينطبق فقط على مراجع Skills في ClawHub.                                                                                                                                                                                                                                               |
| `install --force`                | يستبدل مجلد Skill موجودًا في مساحة العمل وله المعرّف المختصر نفسه.                                                                                                                                                                                                                  |
| `install/update --force-install` | يثبّت Skill معلّقة ومدعومة من GitHub قبل اكتمال فحص ClawHub.                                                                                                                                                                                                   |
| `--global`                       | يستهدف دليل Skills المُدارة المشترك؛ ولا يمكن دمجه مع `--agent <id>`.                                                                                                                                                                                                  |
| `--agent <id>`                   | يستهدف مساحة عمل وكيل مُعدّة واحدة؛ ويتجاوز الاستنتاج من دليل العمل الحالي.                                                                                                                                                                                            |
| `update @owner/<slug>`           | يحدّث Skill واحدة متتبعة. أضف `--global` لاستهداف دليل Skills المُدارة المشترك بدلًا من مساحة العمل.                                                                                                                                                            |
| `update --all`                   | يحدّث عمليات تثبيت ClawHub المتتبعة في مساحة العمل المحددة، أو في دليل Skills المُدارة المشترك عند استخدام `--global`.                                                                                                                                                               |
| `verify @owner/<slug>`           | يطبع افتراضيًا مغلف JSON ‏`clawhub.skill.verify.v1` الخاص بـ ClawHub. لا يوجد خيار `--json` لأن JSON هو الإعداد الافتراضي بالفعل. تُقبل المعرّفات المختصرة المجردة للتوافق عندما تكون Skill مثبتة بالفعل أو غير ملتبسة؛ وتتجنب المراجع المؤهلة باسم المالك التباس الناشر. |
| مصدر `verify`                    | عندما يعيد ClawHub مصدرًا حلّه الخادم، يتضمن JSON الخاص بالتحقق أيضًا `openclaw.verifiedSourceUrl` مثبّتًا على عملية إيداع. تظل عناوين URL غير المتاحة أو المعلنة ذاتيًا للمصدر داخل مغلف المصدر الخام فقط ولا تُرقّى.                                           |
| محدد إصدار `verify`             | يستخدم `verify` الملف `.clawhub/origin.json` مع Skills المثبتة من ClawHub، ولذلك يتحقق من الإصدار المثبت مقابل السجل الذي أتى منه. يتجاوز `--version` و`--tag` محدد الإصدار، لكنهما يحتفظان بذلك السجل المثبت عند وجود بيانات وصفية للمصدر.                    |
| `verify --card`                  | يطبع Markdown لبطاقة Skill المُنشأة بدلًا من JSON. ينتهي برمز غير صفري عندما يعيد ClawHub ‏`ok: false` أو `decision: "fail"`؛ وتكون التوقيعات غير الموقعة معلوماتية ما لم تتغير سياسة ClawHub.                                                                             |
| بصمة بطاقة Skill                 | يمكن أن تتضمن حزم ClawHub المثبتة ملف `skill-card.md` مُنشأ. يتعامل OpenClaw مع التحقق باعتباره قرارًا صادرًا عن خادم ClawHub، ولا يرفض Skill مثبتة لمجرد أن البطاقة المُنشأة تغيّر بصمة الحزمة.                                              |
| `check --agent <id>`             | يفحص مساحة عمل الوكيل المحدد ويبلغ عن Skills الجاهزة المرئية فعليًا لموجّه ذلك الوكيل أو لواجهة أوامره.                                                                                                                                              |
| `list`                           | الإجراء الافتراضي عند عدم تقديم أمر فرعي.                                                                                                                                                                                                                                    |
| مخرجات `list`/`info`/`check`     | تُرسل المخرجات المنسقة إلى stdout. ومع `--json`، تظل الحمولة القابلة للقراءة آليًا على stdout لاستخدامها مع الأنابيب والبرامج النصية.                                                                                                                                                                |

تتحقق عمليات تثبيت وتحديث Skills المجتمعية في ClawHub من مستوى الثقة قبل التنزيل. تستخدم إصدارات الأرشيف المجتمعية ذات الإصدارات بيانات وصفية للثقة خاصة بالإصدار المحدد. تعتمد Skills المستضافة على GitHub والمدعومة بأداة الحل على أداة حل التثبيت في ClawHub لفرض سياسة الفحص والتثبيت الإجباري قبل أن تعيد عملية إيداع مثبّتة؛ استخدم `--force-install` لتثبيت Skill معلّقة ومدعومة من GitHub قبل اكتمال ذلك الفحص. تُرفض الإصدارات المجتمعية الضارة أو المحظورة. تتطلب الإصدارات المجتمعية الخطرة مراجعةً واستخدام `--acknowledge-clawhub-risk` عندما ينبغي لأمر غير تفاعلي المتابعة بعد تلك المراجعة. يتجاوز ناشرو Skills الرسميون في ClawHub ومصادر Skills المضمّنة في OpenClaw مطالبة الثقة بالإصدار هذه.

## ورشة عمل Skills

يدير `openclaw skills workshop` مقترحات Skills المعلّقة في مساحة العمل المحددة. لا تصبح المقترحات Skills نشطة حتى تُطبّق. لمعرفة تفاصيل تخزين المقترحات، وضمانات ملفات الدعم، وأساليب Gateway، وسياسة الموافقة، راجع [ورشة عمل Skills](/ar/tools/skill-workshop).

```bash
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
openclaw skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
openclaw skills workshop propose-update qa-check --proposal ./PROPOSAL.md
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop apply <proposal-id>
openclaw skills workshop reject <proposal-id> --reason "Duplicate"
openclaw skills workshop quarantine <proposal-id> --reason "Needs security review"
```

تقبل الأوامر `propose-create` و`propose-update` و`revise` أيضًا الخيار `--goal <text>`
والخيار `--evidence <text>` لتسجيل دوافع المقترح والملاحظات الداعمة
إلى جانب محتوى `--proposal`/`--proposal-dir`.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

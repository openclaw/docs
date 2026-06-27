---
read_when:
    - تريد معرفة أي Skills متاحة وجاهزة للتشغيل
    - تريد البحث في ClawHub أو تثبيت Skills من ClawHub أو Git أو الأدلة المحلية
    - تريد التحقق من مهارة ClawHub باستخدام ClawHub
    - تريد استكشاف أخطاء الثنائيات/البيئة/الإعدادات المفقودة لـ Skills وإصلاحها
summary: مرجع CLI لـ `openclaw skills` (search/install/update/verify/list/info/check/workshop)
title: Skills
x-i18n:
    generated_at: "2026-06-27T17:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f76c49e04559362cac9c0d12ce86cd422b46653242212c7611cc1033941ac43
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

افحص Skills المحلية، وابحث في ClawHub، وثبّت Skills من ClawHub/Git/الأدلة المحلية، وتحقق من Skills في ClawHub، وحدّث التثبيتات المتتبعة عبر ClawHub.

ذات صلة:

- نظام Skills: [Skills](/ar/tools/skills)
- ورشة المهارات: [ورشة المهارات](/ar/tools/skill-workshop)
- إعدادات Skills: [إعدادات Skills](/ar/tools/skills-config)
- تثبيتات ClawHub: [ClawHub](/ar/clawhub/cli)

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
openclaw skills install @owner/<slug> --acknowledge-clawhub-risk
openclaw skills install @owner/<slug> --agent <id>
openclaw skills install @owner/<slug> --global
openclaw skills update @owner/<slug>
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

تستخدم `search` و`update` و`verify` ClawHub مباشرة. يثبّت `install @owner/<slug>` مهارة من ClawHub، وينسخ `install git:owner/repo[@ref]` مهارة Git، وينسخ `install ./path` دليل مهارة محلي. افتراضيًا، تستهدف `install` و`update` و`verify` دليل `skills/` في مساحة العمل النشطة؛ ومع `--global`، تستهدف دليل Skills المدار المشترك. لا تزال `list`/`info`/`check` تفحص Skills المحلية المرئية لمساحة العمل والإعدادات الحالية. تحل الأوامر المدعومة بمساحة العمل مساحة العمل الهدف من `--agent <id>`، ثم دليل العمل الحالي عندما يكون داخل مساحة عمل وكيل مهيأة، ثم الوكيل الافتراضي.

تتوقع تثبيتات Git والأدلة المحلية وجود `SKILL.md` في جذر المصدر. يأتي اسم التثبيت المختصر من `name` في frontmatter داخل `SKILL.md` عندما يكون صالحًا، ثم من اسم دليل المصدر أو المستودع؛ استخدم `--as <slug>` لتجاوزه. الخيار `--version` مخصص لـ ClawHub فقط. لا تدعم تثبيتات Skills مواصفات حزم npm أو مسارات zip/الأرشيف، ويحدّث `openclaw skills update` التثبيتات المتتبعة عبر ClawHub فقط.

تستخدم تثبيتات تبعيات Skills المدعومة عبر Gateway والمشغّلة من الإعداد الأولي أو إعدادات Skills مسار طلب `skills.install` المنفصل بدلًا من ذلك.

ملاحظات:

- يقبل `search [query...]` استعلامًا اختياريًا؛ احذفه لاستعراض موجز بحث ClawHub الافتراضي.
- يحد `search --limit <n>` من النتائج المعادة.
- يثبّت `install git:owner/repo[@ref]` مهارة Git. قد تحتوي مراجع الفروع على شرطات مائلة، مثل `git:owner/repo@feature/foo`.
- يثبّت `install ./path/to/skill` دليلًا محليًا يحتوي جذره على `SKILL.md`.
- يتجاوز `install --as <slug>` الاسم المختصر المستنتج لتثبيتات Git والأدلة المحلية.
- ينطبق `install --version <version>` على مراجع Skills في ClawHub فقط.
- يستبدل `install --force` مجلد مهارة مساحة عمل موجودًا للاسم المختصر نفسه.
- تتحقق تثبيتات وتحديثات Skills المجتمعية في ClawHub من الثقة قبل التنزيل. تستخدم إصدارات الأرشيف المجتمعية ذات الإصدارات بيانات وصفية للثقة مطابقة للإصدار المحدد. تعتمد Skills في GitHub المدعومة بالمحلّل على محلّل التثبيت في ClawHub لفرض سياسة الفحص والتثبيت القسري قبل أن يعيد تثبيتًا مثبتًا على commit محدد. تُرفض الإصدارات المجتمعية الخبيثة أو المحظورة. تتطلب الإصدارات المجتمعية عالية المخاطر مراجعة و`--acknowledge-clawhub-risk` عندما ينبغي لأمر غير تفاعلي أن يتابع بعد تلك المراجعة. يتجاوز ناشرو Skills الرسميون في ClawHub ومصادر Skills المضمّنة في OpenClaw مطالبة ثقة الإصدار هذه.
- يستهدف `--global` دليل Skills المدار المشترك ولا يمكن جمعه مع `--agent <id>`.
- يستهدف `--agent <id>` مساحة عمل وكيل واحدة مهيأة ويتجاوز استنتاج دليل العمل الحالي.
- يحدّث `update @owner/<slug>` مهارة متتبعة واحدة. أضف `--global` لاستهداف دليل Skills المدار المشترك بدلًا من مساحة العمل.
- يحدّث `update --all` تثبيتات ClawHub المتتبعة في مساحة العمل المحددة، أو في دليل Skills المدار المشترك عند جمعه مع `--global`.
- يطبع `verify @owner/<slug>` غلاف JSON الخاص بـ `clawhub.skill.verify.v1` من ClawHub افتراضيًا. لا توجد راية `--json` لأن JSON هو الافتراضي بالفعل. تظل الأسماء المختصرة المجردة مقبولة للتوافق عندما تكون المهارة مثبتة بالفعل أو غير ملتبسة، لكن المراجع المؤهلة بالمالك تتجنب غموض الناشر.
- عندما يعيد ClawHub مصدرًا محلولًا من الخادم، يتضمن JSON الخاص بالتحقق أيضًا `openclaw.verifiedSourceUrl` مثبتًا على commit محدد. تبقى عناوين URL المصدر غير المتاحة أو المصرح بها ذاتيًا داخل غلاف المصدر الخام فقط ولا تُرقّى.
- يستخدم `verify` ملف `.clawhub/origin.json` لـ Skills المثبتة من ClawHub، لذلك يتحقق من الإصدار المثبت مقابل السجل الذي جاء منه. يتجاوز `--version` و`--tag` محدد الإصدار مع الاحتفاظ بذلك السجل المثبت عندما تكون بيانات الأصل الوصفية موجودة.
- يطبع `verify --card` Markdown بطاقة المهارة المولدة بدلًا من JSON. يخرج الأمر برمز غير صفري عندما يعيد ClawHub القيمة `ok: false` أو `decision: "fail"`؛ تكون التوقيعات غير الموقعة معلوماتية ما لم تتغير سياسة ClawHub.
- يمكن أن تتضمن حزم ClawHub المثبتة ملف `skill-card.md` مولدًا. يتعامل OpenClaw مع التحقق كقرار خادم من ClawHub ولا يرفض مهارة مثبتة لمجرد أن تلك البطاقة المولدة تغيّر بصمة الحزمة.
- يتحقق `check --agent <id>` من مساحة عمل الوكيل المحدد ويبلّغ عن Skills الجاهزة المرئية فعليًا لمطالبة ذلك الوكيل أو سطح أوامره.
- `list` هو الإجراء الافتراضي عند عدم تقديم أمر فرعي.
- تكتب `list` و`info` و`check` مخرجاتها المعروضة إلى stdout. مع `--json`، يعني ذلك أن الحمولة القابلة للقراءة آليًا تبقى على stdout للأنابيب والسكربتات.

## ورشة المهارات

يدير `openclaw skills workshop` مقترحات المهارات المعلقة في مساحة العمل المحددة. لا تكون المقترحات Skills نشطة حتى تُطبّق. للتعرف على تخزين المقترحات، وضمانات ملفات الدعم، وطرق Gateway، وسياسة الموافقة، راجع [ورشة المهارات](/ar/tools/skill-workshop).

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

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

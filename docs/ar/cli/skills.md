---
read_when:
    - تريد معرفة أي Skills متاحة وجاهزة للتشغيل
    - تريد البحث عن Skills من ClawHub أو تثبيتها أو تحديثها
    - تريد تصحيح أخطاء الملفات الثنائية/البيئة/الإعدادات المفقودة لـ Skills
summary: مرجع CLI لـ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

افحص Skills المحلية وثبّت/حدّث Skills من ClawHub.

ذات صلة:

- نظام Skills: [Skills](/ar/tools/skills)
- إعدادات Skills: [إعدادات Skills](/ar/tools/skills-config)
- تثبيتات ClawHub: [ClawHub](/ar/tools/clawhub)

## الأوامر

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
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
```

تستخدم `search`/`install`/`update` ClawHub مباشرة وتثبّت في دليل `skills/`
لمساحة العمل النشطة. أما `list`/`info`/`check` فما تزال تفحص Skills المحلية
المرئية لمساحة العمل والإعدادات الحالية. تحل الأوامر المدعومة بمساحة العمل
مساحة العمل الهدف من `--agent <id>`، ثم دليل العمل الحالي عندما يكون داخل
مساحة عمل وكيل مهيأة، ثم الوكيل الافتراضي.

ينزّل أمر `install` في CLI هذا مجلدات Skills من ClawHub. أما تثبيتات
اعتماديات Skills المدعومة من Gateway والمشغلة من الإعداد الأولي أو إعدادات
Skills فتستخدم مسار طلب `skills.install` المنفصل بدلًا من ذلك.

ملاحظات:

- يقبل `search [query...]` استعلامًا اختياريًا؛ احذفه لتصفح موجز بحث ClawHub
  الافتراضي.
- يحد `search --limit <n>` من النتائج المرجعة.
- يستبدل `install --force` مجلد Skill موجودًا في مساحة العمل للمعرّف نفسه.
- يستهدف `--agent <id>` مساحة عمل وكيل مهيأة واحدة ويتجاوز استنتاج دليل
  العمل الحالي.
- لا يحدّث `update --all` إلا تثبيتات ClawHub المتتبعة في مساحة العمل النشطة.
- يفحص `check --agent <id>` مساحة عمل الوكيل المحدد ويبلغ عن Skills الجاهزة
  المرئية فعليًا لسطح أوامر ذلك الوكيل أو موجهه.
- يكون `list` هو الإجراء الافتراضي عند عدم توفير أمر فرعي.
- تكتب `list` و`info` و`check` مخرجاتها المعروضة إلى stdout. ومع `--json`،
  يعني ذلك أن الحمولة القابلة للقراءة آليًا تبقى على stdout للاستخدام في
  الأنابيب والسكربتات.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

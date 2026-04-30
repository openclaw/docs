---
read_when:
    - تريد معرفة أي Skills متاحة وجاهزة للتشغيل
    - تريد البحث عن Skills من ClawHub أو تثبيتها أو تحديثها
    - تريد استكشاف أخطاء الملفات الثنائية/البيئة/التكوين المفقودة لـ Skills
summary: مرجع CLI لـ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T07:50:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

افحص Skills المحلية وثبّت/حدّث Skills من ClawHub.

ذات صلة:

- نظام Skills: [Skills](/ar/tools/skills)
- تكوين Skills: [Skills config](/ar/tools/skills-config)
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
openclaw skills check --json
openclaw skills check --agent <id>
```

تستخدم `search`/`install`/`update` ClawHub مباشرةً وتثبّت في دليل
`skills/` في مساحة العمل النشطة. ما زالت `list`/`info`/`check` تفحص
Skills المحلية المرئية لمساحة العمل والتكوين الحاليين. تحلّ الأوامر المستندة
إلى مساحة العمل مساحة العمل الهدف من `--agent <id>`، ثم دليل العمل الحالي
عندما يكون داخل مساحة عمل وكيل مهيأة، ثم الوكيل الافتراضي.

ينزّل أمر `install` في CLI هذا مجلدات Skills من ClawHub. أما عمليات تثبيت
اعتماديات Skills المدعومة من Gateway والمشغّلة من الإعداد الأولي أو إعدادات
Skills فتستخدم مسار طلب `skills.install` المنفصل بدلًا من ذلك.

ملاحظات:

- تقبل `search [query...]` استعلامًا اختياريًا؛ احذفه لتصفح خلاصة بحث
  ClawHub الافتراضية.
- يحدّد `search --limit <n>` الحد الأقصى للنتائج المعادة.
- يستبدل `install --force` مجلد Skill موجودًا في مساحة العمل للمعرّف النصي
  نفسه.
- يستهدف `--agent <id>` مساحة عمل وكيل واحدة مهيأة ويتجاوز استنتاج دليل
  العمل الحالي.
- يحدّث `update --all` تثبيتات ClawHub المتتبعة فقط في مساحة العمل النشطة.
- `list` هو الإجراء الافتراضي عند عدم توفير أمر فرعي.
- تكتب `list` و`info` و`check` مخرجاتها المعروضة إلى الإخراج القياسي. مع
  `--json`، يعني ذلك أن الحمولة القابلة للقراءة آليًا تبقى على الإخراج
  القياسي للأنابيب والسكربتات.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

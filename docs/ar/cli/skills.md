---
read_when:
    - تريد معرفة أي Skills متاحة وجاهزة للتشغيل
    - تريد البحث عن Skills من ClawHub أو تثبيتها أو تحديثها
    - تريد استكشاف أخطاء الثنائيات/البيئة/التكوين المفقودة لـ Skills وإصلاحها
summary: مرجع CLI لـ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:32:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

افحص Skills المحلية وثبّت/حدّث Skills من ClawHub.

ذات صلة:

- نظام Skills: [Skills](/ar/tools/skills)
- إعدادات Skills: [إعدادات Skills](/ar/tools/skills-config)
- تثبيتات ClawHub: [ClawHub](/ar/clawhub/cli)

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

تستخدم `search`/`install`/`update` ClawHub مباشرة وتثبّت في دليل `skills/` لمساحة العمل النشطة. لا تزال `list`/`info`/`check` تفحص Skills المحلية المرئية لمساحة العمل الحالية والإعدادات. تحل الأوامر المدعومة بمساحة العمل مساحة العمل الهدف من `--agent <id>`، ثم دليل العمل الحالي عندما يكون داخل مساحة عمل وكيل مهيأة، ثم الوكيل الافتراضي.

ينزّل أمر `install` في CLI هذا مجلدات Skills من ClawHub. أما تثبيتات تبعيات Skills المدعومة من Gateway والتي تُشغّل من الإعداد الأولي أو إعدادات Skills فتستخدم مسار طلب `skills.install` المنفصل بدلا من ذلك.

ملاحظات:

- يقبل `search [query...]` استعلاما اختياريا؛ احذفه لتصفح موجز بحث ClawHub الافتراضي.
- يحد `search --limit <n>` عدد النتائج المُعادة.
- يستبدل `install --force` مجلد Skill موجودا في مساحة العمل للـ slug نفسه.
- يستهدف `--agent <id>` مساحة عمل وكيل مهيأة واحدة ويتجاوز استنتاج دليل العمل الحالي.
- يحدّث `update --all` فقط تثبيتات ClawHub المتتبعة في مساحة العمل النشطة.
- يفحص `check --agent <id>` مساحة عمل الوكيل المحدد ويبلغ عن Skills الجاهزة المرئية فعليا لسطح أوامر ذلك الوكيل أو موجّهه.
- `list` هو الإجراء الافتراضي عند عدم تقديم أمر فرعي.
- تكتب `list` و`info` و`check` المخرجات المعروضة إلى stdout. مع `--json`، يعني ذلك أن الحمولة المقروءة آليا تبقى على stdout للأنابيب والسكربتات.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

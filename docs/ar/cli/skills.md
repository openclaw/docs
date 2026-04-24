---
read_when:
    - تريد معرفة Skills المتاحة والجاهزة للتشغيل
    - تريد البحث عن Skills أو تثبيتها أو تحديثها من ClawHub
    - تريد تصحيح أخطاء الملفات التنفيذية أو متغيرات البيئة أو الإعدادات المفقودة الخاصة بـ Skills
summary: مرجع CLI لـ `openclaw skills` (البحث/التثبيت/التحديث/السرد/المعلومات/التحقق)
title: Skills
x-i18n:
    generated_at: "2026-04-24T07:36:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31cd7647a15cd5df6cf5a2311e63bb11cc3aabfe8beefda7be57dc76adc509ea
    source_path: cli/skills.md
    workflow: 15
---

# `openclaw skills`

افحص Skills المحلية وثبّت/حدّث Skills من ClawHub.

ذو صلة:

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
openclaw skills update <slug>
openclaw skills update --all
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills check
openclaw skills check --json
```

تستخدم `search`/`install`/`update` خدمة ClawHub مباشرةً وتثبّت داخل دليل
`skills/` الخاص بمساحة العمل النشطة. أما `list`/`info`/`check` فما تزال
تفحص Skills المحلية المرئية لمساحة العمل الحالية والإعدادات الحالية.

يقوم أمر CLI هذا `install` بتنزيل مجلدات Skill من ClawHub. أما
تثبيتات تبعيات Skill المدعومة بـ Gateway والتي يتم تشغيلها من onboarding أو من
إعدادات Skills فتستخدم مسار الطلب المنفصل `skills.install` بدلًا من ذلك.

ملاحظات:

- تقبل `search [query...]` استعلامًا اختياريًا؛ احذفه لتصفح خلاصة البحث الافتراضية في ClawHub.
- يحد `search --limit <n>` من عدد النتائج المُعادة.
- يقوم `install --force` بالكتابة فوق مجلد Skill موجود في مساحة العمل للـ
  slug نفسه.
- يقوم `update --all` فقط بتحديث تثبيتات ClawHub المتعقبة في مساحة العمل النشطة.
- `list` هو الإجراء الافتراضي عندما لا يتم توفير أمر فرعي.
- تكتب `list` و`info` و`check` المخرجات المعروضة إلى stdout. ومع
  `--json`، فهذا يعني أن الحمولة القابلة للقراءة آليًا تبقى على stdout
  لاستخدامها في الأنابيب والبرامج النصية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Skills](/ar/tools/skills)

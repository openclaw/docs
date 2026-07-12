---
read_when:
    - أنت قادم من Claude Code أو Claude Desktop وتريد الاحتفاظ بالتعليمات وخوادم MCP وSkills
    - تحتاج إلى فهم ما يستورده OpenClaw تلقائيًا وما يبقى للأرشفة فقط
summary: انقل الحالة المحلية لـ Claude Code وClaude Desktop إلى OpenClaw عبر استيراد مع معاينة مسبقة
title: الترحيل من Claude
x-i18n:
    generated_at: "2026-07-12T06:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f31088b749a1bebe39b16f519b1817ffeb71ca31e8cbf46fd59db6ff603dbe0f
    source_path: install/migrating-claude.md
    workflow: 16
---

يستورد OpenClaw حالة Claude المحلية من خلال موفّر ترحيل Claude المضمّن. يعاين الموفّر كل عنصر قبل تغيير الحالة، ويحجب الأسرار في الخطط والتقارير، وينشئ نسخة احتياطية متحققًا منها قبل التطبيق.

<Note>
تتطلب عمليات الاستيراد أثناء الإعداد الأولي إعدادًا جديدًا لـ OpenClaw. إذا كانت لديك بالفعل حالة محلية لـ OpenClaw، فأعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا، أو استخدم `openclaw migrate` مباشرةً مع `--overwrite` بعد مراجعة الخطة.
</Note>

## طريقتان للاستيراد

<Tabs>
  <Tab title="معالج الإعداد الأولي">
    يعرض المعالج Claude عندما يكتشف حالة Claude محلية.

    ```bash
    openclaw onboard --flow import
    ```

    أو حدّد مصدرًا معينًا:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    استخدم `openclaw migrate` لعمليات التشغيل البرمجية أو القابلة للتكرار. راجع [`openclaw migrate`](/ar/cli/migrate) للاطلاع على المرجع الكامل.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    أضف `--from <path>` لاستيراد مجلد Claude Code الرئيسي أو جذر مشروع معين.

  </Tab>
</Tabs>

## ما يتم استيراده

<AccordionGroup>
  <Accordion title="التعليمات والذاكرة">
    - يُنسخ محتوى `CLAUDE.md` و`.claude/CLAUDE.md` الخاص بالمشروع أو يُلحق بملف `AGENTS.md` في مساحة عمل وكيل OpenClaw.
    - يُلحق محتوى `~/.claude/CLAUDE.md` الخاص بالمستخدم بملف `USER.md` في مساحة العمل.

  </Accordion>
  <Accordion title="خوادم MCP">
    تُستورد تعريفات خوادم MCP من ملف المشروع `.mcp.json`، وملف Claude Code‏ `~/.claude.json`، وملف Claude Desktop‏ `claude_desktop_config.json` عند وجودها.
  </Accordion>
  <Accordion title="Skills والأوامر">
    - تُنسخ Skills الخاصة بـ Claude التي تحتوي على ملف `SKILL.md` إلى دليل Skills في مساحة عمل OpenClaw.
    - تُحوّل ملفات Markdown لأوامر Claude ضمن `.claude/commands/` أو `~/.claude/commands/` إلى Skills في OpenClaw مع `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## ما يبقى في الأرشيف فقط

ينسخ الموفّر العناصر التالية إلى تقرير الترحيل لمراجعتها يدويًا، لكنه **لا** يحمّلها في إعدادات OpenClaw النشطة:

- خطافات Claude
- أذونات Claude وقوائم السماح الواسعة للأدوات
- القيم الافتراضية لبيئة Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- الوكلاء الفرعيون لـ Claude ضمن `.claude/agents/` أو `~/.claude/agents/`
- أدلة ذاكرات التخزين المؤقت والخطط وسجل المشاريع في Claude Code
- ملحقات Claude Desktop وبيانات الاعتماد المخزنة في نظام التشغيل

يرفض OpenClaw تنفيذ الخطافات، أو الوثوق بقوائم السماح للأذونات، أو فك ترميز حالة OAuth وبيانات اعتماد Desktop المبهمة تلقائيًا. انقل ما تحتاج إليه يدويًا بعد مراجعة الأرشيف.

## تحديد المصدر

من دون `--from`، يفحص OpenClaw مجلد Claude Code الرئيسي الافتراضي في `~/.claude`، وملف الحالة النموذجي لـ Claude Code في `~/.claude.json`، وإعدادات MCP الخاصة بـ Claude Desktop على macOS.

عندما يشير `--from` إلى جذر مشروع، يستورد OpenClaw ملفات Claude الخاصة بذلك المشروع فقط، مثل `CLAUDE.md` و`.claude/settings.json` و`.claude/commands/` و`.claude/skills/` و`.mcp.json`. ولا يقرأ مجلد Claude الرئيسي العام أثناء الاستيراد من جذر مشروع.

## المسار الموصى به

<Steps>
  <Step title="معاينة الخطة">
    ```bash
    openclaw migrate claude --dry-run
    ```

    تسرد الخطة كل ما سيتغير، بما في ذلك التعارضات والعناصر المتخطاة والقيم الحساسة المحجوبة من حقول MCP المتداخلة `env` أو `headers`.

  </Step>
  <Step title="التطبيق مع نسخة احتياطية">
    ```bash
    openclaw migrate apply claude --yes
    ```

    ينشئ OpenClaw نسخة احتياطية ويتحقق منها قبل التطبيق.

  </Step>
  <Step title="تشغيل أداة التشخيص">
    ```bash
    openclaw doctor
    ```

    تتحقق [أداة التشخيص](/ar/gateway/doctor) من مشكلات الإعدادات أو الحالة بعد الاستيراد.

  </Step>
  <Step title="إعادة التشغيل والتحقق">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأكد من سلامة Gateway ومن تحميل التعليمات وخوادم MCP وSkills التي استوردتها.

  </Step>
</Steps>

## معالجة التعارضات

يرفض التطبيق المتابعة عندما تُبلغ الخطة عن تعارضات (أي عندما يكون ملف أو قيمة إعدادات موجودًا بالفعل في الوجهة).

<Warning>
أعد التشغيل مع `--overwrite` فقط عندما يكون استبدال الوجهة الموجودة مقصودًا. قد تظل الموفّرات تكتب نسخًا احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
</Warning>

في تثبيت جديد لـ OpenClaw، تكون التعارضات غير معتادة. وتظهر عادةً عند إعادة تشغيل الاستيراد على إعداد يحتوي بالفعل على تعديلات المستخدم.

## مخرجات JSON للأتمتة

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

يلزم استخدام `--yes` مع `migrate apply` خارج الطرفية التفاعلية؛ ومن دونه يعرض OpenClaw خطأ بدلًا من التطبيق، لذا يجب أن تمرّر البرامج النصية وCI الخيار `--yes` صراحةً. عاين أولًا باستخدام `--dry-run --json`، ثم طبّق باستخدام `--json --yes` بعد التأكد من صحة الخطة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حالة Claude موجودة خارج ~/.claude">
    مرّر `--from /actual/path` ‏(CLI) أو `--import-source /actual/path` (الإعداد الأولي).
  </Accordion>
  <Accordion title="الإعداد الأولي يرفض الاستيراد إلى إعداد موجود">
    تتطلب عمليات الاستيراد أثناء الإعداد الأولي إعدادًا جديدًا. أعد ضبط الحالة وابدأ الإعداد الأولي مجددًا، أو استخدم `openclaw migrate apply claude` مباشرةً، إذ يدعم `--overwrite` والتحكم الصريح في النسخ الاحتياطي.
  </Accordion>
  <Accordion title="لم تُستورد خوادم MCP من Claude Desktop">
    يقرأ Claude Desktop ملف `claude_desktop_config.json` من مسار خاص بالمنصة. وجّه `--from` إلى دليل ذلك الملف إذا لم يكتشفه OpenClaw تلقائيًا.
  </Accordion>
  <Accordion title="تحولت أوامر Claude إلى Skills مع تعطيل استدعاء النموذج">
    هذا مقصود. يشغّل المستخدم أوامر Claude، لذا يستوردها OpenClaw بوصفها Skills مع `disable-model-invocation: true`. عدّل البيانات الوصفية الأمامية لكل Skill إذا أردت أن يستدعيها الوكيل تلقائيًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): مرجع CLI الكامل، وعقد Plugin، وبُنى JSON.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل.
- [الترحيل من Hermes](/ar/install/migrating-hermes): مسار الاستيراد الآخر بين الأنظمة.
- [الإعداد الأولي](/ar/cli/onboard): مسار المعالج وخيارات التشغيل غير التفاعلي.
- [أداة التشخيص](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): حيث توجد `AGENTS.md` و`USER.md` وSkills.

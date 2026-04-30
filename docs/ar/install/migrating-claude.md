---
read_when:
    - أنت قادم من Claude Code أو Claude Desktop وتريد الاحتفاظ بالتعليمات وخوادم MCP وSkills
    - تحتاج إلى فهم ما يستورده OpenClaw تلقائيًا وما يبقى للأرشفة فقط
summary: انقل الحالة المحلية لـ Claude Code وClaude Desktop إلى OpenClaw باستخدام استيراد مع معاينة مسبقة
title: الترحيل من Claude
x-i18n:
    generated_at: "2026-04-30T08:08:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b44eda85f3a3714d7d360d04fdd2c99a692fa6491f12e73847c5f08d702a62c
    source_path: install/migrating-claude.md
    workflow: 16
---

يستورد OpenClaw حالة Claude المحلية عبر موفر ترحيل Claude المضمّن. يعاين الموفر كل عنصر قبل تغيير الحالة، ويحجب الأسرار في الخطط والتقارير، وينشئ نسخة احتياطية موثّقة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديدًا. إذا كانت لديك حالة OpenClaw محلية بالفعل، فأعد ضبط الإعدادات، وبيانات الاعتماد، والجلسات، ومساحة العمل أولًا، أو استخدم `openclaw migrate` مباشرةً مع `--overwrite` بعد مراجعة الخطة.
</Note>

## طريقتان للاستيراد

<Tabs>
  <Tab title="معالج الإعداد الأولي">
    يعرض المعالج Claude عندما يكتشف حالة Claude محلية.

    ```bash
    openclaw onboard --flow import
    ```

    أو وجّهه إلى مصدر محدد:

    ```bash
    openclaw onboard --import-from claude --import-source ~/.claude
    ```

  </Tab>
  <Tab title="CLI">
    استخدم `openclaw migrate` للتشغيلات المبرمجة أو القابلة للتكرار. راجع [`openclaw migrate`](/ar/cli/migrate) للمرجع الكامل.

    ```bash
    openclaw migrate claude --dry-run
    openclaw migrate apply claude --yes
    ```

    أضف `--from <path>` لاستيراد منزل Claude Code محدد أو جذر مشروع محدد.

  </Tab>
</Tabs>

## ما الذي يتم استيراده

<AccordionGroup>
  <Accordion title="التعليمات والذاكرة">
    - يُنسخ محتوى `CLAUDE.md` و`.claude/CLAUDE.md` الخاص بالمشروع أو يُلحق في `AGENTS.md` ضمن مساحة عمل وكيل OpenClaw.
    - يُلحق محتوى `~/.claude/CLAUDE.md` الخاص بالمستخدم في `USER.md` ضمن مساحة العمل.

  </Accordion>
  <Accordion title="خوادم MCP">
    تُستورد تعريفات خوادم MCP من `.mcp.json` الخاص بالمشروع، وملف حالة Claude Code `~/.claude.json`، وملف Claude Desktop `claude_desktop_config.json` عند وجودها.
  </Accordion>
  <Accordion title="Skills والأوامر">
    - تُنسخ مهارات Claude التي تحتوي على ملف `SKILL.md` إلى دليل مهارات مساحة عمل OpenClaw.
    - تُحوّل ملفات Markdown الخاصة بأوامر Claude ضمن `.claude/commands/` أو `~/.claude/commands/` إلى مهارات OpenClaw مع `disable-model-invocation: true`.

  </Accordion>
</AccordionGroup>

## ما يبقى للأرشيف فقط

ينسخ الموفر هذه العناصر إلى تقرير الترحيل للمراجعة اليدوية، لكنه **لا** يحمّلها في إعداد OpenClaw الحي:

- خطافات Claude
- أذونات Claude وقوائم السماح الواسعة للأدوات
- الإعدادات الافتراضية لبيئة Claude
- `CLAUDE.local.md`
- `.claude/rules/`
- الوكلاء الفرعيون لـ Claude ضمن `.claude/agents/` أو `~/.claude/agents/`
- أدلة ذاكرات التخزين المؤقت والخطط وسجل المشاريع في Claude Code
- إضافات Claude Desktop وبيانات الاعتماد المخزنة في نظام التشغيل

يرفض OpenClaw تنفيذ الخطافات، أو الوثوق بقوائم السماح للأذونات، أو فك ترميز حالة OAuth وبيانات اعتماد Desktop المعتمة تلقائيًا. انقل ما تحتاج إليه يدويًا بعد مراجعة الأرشيف.

## اختيار المصدر

من دون `--from`، يفحص OpenClaw منزل Claude Code الافتراضي في `~/.claude`، وملف حالة Claude Code النموذجي `~/.claude.json`، وإعداد MCP الخاص بـ Claude Desktop على macOS.

عندما يشير `--from` إلى جذر مشروع، يستورد OpenClaw ملفات Claude الخاصة بذلك المشروع فقط، مثل `CLAUDE.md`، و`.claude/settings.json`، و`.claude/commands/`، و`.claude/skills/`، و`.mcp.json`. ولا يقرأ منزل Claude العام لديك أثناء استيراد جذر مشروع.

## التدفق الموصى به

<Steps>
  <Step title="معاينة الخطة">
    ```bash
    openclaw migrate claude --dry-run
    ```

    تسرد الخطة كل ما سيتغير، بما في ذلك التعارضات، والعناصر المتخطاة، والقيم الحساسة المحجوبة من حقول MCP المتداخلة `env` أو `headers`.

  </Step>
  <Step title="التطبيق مع نسخة احتياطية">
    ```bash
    openclaw migrate apply claude --yes
    ```

    ينشئ OpenClaw نسخة احتياطية ويتحقق منها قبل التطبيق.

  </Step>
  <Step title="تشغيل doctor">
    ```bash
    openclaw doctor
    ```

    يتحقق [Doctor](/ar/gateway/doctor) من مشكلات الإعداد أو الحالة بعد الاستيراد.

  </Step>
  <Step title="إعادة التشغيل والتحقق">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    تأكد من أن Gateway سليم وأن التعليمات وخوادم MCP والمهارات المستوردة قد حُمّلت.

  </Step>
</Steps>

## التعامل مع التعارضات

يرفض التطبيق المتابعة عندما تبلغ الخطة عن تعارضات (وجود ملف أو قيمة إعداد بالفعل في الهدف).

<Warning>
أعد التشغيل مع `--overwrite` فقط عندما يكون استبدال الهدف الحالي مقصودًا. قد يستمر الموفرون في كتابة نسخ احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
</Warning>

بالنسبة إلى تثبيت OpenClaw جديد، تكون التعارضات غير معتادة. تظهر عادةً عندما تعيد تشغيل الاستيراد على إعداد يحتوي بالفعل على تعديلات للمستخدم.

## مخرجات JSON للأتمتة

```bash
openclaw migrate claude --dry-run --json
openclaw migrate apply claude --json --yes
```

مع `--json` ومن دون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة. هذا هو الوضع الأكثر أمانًا لـ CI والسكربتات المشتركة.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="حالة Claude موجودة خارج ~/.claude">
    مرّر `--from /actual/path` (CLI) أو `--import-source /actual/path` (الإعداد الأولي).
  </Accordion>
  <Accordion title="الإعداد الأولي يرفض الاستيراد على إعداد موجود">
    تتطلب عمليات استيراد الإعداد الأولي إعدادًا جديدًا. إما أن تعيد ضبط الحالة وتعيد الإعداد الأولي، أو تستخدم `openclaw migrate apply claude` مباشرةً، فهو يدعم `--overwrite` والتحكم الصريح في النسخ الاحتياطي.
  </Accordion>
  <Accordion title="لم تُستورد خوادم MCP من Claude Desktop">
    يقرأ Claude Desktop ملف `claude_desktop_config.json` من مسار خاص بالمنصة. وجّه `--from` إلى دليل ذلك الملف إذا لم يكتشفه OpenClaw تلقائيًا.
  </Accordion>
  <Accordion title="تحولت أوامر Claude إلى مهارات مع تعطيل استدعاء النموذج">
    هذا مقصود. أوامر Claude يطلقها المستخدم، لذلك يستوردها OpenClaw كمهارات مع `disable-model-invocation: true`. عدّل frontmatter لكل مهارة إذا كنت تريد من الوكيل استدعاءها تلقائيًا.
  </Accordion>
</AccordionGroup>

## ذو صلة

- [`openclaw migrate`](/ar/cli/migrate): مرجع CLI الكامل، وعقد Plugin، وأشكال JSON.
- [دليل الترحيل](/ar/install/migrating): جميع مسارات الترحيل.
- [الترحيل من Hermes](/ar/install/migrating-hermes): مسار الاستيراد الآخر عبر الأنظمة.
- [الإعداد الأولي](/ar/cli/onboard): تدفق المعالج والرايات غير التفاعلية.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد الترحيل.
- [مساحة عمل الوكيل](/ar/concepts/agent-workspace): حيث توجد `AGENTS.md`، و`USER.md`، والمهارات.

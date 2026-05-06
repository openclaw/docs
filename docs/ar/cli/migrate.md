---
read_when:
    - تريد الترحيل من Hermes أو من نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-05-06T07:45:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021d673f6e51f5c2320278f0a37830c9aa34cdb4628932be1c09714c375066e3
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر عبر مزود ترحيل مملوك لـ Plugin. تغطي المزودات المضمنة حالة Codex CLI و[Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ Plugins الجهات الخارجية تسجيل مزودات إضافية.

<Tip>
للحصول على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) كل المسارات.
</Tip>

## الأوامر

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  اسم مزود ترحيل مسجل، مثل `hermes`. شغّل `openclaw migrate list` لرؤية المزودات المثبتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  ابنِ الخطة واخرج دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes افتراضيًا `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة. معطّل افتراضيًا.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدّد عنصر نسخ Skills واحدًا باسم Skills أو معرّف العنصر. كرّر العلامة لترحيل Skills متعددة. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدد مربعات اختيار، وتحتفظ عمليات الترحيل غير التفاعلية بكل Skills المخطط لها.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخة الاحتياطية قبل التطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب مع `--no-backup` عندما يرفض التطبيق بخلاف ذلك تخطي النسخ الاحتياطي.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بتنسيق JSON. مع `--json` ودون `--yes`، يطبع التطبيق الخطة ولا يغير الحالة.
</ParamField>

## نموذج السلامة

`openclaw migrate` يعتمد المعاينة أولًا.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد المزود خطة مفصلة قبل أن يتغير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو سرية مثل مفاتيح API والرموز المميزة وترويسات التفويض وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم ضبط `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن أن يستمر الترحيل. لتخطي نسخة احتياطية عند وجود حالة، مرّر كلًا من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل مع `--overwrite` إذا كان استبدال الأهداف الموجودة مقصودًا. قد تظل المزودات تكتب نسخًا احتياطية على مستوى العنصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    لا يتم استيراد الأسرار افتراضيًا أبدًا. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## مزود Claude

يكتشف مزود Claude المضمن حالة Claude Code في `~/.claude` افتراضيًا. استخدم `--from <path>` لاستيراد منزل Claude Code محدد أو جذر مشروع محدد.

<Tip>
للحصول على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- `CLAUDE.md` الخاص بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `~/.claude/CLAUDE.md` الخاص بالمستخدم إلى `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع و`~/.claude.json` الخاص بـ Claude Code و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- ملفات Markdown لأوامر Claude محولة إلى Skills في OpenClaw مع الاستدعاء اليدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

تُحفظ خطافات Claude والأذونات وافتراضيات البيئة والذاكرة المحلية والقواعد المقيدة بالمسار والوكلاء الفرعيون وذاكرات التخزين المؤقت والخطط وسجل المشروع في تقرير الترحيل أو يُبلغ عنها كعناصر مراجعة يدوية. لا ينفذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد حالة بيانات اعتماد OAuth/Desktop تلقائيًا.

## مزود Codex

يكتشف مزود Codex المضمن حالة Codex CLI في `~/.codex` افتراضيًا، أو
في `CODEX_HOME` عند ضبط متغير البيئة هذا. استخدم `--from <path>` من أجل
جرد منزل Codex محدد.

استخدم هذا المزود عند الانتقال إلى حاضنة OpenClaw Codex وتريد
ترقية أصول Codex CLI الشخصية المفيدة بصورة مقصودة. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية
أدلة `CODEX_HOME` و`HOME` خاصة بكل وكيل، لذلك لا تقرأ
حالة Codex CLI الشخصية افتراضيًا.

يعرض تشغيل `openclaw migrate codex` في طرفية تفاعلية الخطة الكاملة
للمعاينة، ثم يفتح محدد مربعات اختيار لعناصر نسخ Skills قبل
تأكيد التطبيق النهائي. استخدم `Toggle all on` أو `Toggle all off` للتحديد بالجملة؛
تبدأ Skills المخطط لها محددة، وتبدأ Skills المتعارضة غير محددة، ويترك `Skip for now`
Skills دون تغيير ودون تطبيق. للتشغيل البرمجي أو الدقيق، مرّر
`--skill <name>` مرة واحدة لكل Skills، على سبيل المثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI ضمن `$CODEX_HOME/skills`، مع استثناء ذاكرة التخزين المؤقت
  `.system` الخاصة بـ Codex.
- AgentSkills الشخصية ضمن `$HOME/.agents/skills`، منسوخة إلى مساحة عمل
  وكيل OpenClaw الحالية عندما تريد ملكية لكل وكيل.

### حالة Codex للمراجعة اليدوية

لا يتم تفعيل Plugins الأصلية لـ Codex و`config.toml` و`hooks/hooks.json` الأصلية
تلقائيًا. قد تعرض Plugins خوادم MCP أو تطبيقات أو خطافات أو سلوكًا
تنفيذيًا آخر، لذلك يبلغ المزود عنها للمراجعة بدلًا من تحميلها
في OpenClaw. تُنسخ ملفات الإعدادات والخطافات إلى تقرير الترحيل
للمراجعة اليدوية.

## مزود Hermes

يكتشف مزود Hermes المضمن الحالة في `~/.hermes` افتراضيًا. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعداد النموذج الافتراضي من `config.yaml`.
- مزودو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة مساحة العمل.
- افتراضيات إعداد الذاكرة لذاكرة ملفات OpenClaw، بالإضافة إلى عناصر أرشفة أو مراجعة يدوية لمزودي ذاكرة خارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` ضمن `skills/<name>/`.
- قيم إعدادات كل Skills من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة الأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في إعدادات OpenClaw الحية أو بيانات الاعتماد. يحافظ هذا على الحالة المبهمة أو غير الآمنة دون الادعاء بأن OpenClaw يستطيع تنفيذها أو الوثوق بها تلقائيًا:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `auth.json`
- `state.db`

### بعد التطبيق

```bash
openclaw doctor
```

## عقد Plugin

مصادر الترحيل هي Plugins. يعلن Plugin عن معرّفات مزوده في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي Plugin ‏`api.registerMigrationProvider(...)`. ينفذ المزود `detect` و`plan` و`apply`. يملك النواة تنسيق CLI وسياسة النسخ الاحتياطي والمطالبات ومخرجات JSON والفحص المسبق للتعارضات. تمرر النواة الخطة المراجعة إلى `apply(ctx, plan)`، وقد تعيد المزودات بناء الخطة فقط عندما تكون تلك الوسيطة غير موجودة للتوافق.

يمكن لـ Plugins المزودات استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وأعداد الملخصات، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات الواعية بالتعارضات ونسخ تقارير الأرشفة فقط ومغلفات وقت تشغيل الإعدادات المخزنة مؤقتًا وتقارير الترحيل.

## تكامل الإعداد الأولي

يمكن أن يعرض الإعداد الأولي الترحيل عندما يكتشف مزود مصدرًا معروفًا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` مزود ترحيل Plugin نفسه، ولا يزالان يعرضان معاينة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديدًا. أعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. عمليات الاستيراد بنسخ احتياطي مع استبدال أو بالدمج محكومة ببوابة ميزات للإعدادات الموجودة.
</Note>

## ذات صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): إرشادات موجهة للمستخدم.
- [الترحيل من Claude](/ar/install/migrating-claude): إرشادات موجهة للمستخدم.
- [الترحيل](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص الصحة بعد تطبيق ترحيل.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

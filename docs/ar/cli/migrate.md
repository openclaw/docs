---
read_when:
    - تريد الترحيل من Hermes أو نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-04-30T20:05:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffcd9e874bdaa0a5195e712d4fccd7b3d53034cb362c7f7462e9c7df72477b1a
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورِد الحالة من نظام وكيل آخر عبر موفّر ترحيل مملوك لـ Plugin. تغطي الموفّرات المضمّنة حالة Codex CLI، و[Claude](/ar/install/migrating-claude)، و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ Plugins الجهات الخارجية تسجيل موفّرات إضافية.

<Tip>
للحصول على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) جميع المسارات.
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
  اسم موفّر ترحيل مسجّل، مثل `hermes`. شغّل `openclaw migrate list` لرؤية الموفّرات المثبّتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  ابنِ الخطة واخرج من دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes افتراضيًا `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورِد بيانات الاعتماد المدعومة. متوقف افتراضيًا.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلّغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدّد عنصر نسخ Skills واحدًا حسب اسم Skills أو معرّف العنصر. كرّر العلامة لترحيل عدة Skills. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدد مربعات اختيار، وتحتفظ عمليات الترحيل غير التفاعلية بكل Skills المخطط لها.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخ الاحتياطي قبل التطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب بجانب `--no-backup` عندما يرفض التطبيق تخطي النسخ الاحتياطي خلاف ذلك.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بصيغة JSON. مع `--json` ومن دون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة.
</ParamField>

## نموذج الأمان

`openclaw migrate` يعتمد على المعاينة أولًا.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد الموفّر خطة مفصلة حسب العناصر قبل أن يتغير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو كأسرار، مثل مفاتيح API والرموز المميزة وترويسات التخويل وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم تعيين `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن للترحيل المتابعة. لتخطي نسخة احتياطية عند وجود الحالة، مرّر كلًا من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل مع `--overwrite` إذا كان استبدال الأهداف الموجودة مقصودًا. قد تظل الموفّرات تكتب نسخًا احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    لا يتم استيراد الأسرار افتراضيًا أبدًا. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## موفّر Claude

يكتشف موفّر Claude المضمّن حالة Claude Code في `~/.claude` افتراضيًا. استخدم `--from <path>` لاستيراد مجلد Claude Code الرئيسي أو جذر مشروع محدد.

<Tip>
للحصول على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- ملفات `CLAUDE.md` الخاصة بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- تتم إضافة `~/.claude/CLAUDE.md` الخاص بالمستخدم إلى `USER.md` في مساحة العمل.
- تعريفات خوادم MCP من `.mcp.json` الخاص بالمشروع، و`~/.claude.json` في Claude Code، و`claude_desktop_config.json` في Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- ملفات Markdown لأوامر Claude محوّلة إلى Skills في OpenClaw مع الاستدعاء اليدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

تُحفظ خطافات Claude والأذونات وافتراضيات البيئة والذاكرة المحلية والقواعد المقيدة بالمسار والوكلاء الفرعيون وذاكرات التخزين المؤقت والخطط وسجل المشروع في تقرير الترحيل أو تُبلّغ كعناصر تتطلب مراجعة يدوية. لا ينفّذ OpenClaw الخطافات، ولا ينسخ قوائم سماح واسعة، ولا يستورد حالة بيانات اعتماد OAuth/Desktop تلقائيًا.

## موفّر Codex

يكتشف موفّر Codex المضمّن حالة Codex CLI في `~/.codex` افتراضيًا، أو
في `CODEX_HOME` عندما يتم تعيين متغير البيئة هذا. استخدم `--from <path>`
لجرد مجلد Codex رئيسي محدد.

استخدم هذا الموفّر عند الانتقال إلى حزمة تشغيل OpenClaw Codex وعندما تريد
ترقية أصول Codex CLI الشخصية المفيدة بصورة مقصودة. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي
أدلة `CODEX_HOME` و`HOME` خاصة بكل وكيل، لذلك لا تقرأ
حالة Codex CLI الشخصية الخاصة بك افتراضيًا.

تشغيل `openclaw migrate codex` في طرفية تفاعلية يعاين الخطة الكاملة،
ثم يفتح محدد مربعات اختيار لعناصر نسخ Skills قبل تأكيد التطبيق النهائي.
تبدأ كل Skills محددة؛ ألغِ تحديد أي Skills لا تريد نسخها
إلى هذا الوكيل. للتشغيلات النصية أو الدقيقة، مرّر `--skill <name>` مرة
لكل Skills، على سبيل المثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI ضمن `$CODEX_HOME/skills`، مع استثناء ذاكرة التخزين المؤقت
  `.system` الخاصة بـ Codex.
- AgentSkills الشخصية ضمن `$HOME/.agents/skills`، منسوخة إلى مساحة عمل وكيل
  OpenClaw الحالية عندما تريد ملكية لكل وكيل.

### حالة Codex التي تتطلب مراجعة يدوية

لا يتم تفعيل Plugins الأصلية في Codex، و`config.toml`، و`hooks/hooks.json` الأصلية
تلقائيًا. قد تكشف Plugins خوادم MCP أو تطبيقات أو خطافات أو سلوكًا تنفيذيًا آخر،
لذلك يبلّغ عنها الموفّر للمراجعة بدلًا من تحميلها
في OpenClaw. تُنسخ ملفات الإعدادات والخطافات إلى تقرير الترحيل
للمراجعة اليدوية.

## موفّر Hermes

يكتشف موفّر Hermes المضمّن الحالة في `~/.hermes` افتراضيًا. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعداد النموذج الافتراضي من `config.yaml`.
- موفّرو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- تتم إضافة `memories/MEMORY.md` و`memories/USER.md` إلى ملفات ذاكرة مساحة العمل.
- افتراضيات إعداد الذاكرة لذاكرة ملفات OpenClaw، بالإضافة إلى عناصر أرشفة أو مراجعة يدوية لموفّري الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` ضمن `skills/<name>/`.
- قيم إعداد لكل Skills من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة الأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في إعدادات OpenClaw الحية أو بيانات الاعتماد. يحفظ هذا الحالة المعتمة أو غير الآمنة من دون الادعاء بأن OpenClaw يمكنه تنفيذها أو الوثوق بها تلقائيًا:

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

مصادر الترحيل هي Plugins. يعلن Plugin عن معرّفات موفّريه في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي Plugin `api.registerMigrationProvider(...)`. ينفّذ الموفّر `detect` و`plan` و`apply`. يملك Core تنسيق CLI، وسياسة النسخ الاحتياطي، والمطالبات، ومخرجات JSON، والفحص المسبق للتعارضات. يمرّر Core الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، وقد تعيد الموفّرات بناء الخطة فقط عندما تكون تلك الوسيطة غائبة للتوافق.

يمكن لـ Plugins الموفّر استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وعدّادات الملخص، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات مع مراعاة التعارضات، ونسخ التقارير المخصصة للأرشفة فقط، ومغلفات وقت تشغيل الإعدادات المخزّنة مؤقتًا، وتقارير الترحيل.

## تكامل الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف موفّر مصدرًا معروفًا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفّر ترحيل Plugin نفسه، ويظلان يعرضان معاينة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديدًا. أعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. عمليات الاستيراد بنسخة احتياطية مع استبدال أو الدمج مقيدة بميزة للإعدادات الموجودة.
</Note>

## ذات صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): إرشادات موجهة للمستخدم.
- [الترحيل من Claude](/ar/install/migrating-claude): إرشادات موجهة للمستخدم.
- [الترحيل](/ar/install/migrating): انقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق ترحيل.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

---
read_when:
    - تريد الترحيل من Hermes أو من نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-04-30T07:49:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: d3db14c16b8f9dcbf86a4f12558cf4e8555aa9a255637034fb804148996a225e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر عبر موفّر ترحيل مملوك لـ plugin. تغطي الموفّرات المضمّنة [Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ plugins خارجية تسجيل موفّرات إضافية.

<Tip>
للاطلاع على الشروحات الموجّهة للمستخدمين، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) كل المسارات.
</Tip>

## الأوامر

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
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
  أنشئ الخطة واخرج من دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. الإعداد الافتراضي لـ Hermes هو `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة. متوقف افتراضياً.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلّغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخ الاحتياطي قبل التطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب مع `--no-backup` عندما يرفض التطبيق خلاف ذلك تخطي النسخ الاحتياطي.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بصيغة JSON. مع `--json` ومن دون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة.
</ParamField>

## نموذج السلامة

`openclaw migrate` يعتمد المعاينة أولاً.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد الموفّر خطة مفصلة قبل أن يتغير أي شيء، بما في ذلك التعارضات، والعناصر المتخطاة، والعناصر الحساسة. تحجب خطط JSON، ومخرجات التطبيق، وتقارير الترحيل المفاتيح المتداخلة التي تبدو سرية، مثل مفاتيح API، والرموز، وترويسات التفويض، وملفات تعريف الارتباط، وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم تعيين `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن للترحيل المتابعة. لتخطي نسخة احتياطية عند وجود حالة، مرّر كلاً من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تتضمن الخطة تعارضات. راجع الخطة، ثم أعد التشغيل مع `--overwrite` إذا كان استبدال الأهداف الموجودة مقصوداً. قد تظل الموفّرات تكتب نسخاً احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    لا يتم استيراد الأسرار افتراضياً مطلقاً. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## موفّر Claude

يكتشف موفّر Claude المضمّن حالة Claude Code في `~/.claude` افتراضياً. استخدم `--from <path>` لاستيراد موطن Claude Code محدد أو جذر مشروع محدد.

<Tip>
للاطلاع على شرح موجّه للمستخدمين، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- `CLAUDE.md` الخاص بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- تتم إضافة `~/.claude/CLAUDE.md` الخاص بالمستخدم إلى `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع، و`~/.claude.json` الخاص بـ Claude Code، و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- ملفات Markdown الخاصة بأوامر Claude المحوّلة إلى Skills في OpenClaw مع استدعاء يدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

يتم الاحتفاظ بخطافات Claude، والأذونات، وافتراضيات البيئة، والذاكرة المحلية، والقواعد المقيّدة بالمسار، والوكلاء الفرعيين، وذاكرات التخزين المؤقت، والخطط، وسجل المشروع في تقرير الترحيل أو الإبلاغ عنها كعناصر للمراجعة اليدوية. لا ينفّذ OpenClaw الخطافات، ولا ينسخ قوائم سماح واسعة، ولا يستورد حالة اعتماد OAuth/Desktop تلقائياً.

## موفّر Hermes

يكتشف موفّر Hermes المضمّن الحالة في `~/.hermes` افتراضياً. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعدادات النموذج الافتراضية من `config.yaml`.
- موفّرو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- تتم إضافة `memories/MEMORY.md` و`memories/USER.md` إلى ملفات ذاكرة مساحة العمل.
- افتراضيات إعدادات الذاكرة لذاكرة ملفات OpenClaw، بالإضافة إلى عناصر أرشفة أو مراجعة يدوية لموفّري الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` ضمن `skills/<name>/`.
- قيم الإعدادات لكل Skill من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة للأرشفة فقط

يتم نسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في إعدادات OpenClaw الحية أو بيانات اعتماده. يحافظ هذا على الحالة المعتمة أو غير الآمنة من دون الادعاء بأن OpenClaw يمكنه تنفيذها أو الوثوق بها تلقائياً:

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

مصادر الترحيل هي plugins. يعلن plugin عن معرّفات موفّريه في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي plugin الدالة `api.registerMigrationProvider(...)`. ينفّذ الموفّر `detect` و`plan` و`apply`. يمتلك Core تنسيق CLI، وسياسة النسخ الاحتياطي، والمطالبات، ومخرجات JSON، والفحص المسبق للتعارضات. يمرر Core الخطة المُراجعة إلى `apply(ctx, plan)`، وقد يعيد الموفّرون بناء الخطة فقط عندما تكون تلك الوسيطة غائبة لأغراض التوافق.

يمكن لـ plugins الموفّرة استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وعدّادات الملخص، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات الواعي بالتعارضات، ونسخ تقارير الأرشفة فقط، ومغلّفات وقت تشغيل الإعدادات المخزنة مؤقتاً، وتقارير الترحيل.

## التكامل مع الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف موفّر مصدراً معروفاً. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفّر ترحيل plugin نفسه، ويظلان يعرضان معاينة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديداً. أعد ضبط الإعدادات، وبيانات الاعتماد، والجلسات، ومساحة العمل أولاً إذا كانت لديك حالة محلية بالفعل. عمليات الاستيراد بنسخ احتياطي مع استبدال أو دمج محكومة ببوابة ميزات للإعدادات الموجودة.
</Note>

## ذات صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): شرح موجّه للمستخدمين.
- [الترحيل من Claude](/ar/install/migrating-claude): شرح موجّه للمستخدمين.
- [الترحيل](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق ترحيل.
- [Plugins](/ar/tools/plugin): تثبيت plugin وتسجيله.

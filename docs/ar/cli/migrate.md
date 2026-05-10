---
read_when:
    - تريد الانتقال من Hermes أو نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-05-10T19:31:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb32f993d2412a97a1f91bf3f2b3ca1a653d1db3db75aa90d3b834bdc6acbb95
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورِد الحالة من نظام وكيل آخر عبر مزوّد ترحيل يملكه Plugin. تغطي المزوّدات المضمّنة حالة Codex CLI و[Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن للـ plugins الخارجية تسجيل مزوّدات إضافية.

<Tip>
للحصول على إرشادات تفصيلية موجّهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) كل المسارات.
</Tip>

## الأوامر

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate hermes --dry-run
openclaw migrate hermes
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --plugin google-calendar
openclaw migrate apply codex --yes
openclaw migrate apply claude --yes
openclaw migrate apply hermes --yes
openclaw migrate apply hermes --include-secrets --yes
openclaw onboard --flow import
openclaw onboard --import-from claude --import-source ~/.claude
openclaw onboard --import-from hermes --import-source ~/.hermes
```

<ParamField path="<provider>" type="string">
  اسم مزوّد ترحيل مسجّل، مثل `hermes`. شغّل `openclaw migrate list` للاطلاع على المزوّدات المثبّتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  أنشئ الخطة واخرج دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes افتراضياً `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورِد بيانات الاعتماد المدعومة. معطّل افتراضياً.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلّغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدّد عنصر نسخ مهارة واحداً باسم المهارة أو معرّف العنصر. كرّر العلامة لترحيل عدة Skills. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدّد مربعات اختيار، وتحتفظ عمليات الترحيل غير التفاعلية بكل Skills المخططة.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  حدّد عنصر تثبيت Plugin واحد في Codex باسم الـ plugin أو معرّف العنصر. كرّر العلامة لترحيل عدة plugins في Codex. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدّد مربعات اختيار أصلياً لـ Codex plugin، وتحتفظ عمليات الترحيل غير التفاعلية بكل plugins المخططة. ينطبق هذا فقط على plugins Codex من `openai-curated` المثبّتة من المصدر التي يكتشفها مخزون خادم تطبيق Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخ الاحتياطي السابق للتطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب مع `--no-backup` عندما كان التطبيق سيرفض تخطي النسخ الاحتياطي بخلاف ذلك.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بصيغة JSON. مع `--json` وبدون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة.
</ParamField>

## نموذج الأمان

`openclaw migrate` يعتمد المعاينة أولاً.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد المزوّد خطة مفصلة بالعناصر قبل أن يتغير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو كأسرار، مثل مفاتيح API والرموز المميزة ورؤوس التفويض وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم ضبط `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن للترحيل المتابعة. لتخطي النسخ الاحتياطي عند وجود حالة، مرّر كلاً من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل باستخدام `--overwrite` إذا كان استبدال الأهداف الموجودة مقصوداً. قد تظل المزوّدات تكتب نسخاً احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    لا تُستورد الأسرار افتراضياً مطلقاً. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## مزوّد Claude

يكتشف مزوّد Claude المضمّن حالة Claude Code في `~/.claude` افتراضياً. استخدم `--from <path>` لاستيراد منزل Claude Code أو جذر مشروع محدد.

<Tip>
للحصول على إرشادات تفصيلية موجّهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- `CLAUDE.md` الخاص بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `~/.claude/CLAUDE.md` الخاص بالمستخدم بـ `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع، و`~/.claude.json` الخاص بـ Claude Code، و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- ملفات Markdown الخاصة بأوامر Claude محوّلة إلى Skills في OpenClaw مع استدعاء يدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

تُحفظ خطافات Claude والأذونات وافتراضيات البيئة والذاكرة المحلية والقواعد المحددة بالنطاق حسب المسار والوكلاء الفرعيون وذاكرات التخزين المؤقت والخطط وسجل المشروع في تقرير الترحيل أو تُبلّغ كعناصر للمراجعة اليدوية. لا ينفّذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد حالة بيانات اعتماد OAuth/Desktop تلقائياً.

## مزوّد Codex

يكتشف مزوّد Codex المضمّن حالة Codex CLI في `~/.codex` افتراضياً، أو
في `CODEX_HOME` عند ضبط متغير البيئة هذا. استخدم `--from <path>` من أجل
جرد منزل Codex محدد.

استخدم هذا المزوّد عند الانتقال إلى مشغّل Codex في OpenClaw وعندما تريد
ترقية أصول Codex CLI الشخصية المفيدة بشكل متعمّد. تستخدم عمليات إطلاق خادم
تطبيق Codex المحلية أدلة `CODEX_HOME` و`HOME` لكل وكيل، ولذلك لا تقرأ
حالة Codex CLI الشخصية الخاصة بك افتراضياً.

تشغيل `openclaw migrate codex` في طرفية تفاعلية يعاين الخطة الكاملة،
ثم يفتح محددات مربعات اختيار قبل تأكيد التطبيق النهائي. تتم المطالبة
بعناصر نسخ Skills أولاً. استخدم `Toggle all on` أو `Toggle all off` للاختيار
الجماعي؛ تبدأ Skills المخططة محددة، وتبدأ Skills المتعارضة غير محددة، و
`Skip for now` يتخطى نسخ Skills لهذا التشغيل مع الاستمرار إلى اختيار الـ plugin.
عندما تكون plugins Codex المنسقة والمثبّتة من المصدر قابلة للترحيل ولم يتم
تقديم `--plugin`، يطالب الترحيل بعد ذلك بتفعيل Codex plugin الأصلي حسب اسم
الـ plugin. تبدأ عناصر Plugin محددة ما لم يكن إعداد OpenClaw Codex plugin
الهدف يحتوي ذلك الـ plugin بالفعل. تبدأ plugins الهدف الموجودة غير محددة
وتعرض تلميح تعارض مثل `conflict: plugin exists`؛ اختر `Toggle all off`
لعدم ترحيل أي plugins Codex أصلية في ذلك التشغيل، أو `Skip for now`
للتوقف قبل التطبيق. للتشغيلات النصية أو الدقيقة، مرّر `--skill <name>` مرة
لكل مهارة، على سبيل المثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

استخدم `--plugin <name>` لحصر ترحيل Codex plugin الأصلي غير التفاعلي
في plugin واحد أو أكثر من plugins المنسقة المثبّتة من المصدر:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI تحت `$CODEX_HOME/skills`، باستثناء ذاكرة
  التخزين المؤقت `.system` الخاصة بـ Codex.
- AgentSkills الشخصية تحت `$HOME/.agents/skills`، منسوخة إلى مساحة عمل وكيل
  OpenClaw الحالية عندما تريد ملكية لكل وكيل.
- plugins Codex من `openai-curated` المثبّتة من المصدر، والمكتشفة عبر
  `plugin/list` في خادم تطبيق Codex. يستدعي التطبيق `plugin/install` في
  خادم التطبيق لكل plugin محدد، حتى إذا كان خادم التطبيق الهدف يبلّغ بالفعل
  أن ذلك الـ plugin مثبّت ومفعّل. لا تكون plugins Codex المرحّلة قابلة
  للاستخدام إلا في الجلسات التي تختار مشغّل Codex الأصلي؛ ولا تُعرض على Pi،
  أو تشغيلات مزوّد OpenAI العادية، أو روابط محادثات ACP، أو المشغّلات الأخرى.

### حالة Codex للمراجعة اليدوية

لا يتم تفعيل `config.toml` الخاص بـ Codex، و`hooks/hooks.json` الأصلي، والأسواق غير المنسقة،
وحزم plugins المخزنة مؤقتاً التي ليست plugins منسقة مثبّتة من المصدر
تلقائياً. تُنسخ أو تُبلّغ في تقرير الترحيل للمراجعة اليدوية.

بالنسبة إلى plugins المنسقة المثبّتة من المصدر والمرحّلة، يكتب التطبيق:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: false`
- إدخال plugin صريح واحد مع `marketplaceName: "openai-curated"` و
  `pluginName` لكل plugin محدد

لا يكتب الترحيل أبداً `plugins["*"]` ولا يخزّن مسارات ذاكرة التخزين المؤقت
للسوق المحلي. تُبلّغ عمليات التثبيت التي تتطلب مصادقة على عنصر الـ plugin
المتأثر مع `status: "skipped"` و`reason: "auth_required"` ومعرّفات تطبيق
منقّاة. تُكتب إدخالات الإعداد الصريحة الخاصة بها معطّلة إلى أن تعيد التفويض
وتفعّلها. تكون إخفاقات التثبيت الأخرى نتائج `error` محددة بنطاق العنصر.

إذا كان مخزون plugins في خادم تطبيق Codex غير متاح أثناء التخطيط، يعود
الترحيل إلى عناصر استشارية للحزم المخزنة مؤقتاً بدلاً من إفشال الترحيل كله.

## مزوّد Hermes

يكتشف مزوّد Hermes المضمّن الحالة في `~/.hermes` افتراضياً. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعداد النموذج الافتراضي من `config.yaml`.
- مزوّدو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة مساحة العمل.
- افتراضيات إعداد الذاكرة لذاكرة الملفات في OpenClaw، بالإضافة إلى عناصر أرشفة أو مراجعة يدوية لمزوّدي الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` تحت `skills/<name>/`.
- قيم إعداد لكل مهارة من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة للأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في إعداد OpenClaw الحي أو بيانات الاعتماد. يحافظ ذلك على الحالة المعتمة أو غير الآمنة دون الادعاء بأن OpenClaw يمكنه تنفيذها أو الوثوق بها تلقائياً:

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

مصادر الترحيل هي plugins. يعلن الـ plugin عن معرّفات مزوّديه في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي الـ plugin `api.registerMigrationProvider(...)`. ينفّذ المزوّد `detect` و`plan` و`apply`. يملك core تنسيق CLI وسياسة النسخ الاحتياطي والمطالبات ومخرجات JSON وفحص التعارضات المسبق. يمرّر core الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، ويجوز للمزوّدين إعادة بناء الخطة فقط عندما تكون تلك الوسيطة غائبة من أجل التوافق.

يمكن لـ provider plugins استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وإحصاءات الملخص، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات الواعية بالتعارضات، ونسخ التقارير للأرشفة فقط، ومغلفات وقت تشغيل الإعداد المخزنة مؤقتاً، وتقارير الترحيل.

## تكامل الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف مزوّد مصدراً معروفاً. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` مزوّد ترحيل الـ plugin نفسه ويظل يعرض معاينة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديدًا. أعِد ضبط التكوين وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. عمليات الاستيراد بنسخ احتياطي مع استبدال، أو الدمج، مقيّدة بميزة للإعدادات الموجودة.
</Note>

## ذات صلة

- [الانتقال من Hermes](/ar/install/migrating-hermes): دليل تفصيلي موجه للمستخدم.
- [الانتقال من Claude](/ar/install/migrating-claude): دليل تفصيلي موجه للمستخدم.
- [الانتقال](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق انتقال.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

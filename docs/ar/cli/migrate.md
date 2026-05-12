---
read_when:
    - تريد الانتقال من Hermes أو نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-05-12T23:30:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5103a85404f0204cc265df611449e9cd4b18347c6862a8b36d13838709896459
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر عبر مزود ترحيل مملوك لـ Plugin. تغطي المزودات المضمّنة حالة Codex CLI و[Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ plugins الجهات الخارجية تسجيل مزودات إضافية.

<Tip>
للاطلاع على الإرشادات التفصيلية الموجهة للمستخدمين، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). تسرد [بوابة الترحيل](/ar/install/migrating) كل المسارات.
</Tip>

## الأوامر

```bash
openclaw migrate list
openclaw migrate claude --dry-run
openclaw migrate codex --dry-run
openclaw migrate codex --skill gog-vault77-google-workspace
openclaw migrate codex --plugin google-calendar --dry-run
openclaw migrate codex --plugin google-calendar --verify-plugin-apps --dry-run
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
  اسم مزود ترحيل مسجّل، مثل `hermes`. شغّل `openclaw migrate list` لرؤية المزودات المثبتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  ابنِ الخطة واخرج دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes افتراضيًا `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة. تكون متوقفة افتراضيًا.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الحالية عندما تبلغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدد عنصر نسخ مهارة واحدًا باسم المهارة أو معرّف العنصر. كرر العلامة لترحيل عدة مهارات. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدد مربعات اختيار، وتحتفظ عمليات الترحيل غير التفاعلية بكل المهارات المخططة.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  حدد عنصر تثبيت Plugin واحدًا في Codex باسم Plugin أو معرّف العنصر. كرر العلامة لترحيل عدة plugins من Codex. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدد مربعات اختيار Plugin أصلي في Codex، وتحتفظ عمليات الترحيل غير التفاعلية بكل plugins المخططة. ينطبق هذا فقط على plugins Codex المثبتة في المصدر من `openai-curated` التي يكتشفها مخزون خادم تطبيق Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  لـ Codex فقط. افرض اجتيازًا جديدًا لـ `app/list` من خادم تطبيق Codex المصدر قبل التخطيط لتفعيل Plugin الأصلي. يكون متوقفًا افتراضيًا للحفاظ على سرعة تخطيط الترحيل.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخة الاحتياطية قبل التطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب مع `--no-backup` عندما كان التطبيق سيرفض بخلاف ذلك تخطي النسخ الاحتياطي.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بتنسيق JSON. مع `--json` وبدون `--yes`، يطبع التطبيق الخطة ولا يغير الحالة.
</ParamField>

## نموذج السلامة

`openclaw migrate` يعرض المعاينة أولًا.

<AccordionGroup>
  <Accordion title="Preview before apply">
    يعيد المزود خطة مفصلة بالعناصر قبل تغيير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تقوم خطط JSON ومخرجات التطبيق وتقارير الترحيل بتنقيح المفاتيح المتداخلة التي تبدو كأسرار مثل مفاتيح API والرموز المميزة وترويسات التفويض وملفات تعريف الارتباط وكلمات المرور.

    يعرض `openclaw migrate apply <provider>` الخطة ويطالبك قبل تغيير الحالة ما لم يتم تعيين `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="Backups">
    ينشئ التطبيق نسخة OpenClaw احتياطية ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن أن يستمر الترحيل. لتخطي النسخ الاحتياطي عند وجود حالة، مرّر كلًا من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="Conflicts">
    يرفض التطبيق المتابعة عندما تتضمن الخطة تعارضات. راجع الخطة، ثم أعد التشغيل باستخدام `--overwrite` إذا كان استبدال الأهداف الحالية مقصودًا. قد تستمر المزودات في كتابة نسخ احتياطية على مستوى العنصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="Secrets">
    لا يتم استيراد الأسرار افتراضيًا أبدًا. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## مزود Claude

يكتشف مزود Claude المضمّن حالة Claude Code في `~/.claude` افتراضيًا. استخدم `--from <path>` لاستيراد منزل Claude Code محدد أو جذر مشروع محدد.

<Tip>
للاطلاع على إرشاد تفصيلي موجه للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- ملفات `CLAUDE.md` الخاصة بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- تتم إضافة ملف المستخدم `~/.claude/CLAUDE.md` إلى `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع و`~/.claude.json` الخاص بـ Claude Code و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة مهارات Claude التي تتضمن `SKILL.md`.
- ملفات Markdown لأوامر Claude المحوّلة إلى مهارات OpenClaw مع الاستدعاء اليدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

يتم حفظ خطافات Claude والأذونات وافتراضيات البيئة والذاكرة المحلية والقواعد المقيدة بالمسارات والوكلاء الفرعيين وذاكرات التخزين المؤقت والخطط وسجل المشروع في تقرير الترحيل، أو الإبلاغ عنها كعناصر مراجعة يدوية. لا ينفذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد حالة بيانات اعتماد OAuth/Desktop تلقائيًا.

## مزود Codex

يكتشف مزود Codex المضمّن حالة Codex CLI في `~/.codex` افتراضيًا، أو
في `CODEX_HOME` عندما يكون متغير البيئة هذا معيّنًا. استخدم `--from <path>` من أجل
جرد منزل Codex محدد.

استخدم هذا المزود عند الانتقال إلى حاضنة OpenClaw Codex وعندما تريد
ترقية أصول Codex CLI الشخصية المفيدة عمدًا. تستخدم عمليات تشغيل خادم تطبيق Codex المحلي
أدلة `CODEX_HOME` و`HOME` لكل وكيل، لذلك لا تقرأ
حالة Codex CLI الشخصية لديك افتراضيًا.

يعرض تشغيل `openclaw migrate codex` في طرفية تفاعلية الخطة الكاملة أولًا،
ثم يفتح محددات مربعات اختيار قبل تأكيد التطبيق النهائي. تتم المطالبة بعناصر
نسخ المهارات أولًا. استخدم `Toggle all on` أو `Toggle all off` للاختيار بالجملة.
اضغط Space لتبديل الصفوف، أو اضغط Enter لتنشيط الصف المظلل
والمتابعة. تبدأ المهارات المخططة محددة، وتبدأ المهارات المتعارضة غير محددة، و
`Skip for now` يتخطى نسخ المهارات لهذا التشغيل مع الاستمرار في اختيار Plugin.
عندما تكون plugins Codex المنسقة والمثبتة في المصدر قابلة للترحيل ولم يتم توفير
`--plugin`، يطلب الترحيل بعد ذلك تفعيل Plugin الأصلي في Codex
حسب اسم Plugin. تبدأ عناصر Plugin
محددة ما لم يكن تكوين Plugin الخاص بـ OpenClaw Codex الهدف يحتوي بالفعل على ذلك
Plugin. تبدأ plugins الهدف الحالية غير محددة وتعرض تلميح تعارض مثل
`conflict: plugin exists`؛ اختر `Toggle all off` لعدم ترحيل أي plugins Codex
أصلية في ذلك التشغيل، أو `Skip for now` للتوقف قبل التطبيق. للتشغيلات النصية أو
الدقيقة، مرّر `--skill <name>` مرة واحدة لكل مهارة، مثلًا:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

استخدم `--plugin <name>` لقصر ترحيل Plugin الأصلي في Codex بشكل غير تفاعلي
على Plugin واحد أو أكثر من plugins المنسقة المثبتة في المصدر:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### ما يستورده Codex

- أدلة مهارات Codex CLI تحت `$CODEX_HOME/skills`، باستثناء ذاكرة التخزين المؤقت
  `.system` الخاصة بـ Codex.
- AgentSkills الشخصية تحت `$HOME/.agents/skills`، وتُنسخ إلى مساحة عمل وكيل
  OpenClaw الحالية عندما تريد ملكية لكل وكيل.
- plugins Codex المثبتة في المصدر من `openai-curated` والمكتشفة عبر
  `plugin/list` في خادم تطبيق Codex. يقرأ التخطيط `plugin/read` لكل Plugin
  مثبت وممكّن. تتطلب plugins المدعومة بالتطبيق أن تكون استجابة حساب خادم تطبيق
  Codex المصدر حساب اشتراك ChatGPT؛ ويتم تخطي استجابات الحساب غير ChatGPT أو
  المفقودة مع `codex_subscription_required`. افتراضيًا، لا يستدعي الترحيل
  `app/list` المصدر، لذلك تُخطط plugins المدعومة بالتطبيق التي تجتاز بوابة
  الحساب دون تحقق من إمكانية الوصول إلى تطبيق المصدر، وتُتخطى إخفاقات نقل
  البحث عن الحساب مع `codex_account_unavailable`. مرّر `--verify-plugin-apps`
  عندما تريد أن يفرض الترحيل لقطة `app/list` جديدة من المصدر وأن يتطلب أن يكون
  كل تطبيق مملوك موجودًا وممكّنًا وقابلًا للوصول قبل التخطيط للتفعيل الأصلي.
  في ذلك الوضع، تمر إخفاقات نقل البحث عن الحساب إلى تحقق مخزون تطبيق المصدر.
  تُحفظ لقطة مخزون تطبيق المصدر في الذاكرة للعملية الحالية؛ ولا تُكتب في مخرجات
  الترحيل أو تكوين الهدف. تتحول plugins المعطلة وتفاصيل Plugin غير القابلة
  للقراءة والحسابات المصدر المقيدة بالاشتراك، وعند طلب التحقق، التطبيقات
  المفقودة أو المعطلة أو غير القابلة للوصول أو إخفاقات مخزون تطبيق المصدر، إلى
  عناصر متخطاة يدوية ذات أسباب مصنفة بدلًا من إدخالات تكوين الهدف.
  يستدعي التطبيق `plugin/install` في خادم التطبيق لكل Plugin مؤهل محدد،
  حتى إذا كان خادم التطبيق الهدف يبلغ بالفعل أن ذلك Plugin مثبت وممكّن.
  plugins Codex المرحلة قابلة للاستخدام فقط في الجلسات التي تحدد حاضنة Codex
  الأصلية؛ ولا تُعرض على Pi أو تشغيلات مزود OpenAI العادية أو روابط محادثات
  ACP أو الحاضنات الأخرى.

### حالة Codex للمراجعة اليدوية

لا يتم تلقائيًا تفعيل `config.toml` الخاص بـ Codex و`hooks/hooks.json` الأصلي
وأسواق الجهات غير المنسقة وحزم Plugin المخزنة مؤقتًا التي ليست plugins منسقة
مثبتة في المصدر وplugins المثبتة في المصدر التي تفشل في بوابة اشتراك المصدر.
عند تعيين `--verify-plugin-apps`، يتم أيضًا تخطي plugins التي تفشل في بوابة
مخزون تطبيق المصدر. يتم نسخها أو الإبلاغ عنها في تقرير الترحيل للمراجعة اليدوية.

بالنسبة إلى plugins المنسقة المثبتة في المصدر والمرحلة، يكتب التطبيق:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- إدخال Plugin صريح واحد مع `marketplaceName: "openai-curated"` و
  `pluginName` لكل Plugin محدد

لا يكتب الترحيل أبدًا `plugins["*"]` ولا يخزن مسارات ذاكرة التخزين المؤقت
للسوق المحلي. يتم الإبلاغ عن إخفاقات الاشتراك في جانب المصدر في العناصر اليدوية
مع أسباب مصنفة مثل `codex_subscription_required` أو `codex_account_unavailable`
أو `plugin_disabled` أو `plugin_read_unavailable`. مع `--verify-plugin-apps`،
يمكن أن تظهر إخفاقات مخزون تطبيق المصدر أيضًا بصفتها `app_inaccessible` أو
`app_disabled` أو `app_missing` أو `app_inventory_unavailable`. لا تُكتب plugins
المتخطاة في تكوين الهدف.
يتم الإبلاغ عن عمليات التثبيت التي تتطلب مصادقة في جانب الهدف على عنصر Plugin
المتأثر مع `status: "skipped"` و`reason: "auth_required"` ومعرّفات تطبيقات
منقحة. تُكتب إدخالات تكوينها الصريحة معطلة حتى تعيد التفويض وتفعّلها.
إخفاقات التثبيت الأخرى تكون نتائج `error` على مستوى العنصر.

إذا كان مخزون Plugin في خادم تطبيق Codex غير متاح أثناء التخطيط، يعود الترحيل
إلى عناصر إرشادية لحزم مخزنة مؤقتًا بدلًا من إفشال الترحيل بالكامل.

## مزود Hermes

يكتشف مزود Hermes المضمّن الحالة في `~/.hermes` افتراضيًا. استخدم `--from <path>` عندما يكون Hermes موجودًا في مكان آخر.

### ما يستورده Hermes

- تكوين النموذج الافتراضي من `config.yaml`.
- موفرو النماذج المكوّنون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- `memories/MEMORY.md` و`memories/USER.md` ملحقتان بملفات ذاكرة مساحة العمل.
- افتراضيات تكوين الذاكرة لذاكرة ملفات OpenClaw، إضافة إلى عناصر الأرشفة أو المراجعة اليدوية لموفري الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` تحت `skills/<name>/`.
- قيم التكوين لكل Skill من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة الأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في تكوين OpenClaw أو بيانات الاعتماد الحية. يحافظ هذا على الحالة المعتمة أو غير الآمنة دون الادعاء بأن OpenClaw يمكنه تنفيذها أو الوثوق بها تلقائيًا:

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

مصادر الترحيل هي Plugins. يعلن Plugin عن معرّفات موفريه في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي Plugin‏ `api.registerMigrationProvider(...)`. ينفّذ الموفر `detect` و`plan` و`apply`. يملك Core تنسيق CLI، وسياسة النسخ الاحتياطي، والمطالبات، ومخرجات JSON، والفحص المسبق للتعارضات. يمرر Core الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، ويمكن للموفرين إعادة بناء الخطة فقط عندما تكون تلك الوسيطة غائبة للتوافق.

يمكن لـ Provider plugins استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وعدّادات الملخص، إضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات المدركة للتعارضات، ونسخ تقارير الأرشفة فقط، ومغلفات config-runtime المخزنة مؤقتًا، وتقارير الترحيل.

## تكامل الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف موفر مصدرًا معروفًا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفر ترحيل Plugin نفسه، ويظلان يعرضان معاينة قبل التطبيق.

<Note>
تتطلب عمليات الاستيراد أثناء الإعداد الأولي إعداد OpenClaw جديدًا. أعد تعيين التكوين وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. تخضع عمليات الاستيراد بالنسخ الاحتياطي مع الاستبدال أو الدمج لبوابات ميزات للإعدادات الحالية.
</Note>

## ذات صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): شرح تفصيلي موجّه للمستخدم.
- [الترحيل من Claude](/ar/install/migrating-claude): شرح تفصيلي موجّه للمستخدم.
- [الترحيل](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق ترحيل.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

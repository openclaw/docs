---
read_when:
    - تريد الترحيل من Hermes أو من نظام وكيل آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: ترحيل
x-i18n:
    generated_at: "2026-06-27T17:23:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90798fd24af0984e485753e251c87a5dd8fd0246e7c135a50e3532de93ba075e
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر عبر موفر ترحيل مملوك من Plugin. تغطي الموفرات المضمنة حالة Codex CLI و[Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ plugins الجهات الخارجية تسجيل موفرات إضافية.

<Tip>
للاطلاع على إرشادات موجهة للمستخدمين، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) كل المسارات.
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
  اسم موفر ترحيل مسجل، مثل `hermes`. شغّل `openclaw migrate list` لرؤية الموفرات المثبتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  أنشئ الخطة واخرج بدون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes القيمة الافتراضية `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة بدون طلب تأكيد. يطلب التطبيق التفاعلي التأكيد قبل استيراد بيانات اعتماد المصادقة المكتشفة، مع اختيار نعم افتراضيا؛ ويتطلب `--yes` غير التفاعلي استخدام `--include-secrets` لاستيرادها.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  تخط استيراد بيانات اعتماد المصادقة، بما في ذلك المطالبة التفاعلية.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخط مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  اختر عنصر نسخ مهارة واحدا باسم المهارة أو معرف العنصر. كرر العلامة لترحيل عدة Skills. عند حذفها، تعرض ترحيلات Codex التفاعلية محدد خانات اختيار، وتحتفظ الترحيلات غير التفاعلية بكل Skills المخطط لها.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  اختر عنصر تثبيت Plugin واحدا في Codex باسم Plugin أو معرف العنصر. كرر العلامة لترحيل عدة plugins من Codex. عند حذفها، تعرض ترحيلات Codex التفاعلية محدد خانات اختيار أصليا لـ Plugin في Codex، وتحتفظ الترحيلات غير التفاعلية بكل plugins المخطط لها. ينطبق هذا فقط على plugins Codex المثبتة من المصدر من نوع `openai-curated` التي يكتشفها مخزون خادم تطبيقات Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  لـ Codex فقط. افرض اجتيازا جديدا من خادم تطبيقات Codex المصدر عبر `app/list` قبل التخطيط لتفعيل Plugin الأصلي. متوقف افتراضيا لإبقاء تخطيط الترحيل سريعا.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخط النسخة الاحتياطية السابقة للتطبيق. يتطلب `--force` عند وجود حالة OpenClaw محلية.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب بجانب `--no-backup` عندما كان التطبيق سيرفض بخلاف ذلك تخطي النسخة الاحتياطية.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بصيغة JSON. مع `--json` وبدون `--yes`، يطبع التطبيق الخطة ولا يغير الحالة.
</ParamField>

## نموذج السلامة

`openclaw migrate` يبدأ بالمعاينة.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد الموفر خطة مفصلة بالعناصر قبل تغيير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو سرية مثل مفاتيح API والرموز المميزة وترويسات التفويض وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم تعيين `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن أن يستمر الترحيل. لتخطي النسخة الاحتياطية عند وجود حالة، مرر كلا من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل مع `--overwrite` إذا كان استبدال الأهداف الموجودة مقصودا. قد تظل الموفرات تكتب نسخا احتياطية على مستوى العنصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    يسأل التطبيق التفاعلي ما إذا كان يجب استيراد بيانات اعتماد المصادقة المكتشفة، مع اختيار نعم افتراضيا. استخدم `--no-auth-credentials` لتخطيها، أو استخدم `--include-secrets` لاستيراد بيانات الاعتماد دون حضور مع `--yes`.
  </Accordion>
</AccordionGroup>

## موفر Claude

يكتشف موفر Claude المضمن حالة Claude Code في `~/.claude` افتراضيا. استخدم `--from <path>` لاستيراد موطن Claude Code محدد أو جذر مشروع محدد.

<Tip>
للاطلاع على إرشادات موجهة للمستخدمين، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- `CLAUDE.md` الخاص بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `~/.claude/CLAUDE.md` الخاص بالمستخدم بملف `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع و`~/.claude.json` الخاص بـ Claude Code و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- تحويل ملفات Markdown لأوامر Claude إلى Skills في OpenClaw مع استدعاء يدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

يتم حفظ خطافات Claude والأذونات وافتراضات البيئة والذاكرة المحلية والقواعد المحددة بالمسار والوكلاء الفرعيين وذاكرات التخزين المؤقت والخطط وسجل المشروع في تقرير الترحيل أو الإبلاغ عنها كعناصر مراجعة يدوية. لا ينفذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد حالة بيانات اعتماد OAuth/Desktop تلقائيا.

## موفر Codex

يكتشف موفر Codex المضمن حالة Codex CLI في `~/.codex` افتراضيا، أو
في `CODEX_HOME` عند تعيين متغير البيئة هذا. استخدم `--from <path>` لـ
جرد موطن Codex محدد.

استخدم هذا الموفر عند الانتقال إلى حزمة Codex في OpenClaw وعندما تريد
ترقية أصول Codex CLI الشخصية المفيدة بشكل متعمد. تستخدم عمليات تشغيل خادم تطبيقات Codex المحلي
`CODEX_HOME` خاصا بكل وكيل، لذلك لا تقرأ `~/.codex` الشخصية
افتراضيا. لا يزال `HOME` العادي للعملية موروثا، لذلك يستطيع Codex
رؤية Skills المشتركة في `$HOME/.agents/*` وإدخالات سوق plugins، كما تستطيع
العمليات الفرعية العثور على إعدادات ورموز موطن المستخدم.

تشغيل `openclaw migrate codex` في طرفية تفاعلية يعاين
الخطة الكاملة، ثم يفتح محددات خانات اختيار قبل تأكيد التطبيق النهائي. تتم مطالبة
عناصر نسخ Skills أولا. استخدم `Toggle all on` أو `Toggle all off` للتحديد
الجماعي. اضغط Space لتبديل الصفوف، أو اضغط Enter لتفعيل الصف المميز
والمتابعة. تبدأ Skills المخطط لها محددة، وتبدأ Skills المتعارضة غير محددة، و
`Skip for now` يتخطى نسخ Skills لهذا التشغيل مع الاستمرار إلى تحديد Plugin.
عندما تكون plugins Codex المنسقة والمثبتة من المصدر قابلة للترحيل ولم يتم توفير
`--plugin`، يطلب الترحيل بعد ذلك تفعيل Plugin الأصلي في Codex
حسب اسم Plugin. تبدأ عناصر Plugin
محددة ما لم يكن إعداد Plugin Codex الهدف في OpenClaw يحتوي على ذلك
Plugin بالفعل. تبدأ plugins الهدف الموجودة غير محددة وتعرض تلميح تعارض مثل
`conflict: plugin exists`؛ اختر `Toggle all off` لعدم ترحيل أي plugins Codex
أصلية في ذلك التشغيل، أو `Skip for now` للتوقف قبل التطبيق. للتشغيلات النصية أو
الدقيقة، مرر `--skill <name>` مرة لكل مهارة، على سبيل المثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

استخدم `--plugin <name>` لقصر ترحيل Plugin Codex الأصلي غير التفاعلي
على Plugin منسق واحد أو أكثر مثبت من المصدر:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI ضمن `$CODEX_HOME/skills`، باستثناء ذاكرة التخزين المؤقت
  `.system` الخاصة بـ Codex.
- AgentSkills الشخصية ضمن `$HOME/.agents/skills`، منسوخة إلى مساحة عمل وكيل
  OpenClaw الحالية عندما تريد ملكية لكل وكيل.
- plugins Codex من نوع `openai-curated` المثبتة من المصدر والمكتشفة عبر
  `plugin/list` في خادم تطبيقات Codex. يقرأ التخطيط `plugin/read` لكل Plugin
  مثبت وممكن. تتطلب plugins المدعومة بتطبيق أن تكون استجابة حساب خادم تطبيقات Codex
  المصدر حساب اشتراك ChatGPT؛ ويتم تخطي الاستجابات غير التابعة لـ ChatGPT أو المفقودة
  بسبب `codex_subscription_required`. افتراضيا،
  لا يستدعي الترحيل `app/list` المصدر، لذلك يتم تخطيط plugins المدعومة بتطبيق التي تجتاز
  بوابة الحساب بدون التحقق من إمكانية وصول تطبيقات المصدر، ويتم تخطي
  إخفاقات نقل البحث عن الحساب بسبب `codex_account_unavailable`. مرر
  `--verify-plugin-apps` عندما تريد أن يفرض الترحيل لقطة `app/list`
  جديدة من المصدر وأن يتطلب وجود كل تطبيق مملوك وتمكينه وإمكانية
  الوصول إليه قبل التخطيط للتفعيل الأصلي. في ذلك الوضع، تمر إخفاقات نقل
  البحث عن الحساب إلى التحقق من مخزون تطبيقات المصدر. يتم الاحتفاظ بلقطة مخزون
  تطبيقات المصدر في الذاكرة للعملية الحالية؛ ولا تتم كتابتها إلى مخرجات الترحيل
  أو إعدادات الهدف. تصبح plugins المعطلة،
  وتفاصيل Plugin غير القابلة للقراءة، وحسابات المصدر المقيدة بالاشتراك، وعند
  طلب التحقق، التطبيقات المفقودة أو المعطلة أو غير القابلة للوصول أو
  إخفاقات مخزون تطبيقات المصدر عناصر يدوية متخطاة بأسباب مصنفة
  بدلا من إدخالات إعدادات الهدف.
  يستدعي التطبيق `plugin/install` في خادم التطبيقات لكل Plugin مؤهل محدد،
  حتى إذا كان خادم التطبيقات الهدف يبلغ بالفعل أن ذلك Plugin مثبت
  وممكن. لا تكون plugins Codex المرحلة قابلة للاستخدام إلا في الجلسات التي تختار
  حزمة Codex الأصلية؛ ولا يتم عرضها لتشغيلات موفري OpenClaw،
  أو روابط محادثات ACP، أو الحزم الأخرى.

### حالة Codex للمراجعة اليدوية

لا يتم تفعيل `config.toml` الخاص بـ Codex، و`hooks/hooks.json` الأصلي، والأسواق غير المنسقة، وحزم
Plugin المخزنة مؤقتا التي ليست plugins منسقة مثبتة من المصدر، وplugins المثبتة من المصدر
التي تفشل في بوابة اشتراك المصدر تلقائيا.
عند تعيين `--verify-plugin-apps`، يتم أيضا تخطي plugins التي تفشل في بوابة
مخزون تطبيقات المصدر. يتم نسخها أو الإبلاغ عنها في تقرير الترحيل لـ
المراجعة اليدوية.

بالنسبة إلى plugins المنسقة المثبتة من المصدر والمرحلة، يكتب التطبيق:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- إدخال Plugin صريح واحد مع `marketplaceName: "openai-curated"` و
  `pluginName` لكل Plugin محدد

لا تكتب الهجرة أبدًا `plugins["*"]` ولا تخزّن مسارات ذاكرة التخزين المؤقت المحلية للمتجر. تُبلّغ إخفاقات الاشتراك في جانب المصدر على العناصر اليدوية مع أسباب مُنمّطة مثل `codex_subscription_required` أو `codex_account_unavailable` أو `plugin_disabled` أو `plugin_read_unavailable`. مع `--verify-plugin-apps`، يمكن أن تظهر إخفاقات جرد تطبيقات المصدر أيضًا كـ `app_inaccessible` أو `app_disabled` أو `app_missing` أو `app_inventory_unavailable`. لا تُكتب Plugins المتخطاة في إعدادات الهدف.
تُبلّغ عمليات التثبيت التي تتطلب مصادقة في جانب الهدف على عنصر Plugin المتأثر مع `status: "skipped"` و`reason: "auth_required"` ومعرّفات تطبيقات منقّحة. تُكتب إدخالات الإعدادات الصريحة الخاصة بها معطّلة إلى أن تعيد التفويض وتمكّنها. أما إخفاقات التثبيت الأخرى فهي نتائج `error` على مستوى العنصر.

إذا لم يكن جرد Plugin خادم تطبيقات Codex متاحًا أثناء التخطيط، تعود الهجرة إلى عناصر إرشادية مخزّنة مؤقتًا من الحزمة بدلًا من إفشال الهجرة كلها.

## موفّر Hermes

يكتشف موفّر Hermes المضمّن الحالة في `~/.hermes` افتراضيًا. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعدادات النموذج الافتراضية من `config.yaml`.
- موفّرو النماذج المضبوطون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة مساحة العمل.
- الإعدادات الافتراضية لذاكرة ملفات OpenClaw، إضافة إلى عناصر أرشفة أو مراجعة يدوية لموفّري الذاكرة الخارجية مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` تحت `skills/<name>/`.
- قيم الإعدادات لكل Skill من `skills.config`.
- بيانات اعتماد OpenCode OpenAI OAuth من `auth.json` الخاص بـ OpenCode عند قبول هجرة بيانات الاعتماد التفاعلية، أو عند تعيين `--include-secrets`. تُعد إدخالات OAuth في `auth.json` الخاص بـ Hermes حالة قديمة يُبلّغ عنها لإعادة تفويض OpenAI يدويًا أو إصلاح doctor.
- مفاتيح API والرموز المدعومة من `.env` الخاص بـ Hermes و`auth.json` الخاص بـ OpenCode عند قبول هجرة بيانات الاعتماد التفاعلية، أو عند تعيين `--include-secrets`.

### مفاتيح `.env` المدعومة

- `AI_GATEWAY_API_KEY`
- `ALIBABA_API_KEY`
- `ANTHROPIC_API_KEY`
- `ARCEEAI_API_KEY`
- `CEREBRAS_API_KEY`
- `CHUTES_API_KEY`
- `CLOUDFLARE_AI_GATEWAY_API_KEY`
- `COPILOT_GITHUB_TOKEN`
- `DASHSCOPE_API_KEY`
- `DEEPINFRA_API_KEY`
- `DEEPSEEK_API_KEY`
- `FIREWORKS_API_KEY`
- `GEMINI_API_KEY`
- `GH_TOKEN`
- `GITHUB_TOKEN`
- `GLM_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`
- `HF_TOKEN`
- `HUGGINGFACE_HUB_TOKEN`
- `KILOCODE_API_KEY`
- `KIMICODE_API_KEY`
- `KIMI_API_KEY`
- `MINIMAX_API_KEY`
- `MINIMAX_CODING_API_KEY`
- `MISTRAL_API_KEY`
- `MODELSTUDIO_API_KEY`
- `MOONSHOT_API_KEY`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENCODE_API_KEY`
- `OPENCODE_GO_API_KEY`
- `OPENCODE_ZEN_API_KEY`
- `OPENROUTER_API_KEY`
- `QIANFAN_API_KEY`
- `QWEN_API_KEY`
- `TOGETHER_API_KEY`
- `VENICE_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`
- `ZAI_API_KEY`
- `Z_AI_API_KEY`

### حالة للأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الهجرة للمراجعة اليدوية، لكنها لا تُحمّل في إعدادات OpenClaw الحية أو بيانات الاعتماد. يحافظ هذا على الحالة الغامضة أو غير الآمنة من دون الادعاء بأن OpenClaw يستطيع تنفيذها أو الوثوق بها تلقائيًا:

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

### بعد التطبيق

```bash
openclaw doctor
```

## عقد Plugin

مصادر الهجرة هي Plugins. يصرّح Plugin بمعرّفات موفّريه في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي Plugin الدالة `api.registerMigrationProvider(...)`. ينفّذ الموفّر `detect` و`plan` و`apply`. يمتلك النواة تنسيق CLI وسياسة النسخ الاحتياطي والمطالبات وإخراج JSON والفحص المسبق للتعارضات. تمرر النواة الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، ويمكن للموفّرين إعادة بناء الخطة فقط عندما تكون تلك الوسيطة غائبة لأغراض التوافق.

يمكن لـ Plugins الموفّرين استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وحسابات الملخصات، إضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات مع مراعاة التعارضات، ونسخ التقارير المخصصة للأرشفة فقط، وأغلفة وقت تشغيل الإعدادات المخزّنة مؤقتًا، وتقارير الهجرة.

## تكامل التهيئة الأولية

يمكن للتهيئة الأولية أن تعرض الهجرة عندما يكتشف موفّر مصدرًا معروفًا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفّر هجرة Plugin نفسه، وما زالا يعرضان معاينة قبل التطبيق.

<Note>
تتطلب واردات التهيئة الأولية إعداد OpenClaw جديدًا. أعد تعيين الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. استيرادات النسخ الاحتياطي مع الاستبدال أو الدمج مقيدة بميزة للإعدادات القائمة.
</Note>

## ذات صلة

- [الهجرة من Hermes](/ar/install/migrating-hermes): دليل تفصيلي موجّه للمستخدم.
- [الهجرة من Claude](/ar/install/migrating-claude): دليل تفصيلي موجّه للمستخدم.
- [الهجرة](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق هجرة.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

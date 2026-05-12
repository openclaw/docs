---
read_when:
    - تريد الانتقال من Hermes أو نظام وكلاء آخر إلى OpenClaw
    - أنت تضيف مزوّد ترحيل تابعًا لـ Plugin
summary: مرجع CLI لـ `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: الترحيل
x-i18n:
    generated_at: "2026-05-12T00:58:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95d31d2995d426c7886700c9e0e6c6fa0c013a27c0bfe7cf91380c8029d6df89
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر عبر موفر ترحيل يملكه Plugin. تغطي الموفرات المضمنة حالة Codex CLI و[Claude](/ar/install/migrating-claude) و[Hermes](/ar/install/migrating-hermes)؛ ويمكن لـ Plugins التابعة لجهات خارجية تسجيل موفرين إضافيين.

<Tip>
للاطلاع على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) كل المسارات.
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
  اسم موفر ترحيل مسجل، مثل `hermes`. شغل `openclaw migrate list` لرؤية الموفرين المثبتين.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  أنشئ الخطة واخرج من دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل حالة المصدر. يستخدم Hermes افتراضيا `~/.hermes`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة. معطل افتراضيا.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الأهداف الموجودة عندما تبلغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخط مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدد عنصر نسخ Skill واحدا باسم Skill أو معرّف العنصر. كرر الراية لترحيل Skills متعددة. عند الإغفال، تعرض ترحيلات Codex التفاعلية محدد مربعات اختيار، وتحتفظ الترحيلات غير التفاعلية بكل Skills المخططة.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  حدد عنصر تثبيت Plugin واحدا من Codex باسم Plugin أو معرّف العنصر. كرر الراية لترحيل Plugins متعددة من Codex. عند الإغفال، تعرض ترحيلات Codex التفاعلية محدد مربعات اختيار Plugin أصليا من Codex، وتحتفظ الترحيلات غير التفاعلية بكل Plugins المخططة. ينطبق هذا فقط على Plugins Codex المثبتة من المصدر من `openai-curated` التي يكتشفها مخزون خادم تطبيق Codex.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخط النسخ الاحتياطي السابق للتطبيق. يتطلب `--force` عندما تكون حالة OpenClaw المحلية موجودة.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب إلى جانب `--no-backup` عندما سيرفض التطبيق بخلاف ذلك تخطي النسخ الاحتياطي.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بصيغة JSON. مع `--json` ومن دون `--yes`، يطبع التطبيق الخطة ولا يعدل الحالة.
</ParamField>

## نموذج السلامة

`openclaw migrate` يعتمد المعاينة أولا.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد الموفر خطة مفصلة بالعناصر قبل تغيير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو سرية، مثل مفاتيح API والرموز المميزة وترويسات التخويل وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطلب التأكيد قبل تغيير الحالة ما لم يتم تعيين `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم تكن هناك حالة OpenClaw محلية بعد، يتم تخطي خطوة النسخ الاحتياطي ويمكن للترحيل المتابعة. لتخطي نسخة احتياطية عندما تكون الحالة موجودة، مرر كلا من `--no-backup` و`--force`.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل مع `--overwrite` إذا كان استبدال الأهداف الموجودة مقصودا. قد يظل الموفرون يكتبون نسخا احتياطية على مستوى العناصر للملفات المستبدلة في دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    لا يتم استيراد الأسرار افتراضيا أبدا. استخدم `--include-secrets` لاستيراد بيانات الاعتماد المدعومة.
  </Accordion>
</AccordionGroup>

## موفر Claude

يكتشف موفر Claude المضمن حالة Claude Code في `~/.claude` افتراضيا. استخدم `--from <path>` لاستيراد منزل Claude Code أو جذر مشروع محدد.

<Tip>
للاطلاع على إرشادات موجهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- ملفات `CLAUDE.md` الخاصة بالمشروع و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw.
- ملف المستخدم `~/.claude/CLAUDE.md` ملحقا بـ `USER.md` في مساحة العمل.
- تعريفات خادم MCP من `.mcp.json` الخاص بالمشروع، و`~/.claude.json` الخاص بـ Claude Code، و`claude_desktop_config.json` الخاص بـ Claude Desktop.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md`.
- ملفات Markdown لأوامر Claude محولة إلى Skills في OpenClaw مع استدعاء يدوي فقط.

### حالة الأرشفة والمراجعة اليدوية

يتم الاحتفاظ بخطافات Claude، والأذونات، وافتراضيات البيئة، والذاكرة المحلية، والقواعد محددة المسار، والوكلاء الفرعيين، وذاكرات التخزين المؤقت، والخطط، وسجل المشروع في تقرير الترحيل أو الإبلاغ عنها كعناصر مراجعة يدوية. لا ينفذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد حالة اعتماد OAuth/Desktop تلقائيا.

## موفر Codex

يكتشف موفر Codex المضمن حالة Codex CLI في `~/.codex` افتراضيا، أو
في `CODEX_HOME` عندما يكون متغير البيئة هذا معينا. استخدم `--from <path>` من أجل
جرد منزل Codex محدد.

استخدم هذا الموفر عند الانتقال إلى مشغّل OpenClaw Codex وترغب في
ترقية أصول Codex CLI الشخصية المفيدة عمدا. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية
أدلة `CODEX_HOME` و`HOME` لكل وكيل، لذلك لا تقرأ
حالة Codex CLI الشخصية افتراضيا.

عند تشغيل `openclaw migrate codex` في طرفية تفاعلية، تتم معاينة
الخطة الكاملة، ثم فتح محددات مربعات اختيار قبل تأكيد التطبيق النهائي. تتم المطالبة بعناصر
نسخ Skills أولا. استخدم `Toggle all on` أو `Toggle all off` للتحديد
بالجملة؛ تبدأ Skills المخططة محددة، وتبدأ Skills المتعارضة غير محددة، ويؤدي
`Skip for now` إلى تخطي نسخ Skills لهذه الجولة مع الاستمرار في تحديد Plugin.
عندما تكون Plugins Codex المنسقة والمثبتة من المصدر قابلة للترحيل ولم يتم
توفير `--plugin`، يطالب الترحيل بعد ذلك بتفعيل Plugin أصلي من Codex
حسب اسم Plugin. تبدأ عناصر Plugin
محددة ما لم يكن إعداد Plugin هدف OpenClaw Codex يحتوي بالفعل على ذلك
Plugin. تبدأ Plugins الهدف الموجودة غير محددة وتعرض تلميح تعارض مثل
`conflict: plugin exists`؛ اختر `Toggle all off` لعدم ترحيل أي Plugins Codex أصلية
في تلك الجولة، أو `Skip for now` للتوقف قبل التطبيق. للجولات النصية أو
الدقيقة، مرر `--skill <name>` مرة لكل Skill، على سبيل المثال:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
```

استخدم `--plugin <name>` لقصر ترحيل Plugin الأصلي من Codex بشكل غير تفاعلي
على واحد أو أكثر من Plugins المنسقة والمثبتة من المصدر:

```bash
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI ضمن `$CODEX_HOME/skills`، باستثناء ذاكرة التخزين المؤقت
  `.system` الخاصة بـ Codex.
- AgentSkills الشخصية ضمن `$HOME/.agents/skills`، منسوخة إلى مساحة عمل
  وكيل OpenClaw الحالية عندما تريد ملكية لكل وكيل.
- Plugins Codex المثبتة من المصدر من `openai-curated` والمكتشفة عبر
  `plugin/list` لخادم تطبيق Codex. يستدعي التطبيق `plugin/install` من خادم التطبيق لكل
  Plugin محدد، حتى إذا كان خادم التطبيق الهدف يبلغ بالفعل أن ذلك Plugin
  مثبت وممكّن. تكون Plugins Codex المرحّلة قابلة للاستخدام فقط في الجلسات التي
  تحدد مشغّل Codex الأصلي؛ ولا يتم تعريضها لـ Pi، ولا لعمليات تشغيل موفر OpenAI
  العادية، ولا لروابط محادثات ACP، ولا للمشغلات الأخرى.

### حالة Codex للمراجعة اليدوية

لا يتم تفعيل `config.toml` الخاص بـ Codex، و`hooks/hooks.json` الأصلية، والأسواق غير المنسقة، وحزم
Plugins المخزنة مؤقتا التي ليست Plugins منسقة مثبتة من المصدر
تلقائيا. يتم نسخها أو الإبلاغ عنها في تقرير الترحيل للمراجعة اليدوية.

بالنسبة إلى Plugins المنسقة المثبتة من المصدر التي تم ترحيلها، يكتب التطبيق:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- إدخال Plugin صريح واحد مع `marketplaceName: "openai-curated"` و
  `pluginName` لكل Plugin محدد

لا يكتب الترحيل `plugins["*"]` أبدا ولا يخزن مسارات ذاكرة التخزين المؤقت
للسوق المحلية أبدا. يتم الإبلاغ عن عمليات التثبيت التي تتطلب مصادقة على عنصر Plugin المتأثر مع
`status: "skipped"` و`reason: "auth_required"` ومعرّفات تطبيق منقحة.
تتم كتابة إدخالات إعدادها الصريحة معطلة حتى تعيد التخويل
وتمكنها. تكون إخفاقات التثبيت الأخرى نتائج `error` على نطاق العنصر.

إذا كان مخزون Plugin في خادم تطبيق Codex غير متاح أثناء التخطيط، يعود الترحيل
إلى عناصر إرشادية للحزم المخزنة مؤقتا بدلا من إفشال الترحيل
كله.

## موفر Hermes

يكتشف موفر Hermes المضمن الحالة في `~/.hermes` افتراضيا. استخدم `--from <path>` عندما يكون Hermes في مكان آخر.

### ما يستورده Hermes

- إعداد النموذج الافتراضي من `config.yaml`.
- موفرو النماذج المهيؤون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خادم MCP من `mcp_servers` أو `mcp.servers`.
- `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- `memories/MEMORY.md` و`memories/USER.md` ملحقان بملفات ذاكرة مساحة العمل.
- افتراضيات إعداد الذاكرة لذاكرة الملفات في OpenClaw، بالإضافة إلى عناصر أرشفة أو مراجعة يدوية لموفري الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` ضمن `skills/<name>/`.
- قيم إعداد كل Skill من `skills.config`.
- مفاتيح API المدعومة من `.env`، فقط مع `--include-secrets`.

### مفاتيح `.env` المدعومة

`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `DEEPSEEK_API_KEY`.

### حالة الأرشفة فقط

يتم نسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تحمل في إعداد OpenClaw أو بيانات اعتماده الحية. يحافظ هذا على الحالة المبهمة أو غير الآمنة من دون الادعاء بأن OpenClaw يمكنه تنفيذها أو الوثوق بها تلقائيا:

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

مصادر الترحيل هي Plugins. يعلن Plugin عن معرّفات موفره في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، يستدعي Plugin ‏`api.registerMigrationProvider(...)`. ينفذ الموفر `detect` و`plan` و`apply`. يملك Core تنسيق CLI، وسياسة النسخ الاحتياطي، والمطالبات، ومخرجات JSON، والفحص المسبق للتعارضات. يمرر Core الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، وقد يعيد الموفرون بناء الخطة فقط عندما تكون تلك الوسيطة غائبة لأغراض التوافق.

يمكن لـ Plugins الموفرين استخدام `openclaw/plugin-sdk/migration` لبناء العناصر وأعداد الملخصات، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات المدركة للتعارضات، ونسخ التقارير المخصصة للأرشفة فقط، وأغلفة config-runtime المخزنة مؤقتا، وتقارير الترحيل.

## تكامل الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف موفر مصدرا معروفا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفر ترحيل Plugin نفسه، ويظلان يعرضان معاينة قبل التطبيق.

<Note>
تتطلب عمليات استيراد الإعداد الأولي إعداد OpenClaw جديدًا. أعِد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. تخضع عمليات استيراد النسخ الاحتياطي مع الاستبدال أو الدمج لبوابة ميزة في الإعدادات الموجودة.
</Note>

## ذات صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): شرح تفصيلي موجّه للمستخدم.
- [الترحيل من Claude](/ar/install/migrating-claude): شرح تفصيلي موجّه للمستخدم.
- [الترحيل](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [Doctor](/ar/gateway/doctor): فحص السلامة بعد تطبيق عملية ترحيل.
- [Plugins](/ar/tools/plugin): تثبيت Plugin وتسجيله.

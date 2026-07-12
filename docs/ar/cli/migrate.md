---
read_when:
    - تريد الانتقال من Hermes أو نظام وكيل آخر إلى OpenClaw
    - أنت تضيف موفّر ترحيل مملوكًا لـ Plugin
summary: مرجع CLI للأمر `openclaw migrate` (استيراد الحالة من نظام وكيل آخر)
title: ترحيل
x-i18n:
    generated_at: "2026-07-12T05:45:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1160373bfec09de8ec1bac6fbe8a218e8af7ec6a5896bc1fdfe6a0db158d50a1
    source_path: cli/migrate.md
    workflow: 16
---

# `openclaw migrate`

استورد الحالة من نظام وكيل آخر من خلال موفّر ترحيل يملكه Plugin. تغطي الموفّرات المضمّنة Claude وCodex CLI و[Hermes](/ar/install/migrating-hermes)؛ ويمكن للـ plugins تسجيل موفّرات إضافية.

<Tip>
للاطلاع على إرشادات موجّهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude) و[الترحيل من Hermes](/ar/install/migrating-hermes). يسرد [مركز الترحيل](/ar/install/migrating) جميع المسارات.
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

يؤدي تشغيل `openclaw migrate <provider>` من دون أي علامات أخرى إلى إنشاء الخطة ومعاينتها، ثم المطالبة بالتأكيد (في TTY) قبل تطبيقها. يفصل `openclaw migrate plan <provider>` و`openclaw migrate apply <provider>` المعاينة والتطبيق في أمرين فرعيين مستقلين يستخدمان العلامات نفسها.

<ParamField path="<provider>" type="string">
  اسم موفّر ترحيل مسجّل، مثل `hermes`. شغّل `openclaw migrate list` لرؤية الموفّرات المثبّتة.
</ParamField>
<ParamField path="--dry-run" type="boolean">
  أنشئ الخطة ثم اخرج من دون تغيير الحالة.
</ParamField>
<ParamField path="--from <path>" type="string">
  تجاوز دليل الحالة المصدر. القيمة الافتراضية لـ Hermes هي `~/.hermes`، ولـ Codex هي `~/.codex` (أو `$CODEX_HOME`)، ولـ Claude هي `~/.claude`.
</ParamField>
<ParamField path="--include-secrets" type="boolean">
  استورد بيانات الاعتماد المدعومة من دون مطالبة. يسأل التطبيق التفاعلي قبل استيراد بيانات اعتماد المصادقة المكتشفة، مع تحديد نعم افتراضيًا؛ ويتطلب `--yes` في الوضع غير التفاعلي استخدام `--include-secrets` لاستيرادها.
</ParamField>
<ParamField path="--no-auth-credentials" type="boolean">
  تخطَّ استيراد بيانات اعتماد المصادقة، بما في ذلك المطالبة التفاعلية.
</ParamField>
<ParamField path="--overwrite" type="boolean">
  اسمح للتطبيق باستبدال الوجهات الموجودة عندما تُبلغ الخطة عن تعارضات.
</ParamField>
<ParamField path="--yes" type="boolean">
  تخطَّ مطالبة التأكيد. مطلوب في الوضع غير التفاعلي.
</ParamField>
<ParamField path="--skill <name>" type="string">
  حدّد عنصر نسخ Skills واحدًا بحسب اسم Skill أو معرّف العنصر. كرّر العلامة لترحيل عدة Skills. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدّدًا بمربعات اختيار، بينما تحتفظ عمليات الترحيل غير التفاعلية بجميع Skills المخطّط لها.
</ParamField>
<ParamField path="--plugin <name>" type="string">
  حدّد عنصر تثبيت Plugin واحدًا لـ Codex بحسب اسم Plugin أو معرّف العنصر. كرّر العلامة لترحيل عدة plugins لـ Codex. عند حذفها، تعرض عمليات ترحيل Codex التفاعلية محدّدًا أصليًا بمربعات اختيار لـ plugins الخاصة بـ Codex، بينما تحتفظ عمليات الترحيل غير التفاعلية بجميع plugins المخطّط لها. ينطبق هذا فقط على plugins الخاصة بـ Codex من `openai-curated` والمثبّتة من المصدر، التي يكتشفها مخزون خادم تطبيق Codex.
</ParamField>
<ParamField path="--verify-plugin-apps" type="boolean">
  لـ Codex فقط. يفرض اجتيازًا جديدًا لـ `app/list` في خادم تطبيق Codex المصدر قبل التخطيط لتنشيط Plugin الأصلي. يكون معطّلًا افتراضيًا للحفاظ على سرعة تخطيط الترحيل.
</ParamField>
<ParamField path="--backup-output <path>" type="string">
  مسار أرشيف النسخة الاحتياطية السابقة للترحيل أو دليلها. يُمرَّر إلى `openclaw backup create`.
</ParamField>
<ParamField path="--no-backup" type="boolean">
  تخطَّ النسخة الاحتياطية السابقة للتطبيق. يتطلب `--force` عند وجود حالة محلية لـ OpenClaw.
</ParamField>
<ParamField path="--force" type="boolean">
  مطلوب إلى جانب `--no-backup` عندما يرفض التطبيق تخطي النسخة الاحتياطية لولا ذلك.
</ParamField>
<ParamField path="--json" type="boolean">
  اطبع الخطة أو نتيجة التطبيق بتنسيق JSON. عند استخدام `--json` من دون `--yes`، يطبع التطبيق الخطة ولا يغيّر الحالة.
</ParamField>

## نموذج الأمان

يعتمد `openclaw migrate` على المعاينة أولًا.

<AccordionGroup>
  <Accordion title="المعاينة قبل التطبيق">
    يعيد الموفّر خطة مفصّلة بالعناصر قبل تغيير أي شيء، بما في ذلك التعارضات والعناصر المتخطاة والعناصر الحساسة. تحجب خطط JSON ومخرجات التطبيق وتقارير الترحيل المفاتيح المتداخلة التي تبدو سرية، مثل مفاتيح API والرموز المميزة وترويسات التفويض وملفات تعريف الارتباط وكلمات المرور.

    يعاين `openclaw migrate apply <provider>` الخطة ويطالب بالتأكيد قبل تغيير الحالة، ما لم تُضبط `--yes`. في الوضع غير التفاعلي، يتطلب التطبيق `--yes`.

  </Accordion>
  <Accordion title="النسخ الاحتياطية">
    ينشئ التطبيق نسخة احتياطية من OpenClaw ويتحقق منها قبل تطبيق الترحيل. إذا لم توجد حالة محلية لـ OpenClaw بعد، تُتخطى خطوة النسخ الاحتياطي ويستمر الترحيل. لتخطي النسخ الاحتياطي عند وجود حالة، مرّر `--no-backup` و`--force` معًا.
  </Accordion>
  <Accordion title="التعارضات">
    يرفض التطبيق المتابعة عندما تحتوي الخطة على تعارضات. راجع الخطة، ثم أعد التشغيل باستخدام `--overwrite` إذا كان استبدال الوجهات الموجودة مقصودًا. قد تستمر الموفّرات في كتابة نسخ احتياطية على مستوى العناصر للملفات المستبدلة داخل دليل تقرير الترحيل.
  </Accordion>
  <Accordion title="الأسرار">
    يسأل التطبيق التفاعلي عمّا إذا كنت تريد استيراد بيانات اعتماد المصادقة المكتشفة، مع تحديد نعم افتراضيًا. استخدم `--no-auth-credentials` لتخطيها، أو `--include-secrets` لاستيراد بيانات الاعتماد دون إشراف باستخدام `--yes`.
  </Accordion>
</AccordionGroup>

## موفّر Claude

يكتشف موفّر Claude المضمّن حالة Claude Code في `~/.claude` افتراضيًا. استخدم `--from <path>` لاستيراد دليل رئيسي أو جذر مشروع محدد لـ Claude Code.

<Tip>
للاطلاع على إرشادات موجّهة للمستخدم، راجع [الترحيل من Claude](/ar/install/migrating-claude).
</Tip>

### ما يستورده Claude

- ملفا المشروع `CLAUDE.md` و`.claude/CLAUDE.md` إلى مساحة عمل وكيل OpenClaw (`AGENTS.md`).
- يُلحق ملف المستخدم `~/.claude/CLAUDE.md` بملف مساحة العمل `USER.md`.
- تعريفات خوادم MCP من ملف المشروع `.mcp.json`، وملف Claude Code ‏`~/.claude.json` (بما في ذلك إدخالاته الخاصة بكل مشروع)، وملف Claude Desktop ‏`claude_desktop_config.json`.
- أدلة Skills الخاصة بـ Claude التي تتضمن `SKILL.md` (دليل المستخدم `~/.claude/skills` ودليل المشروع `.claude/skills`).
- ملفات أوامر Markdown الخاصة بـ Claude (دليل المستخدم `~/.claude/commands` ودليل المشروع `.claude/commands`) بعد تحويلها إلى Skills خاصة بـ OpenClaw لا يمكن استدعاؤها إلا يدويًا.

### حالة الأرشيف والمراجعة اليدوية

يُحتفظ بخطافات Claude والأذونات والقيم الافتراضية للبيئة وملف المشروع `CLAUDE.local.md` و`.claude/rules` وأدلة `agents/` الخاصة بالمستخدم والمشروع وسجل المشروع (`projects` و`cache` و`plans` ضمن `~/.claude`) في تقرير الترحيل أو يُبلّغ عنها بوصفها عناصر تتطلب مراجعة يدوية. لا ينفّذ OpenClaw الخطافات، ولا ينسخ قوائم السماح الواسعة، ولا يستورد تلقائيًا حالة بيانات اعتماد OAuth أو Desktop.

## موفّر Codex

يكتشف موفّر Codex المضمّن حالة Codex CLI في `~/.codex` افتراضيًا، أو في `CODEX_HOME` عند ضبط متغير البيئة هذا. استخدم `--from <path>` لجرد دليل رئيسي محدد لـ Codex.

استخدم هذا الموفّر عند الانتقال إلى بيئة تشغيل Codex في OpenClaw ورغبتك في ترقية أصول Codex CLI الشخصية المفيدة بصورة مقصودة. تستخدم عمليات تشغيل خادم تطبيق Codex المحلية قيمة `CODEX_HOME` خاصة بكل وكيل، لذلك لا تقرأ `~/.codex` الشخصي افتراضيًا. تظل قيمة `HOME` العادية للعملية موروثة، لذا يمكن لـ Codex رؤية إدخالات Skills وسوق plugins المشتركة ضمن `$HOME/.agents/*`، ويمكن للعمليات الفرعية العثور على إعدادات المستخدم ورموزه المميزة في دليله الرئيسي.

يؤدي تشغيل `openclaw migrate codex` في طرفية تفاعلية إلى معاينة الخطة الكاملة، ثم فتح محددات بمربعات اختيار قبل تأكيد التطبيق النهائي. تظهر المطالبة بعناصر نسخ Skills أولًا. استخدم `Toggle all on` أو `Toggle all off` للتحديد الجماعي. اضغط على مفتاح المسافة لتبديل الصفوف، أو Enter لتنشيط الصف المميز والمتابعة. تبدأ Skills المخطّط لها محددة، وتبدأ Skills المتعارضة غير محددة، ويتخطى `Skip for now` نسخ Skills في هذا التشغيل مع الاستمرار في تحديد plugins. عندما يمكن ترحيل plugins المنسقة الخاصة بـ Codex والمثبّتة من المصدر، ولم تُمرر `--plugin`، يطالب الترحيل بعد ذلك بتنشيط Plugin الأصلي لـ Codex حسب اسم Plugin. تبدأ عناصر Plugin محددة ما لم تكن إعدادات Plugin المستهدف لـ Codex في OpenClaw تحتوي على ذلك الـ Plugin بالفعل. تبدأ plugins الموجودة في الوجهة غير محددة وتعرض تلميح تعارض مثل `conflict: plugin exists`؛ اختر `Toggle all off` لعدم ترحيل أي plugins أصلية لـ Codex في ذلك التشغيل، أو `Skip for now` للتوقف قبل التطبيق.

لعمليات التشغيل البرمجية أو الدقيقة، حدّد Skills أو plugins واحدة أو أكثر صراحةً:

```bash
openclaw migrate codex --dry-run --skill gog-vault77-google-workspace
openclaw migrate apply codex --yes --skill gog-vault77-google-workspace
openclaw migrate codex --dry-run --plugin google-calendar
openclaw migrate apply codex --yes --plugin google-calendar
```

### ما يستورده Codex

- أدلة Skills الخاصة بـ Codex CLI ضمن `$CODEX_HOME/skills`، باستثناء ذاكرة التخزين المؤقت `.system` الخاصة بـ Codex.
- AgentSkills الشخصية ضمن `$HOME/.agents/skills`، وتُنسخ إلى مساحة عمل وكيل OpenClaw الحالية لتكون مملوكة لكل وكيل.
- plugins الخاصة بـ Codex من `openai-curated` والمثبّتة من المصدر، التي تُكتشف عبر `plugin/list` في خادم تطبيق Codex. يقرأ التخطيط `plugin/read` لكل Plugin مثبّت ومفعّل.

يخضع ترحيل plugins المدعومة بالتطبيقات لبوابات إضافية:

- تتطلب plugins المدعومة بالتطبيقات أن يكون حساب خادم تطبيق Codex المصدر حساب اشتراك ChatGPT. تُتخطى الاستجابات غير المرتبطة بـ ChatGPT أو التي لا تتضمن حسابًا، مع السبب `codex_subscription_required`.
- لا يستدعي الترحيل افتراضيًا `app/list` في المصدر، لذلك يُخطّط للـ plugins المدعومة بالتطبيقات التي تجتاز بوابة الحساب من دون التحقق من إمكانية الوصول إلى تطبيق المصدر، بينما تؤدي إخفاقات نقل البحث عن الحساب إلى التخطي مع السبب `codex_account_unavailable`.
- مرّر `--verify-plugin-apps` لفرض لقطة جديدة من `app/list` في المصدر، واشتراط أن يكون كل تطبيق مملوك موجودًا ومفعّلًا ويمكن الوصول إليه قبل التخطيط للتنشيط الأصلي. في هذا الوضع، تنتقل إخفاقات نقل البحث عن الحساب إلى التحقق من مخزون تطبيقات المصدر. تُحتفظ اللقطة في الذاكرة للعملية الحالية فقط؛ ولا تُكتب مطلقًا في مخرجات الترحيل أو إعدادات الوجهة.

تتحول plugins المعطّلة، وتفاصيل Plugin غير القابلة للقراءة، وحسابات المصدر المحكومة بالاشتراك، وكذلك التطبيقات المفقودة أو المعطّلة أو التي يتعذر الوصول إليها عند ضبط `--verify-plugin-apps`، إلى عناصر متخطاة يدويًا ذات أسباب مصنفة بدلًا من إدخالات إعدادات الوجهة. يستدعي التطبيق `plugin/install` في خادم التطبيق لكل Plugin مؤهل ومحدد، حتى إذا أبلغ خادم التطبيق المستهدف بالفعل عن تثبيت ذلك الـ Plugin وتفعيله. لا يمكن استخدام plugins الخاصة بـ Codex بعد ترحيلها إلا في الجلسات التي تحدد بيئة تشغيل Codex الأصلية؛ ولا تتاح لعمليات تشغيل موفّر OpenClaw، أو ارتباطات محادثات ACP، أو بيئات التشغيل الأخرى.

### حالة Codex التي تتطلب مراجعة يدوية

لا تُفعّل تلقائيًا إعدادات Codex في `config.toml` والخطافات الأصلية في `hooks/hooks.json` والأسواق غير المنسقة وحزم plugins المخزنة مؤقتًا التي ليست plugins منسقة ومثبّتة من المصدر، وكذلك plugins المثبّتة من المصدر التي تفشل في اجتياز بوابة اشتراك المصدر. عند ضبط `--verify-plugin-apps`، تُتخطى أيضًا plugins التي تفشل في اجتياز بوابة مخزون تطبيقات المصدر. تُنسخ جميع هذه العناصر أو يُبلّغ عنها في تقرير الترحيل للمراجعة اليدوية.

بالنسبة إلى plugins المنسقة والمثبّتة من المصدر التي جرى ترحيلها، يكتب التطبيق:

- `plugins.entries.codex.enabled: true`
- `plugins.entries.codex.config.codexPlugins.enabled: true`
- `plugins.entries.codex.config.codexPlugins.allow_destructive_actions: true`
- إدخال Plugin صريح واحد يحتوي على `marketplaceName: "openai-curated"` و`pluginName` لكل Plugin محدد

لا يكتب الترحيل مطلقًا `plugins["*"]` ولا يخزّن مسارات ذاكرة التخزين المؤقت للسوق المحلي.

لا تُكتب الإضافات التي تم تخطيها في إعدادات الوجهة. تُبلَّغ حالات فشل الاشتراك من جهة المصدر في العناصر اليدوية مع أسباب محددة النوع: `codex_subscription_required` أو `codex_account_unavailable` أو `plugin_disabled` أو `plugin_read_unavailable`. وعند استخدام `--verify-plugin-apps`، قد تظهر أيضًا حالات فشل جرد التطبيقات في المصدر على هيئة `app_inaccessible` أو `app_disabled` أو `app_missing` أو `app_inventory_unavailable`. تُبلَّغ عمليات التثبيت التي تتطلب مصادقة من جهة الوجهة في عنصر الإضافة المتأثر مع `status: "skipped"` و`reason: "auth_required"` ومعرّفات تطبيقات منقّحة؛ وتُكتب إدخالات إعداداتها الصريحة معطّلة إلى أن تعيد تفويضها وتمكّنها. أما حالات فشل التثبيت الأخرى فتُرجع نتائج `error` خاصة بكل عنصر.

إذا لم يكن جرد إضافات خادم تطبيق Codex متاحًا أثناء التخطيط، فستعود عملية الترحيل إلى عناصر إرشادية مخزنة مؤقتًا للحزمة بدلًا من إفشال عملية الترحيل بأكملها.

## موفّر Hermes

يكتشف موفّر Hermes المضمّن الحالة في `~/.hermes` افتراضيًا. استخدم `--from <path>` عندما يكون Hermes موجودًا في مكان آخر.

### ما يستورده Hermes

- إعدادات النموذج الافتراضية من `config.yaml`.
- موفّرو النماذج المُعدّون ونقاط النهاية المخصصة المتوافقة مع OpenAI من `providers` و`custom_providers`.
- تعريفات خوادم MCP من `mcp_servers` أو `mcp.servers`.
- الملفان `SOUL.md` و`AGENTS.md` إلى مساحة عمل وكيل OpenClaw.
- إلحاق `memories/MEMORY.md` و`memories/USER.md` بملفات ذاكرة مساحة العمل.
- الإعدادات الافتراضية للذاكرة الملفية في OpenClaw، بالإضافة إلى عناصر الأرشفة أو المراجعة اليدوية لموفّري الذاكرة الخارجيين مثل Honcho.
- Skills التي تتضمن ملف `SKILL.md` ضمن `skills/<name>/`.
- قيم الإعدادات الخاصة بكل Skill من `skills.config`.
- بيانات اعتماد OpenAI عبر OAuth الخاصة بـ OpenCode من ملف `auth.json` في OpenCode عند قبول ترحيل بيانات الاعتماد التفاعلي، أو عند تعيين `--include-secrets`. تُعد إدخالات OAuth في `auth.json` الخاص بـ Hermes حالة قديمة يُبلَّغ عنها لإعادة المصادقة اليدوية مع OpenAI أو لإصلاحها بواسطة الطبيب.
- مفاتيح API والرموز المميزة المدعومة من ملف `.env` الخاص بـ Hermes وملف `auth.json` الخاص بـ OpenCode عند قبول ترحيل بيانات الاعتماد التفاعلي، أو عند تعيين `--include-secrets`.

### مفاتيح `.env` المدعومة

`AI_GATEWAY_API_KEY`, `ALIBABA_API_KEY`, `ANTHROPIC_API_KEY`, `ARCEEAI_API_KEY`, `CEREBRAS_API_KEY`, `CHUTES_API_KEY`, `CLOUDFLARE_AI_GATEWAY_API_KEY`, `COPILOT_GITHUB_TOKEN`, `DASHSCOPE_API_KEY`, `DEEPINFRA_API_KEY`, `DEEPSEEK_API_KEY`, `FIREWORKS_API_KEY`, `GEMINI_API_KEY`, `GH_TOKEN`, `GITHUB_TOKEN`, `GLM_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `HF_TOKEN`, `HUGGINGFACE_HUB_TOKEN`, `KILOCODE_API_KEY`, `KIMICODE_API_KEY`, `KIMI_API_KEY`, `MINIMAX_API_KEY`, `MINIMAX_CODING_API_KEY`, `MISTRAL_API_KEY`, `MODELSTUDIO_API_KEY`, `MOONSHOT_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `OPENCODE_API_KEY`, `OPENCODE_GO_API_KEY`, `OPENCODE_ZEN_API_KEY`, `OPENROUTER_API_KEY`, `QIANFAN_API_KEY`, `QWEN_API_KEY`, `TOGETHER_API_KEY`, `VENICE_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`, `ZAI_API_KEY`, `Z_AI_API_KEY`.

### حالة مخصصة للأرشفة فقط

تُنسخ حالة Hermes التي لا يستطيع OpenClaw تفسيرها بأمان إلى تقرير الترحيل للمراجعة اليدوية، لكنها لا تُحمّل في إعدادات OpenClaw النشطة أو بيانات الاعتماد. يحافظ ذلك على الحالة المبهمة أو غير الآمنة من دون الادعاء بأن OpenClaw يستطيع تنفيذها أو الوثوق بها تلقائيًا: `plugins/`، و`sessions/`، و`logs/`، و`cron/`، و`mcp-tokens/`، و`state.db`.

### بعد التطبيق

```bash
openclaw doctor
```

## عقد Plugin

مصادر الترحيل هي إضافات. تعلن الإضافة عن معرّفات موفّريها في `openclaw.plugin.json`:

```json
{
  "contracts": {
    "migrationProviders": ["hermes"]
  }
}
```

في وقت التشغيل، تستدعي الإضافة `api.registerMigrationProvider(...)`. ينفّذ الموفّر الدوال `detect` و`plan` و`apply`. يتولى النواة تنسيق CLI وسياسة النسخ الاحتياطي والمطالبات وإخراج JSON والفحص المسبق للتعارضات. تمرّر النواة الخطة التي تمت مراجعتها إلى `apply(ctx, plan)`، ولا يجوز للموفّرين إعادة بناء الخطة إلا عندما تكون تلك الوسيطة غير موجودة لأغراض التوافق.

يمكن لإضافات الموفّرين استخدام `openclaw/plugin-sdk/migration` لإنشاء العناصر وحسابات الملخص، بالإضافة إلى `openclaw/plugin-sdk/migration-runtime` لنسخ الملفات مع مراعاة التعارضات، ونسخ التقارير المخصصة للأرشفة فقط، وأغلفة وقت تشغيل الإعدادات المخزنة مؤقتًا، وتقارير الترحيل.

## التكامل مع الإعداد الأولي

يمكن للإعداد الأولي عرض الترحيل عندما يكتشف الموفّر مصدرًا معروفًا. يستخدم كل من `openclaw onboard --flow import` و`openclaw setup --wizard --import-from hermes` موفّر ترحيل الإضافة نفسه، ويعرضان مع ذلك معاينة قبل التطبيق.

<Note>
تتطلب عمليات الاستيراد أثناء الإعداد الأولي إعدادًا جديدًا لـ OpenClaw. أعد ضبط الإعدادات وبيانات الاعتماد والجلسات ومساحة العمل أولًا إذا كانت لديك حالة محلية بالفعل. تخضع عمليات الاستيراد باستخدام النسخ الاحتياطي مع الاستبدال أو الدمج لبوابة ميزات في الإعدادات الحالية.
</Note>

## ذو صلة

- [الترحيل من Hermes](/ar/install/migrating-hermes): دليل إرشادي موجّه للمستخدم.
- [الترحيل من Claude](/ar/install/migrating-claude): دليل إرشادي موجّه للمستخدم.
- [الترحيل](/ar/install/migrating): نقل OpenClaw إلى جهاز جديد.
- [الطبيب](/ar/gateway/doctor): فحص السلامة بعد تطبيق عملية ترحيل.
- [الإضافات](/ar/tools/plugin): تثبيت الإضافات وتسجيلها.

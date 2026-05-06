---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، الأسماء المستعارة، البدائل الاحتياطية، auth)
title: النماذج
x-i18n:
    generated_at: "2026-05-06T19:35:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

اكتشاف النماذج وفحصها وتكوينها (النموذج الافتراضي، وخيارات الاحتياط، وملفات تعريف المصادقة).

ذات صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر الشرطة المائلة `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [بدء الاستخدام](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيم المحلولة للنموذج الافتراضي/خيارات الاحتياط إضافة إلى نظرة عامة على المصادقة.
عند توفر لقطات استخدام المزوّدين، يتضمن قسم حالة OAuth/مفتاح API نوافذ استخدام المزوّدين ولقطات الحصص.
مزوّدو نوافذ الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI، وOpenAI
Codex، وMiniMax، وXiaomi، وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بالمزوّد
عند توفرها؛ وإلا يرجع OpenClaw إلى بيانات اعتماد OAuth/مفتاح API المطابقة
من ملفات تعريف المصادقة أو البيئة أو التكوين.
في مخرجات `--json`، يكون `auth.providers` هو العرض العام للمزوّدين الواعي بالبيئة/التكوين/المخزن،
بينما يكون `auth.oauth` خاصًا بصحة ملفات تعريف مخزن المصادقة فقط.
أضف `--probe` لتشغيل فحوصات مصادقة حية على كل ملف تعريف مزوّد مكوّن.
الفحوصات هي طلبات حقيقية (قد تستهلك رموزًا وتؤدي إلى حدود معدل).
استخدم `--agent <id>` لفحص حالة النموذج/المصادقة لوكيل مكوّن. عند حذفه،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كان مضبوطًا، وإلا يستخدم
الوكيل الافتراضي المكوّن.
يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة أو بيانات اعتماد البيئة أو `models.json`.
لاستكشاف مشكلات Codex OAuth، فإن `openclaw models status`،
و`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` هي أسرع طريقة
لتأكيد ما إذا كان الوكيل يستخدم `openai-codex/*` عبر PI أو `openai/*`
عبر وقت تشغيل Codex الأصلي. راجع [إعداد مزوّد OpenAI](/ar/providers/openai#check-and-recover-codex-oauth-routing).

ملاحظات:

- يقبل `models set <model-or-alias>` الصيغة `provider/model` أو اسمًا مستعارًا.
- `models list` للقراءة فقط: يقرأ التكوين، وملفات تعريف المصادقة، وحالة الكتالوج الحالية،
  وصفوف الكتالوج المملوكة للمزوّد، لكنه لا يعيد كتابة
  `models.json`.
- عمود `Auth` على مستوى المزوّد وللقراءة فقط. يُحسب من بيانات تعريف ملف تعريف المصادقة المحلي،
  وعلامات البيئة، ومفاتيح المزوّدين المكوّنة، وعلامات المزوّد المحلي،
  وعلامات بيئة/ملف تعريف AWS Bedrock، وبيانات تعريف المصادقة الاصطناعية الخاصة بالـ plugin؛
  ولا يحمّل وقت تشغيل المزوّد، أو يقرأ أسرار keychain، أو يستدعي واجهات API الخاصة بالمزوّد،
  أو يثبت الجاهزية الدقيقة للتنفيذ لكل نموذج.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف كتالوج ثابتة مملوكة للمزوّد
  من بيانات manifest الخاصة بالـ plugin أو بيانات تعريف كتالوج المزوّدين المضمّنة حتى عندما
  لا تكون قد صادقت مع ذلك المزوّد بعد. تظل هذه الصفوف تظهر
  على أنها غير متاحة حتى يتم تكوين المصادقة المطابقة.
- يحافظ `models list` على استجابة مستوى التحكم أثناء بطء اكتشاف كتالوج المزوّد.
  تعود العروض الافتراضية والمكوّنة إلى صفوف نماذج مكوّنة أو
  اصطناعية بعد انتظار قصير وتدع الاكتشاف يكتمل في
  الخلفية. استخدم `--all` عندما تحتاج إلى الكتالوج المكتشف الكامل الدقيق
  وتكون مستعدًا لانتظار اكتشاف المزوّد.
- يدمج `models list --all` الواسع صفوف كتالوج manifest فوق صفوف السجل
  دون تحميل خطافات تكميل وقت تشغيل المزوّد. تستخدم المسارات السريعة المفلترة حسب المزوّد في manifest
  المزوّدين المعلّمين بـ `static` فقط؛ ويبقى المزوّدون المعلّمون بـ `refreshable`
  مدعومين بالسجل/الذاكرة المؤقتة ويلحقون صفوف manifest كإضافات، بينما
  يبقى المزوّدون المعلّمون بـ `runtime` على اكتشاف السجل/وقت التشغيل.
- يحافظ `models list` على فصل بيانات تعريف النموذج الأصلية وحدود وقت التشغيل. في مخرجات الجدول،
  يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف حد وقت التشغيل الفعّال
  عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON القيمة `contextTokens`
  عندما يعرّض المزوّد ذلك الحد.
- يفلتر `models list --provider <id>` حسب معرّف المزوّد، مثل `moonshot` أو
  `openai-codex`. ولا يقبل تسميات العرض من منتقيات المزوّدين التفاعلية،
  مثل `Moonshot AI`.
- تُحلل مراجع النماذج بالتقسيم على **أول** `/`. إذا كان معرّف النموذج يتضمن `/` (بنمط OpenRouter)، فأدرج بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحل OpenClaw الإدخال كاسم مستعار أولًا، ثم
  كتطابق فريد لمزوّد مكوّن لذلك المعرّف الدقيق للنموذج، وبعد ذلك فقط
  يرجع إلى المزوّد الافتراضي المكوّن مع تحذير إهمال.
  إذا لم يعد ذلك المزوّد يعرّض النموذج الافتراضي المكوّن، فإن OpenClaw
  يرجع إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار
  قيمة افتراضية قديمة لمزوّد مُزال.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (مثل `OPENAI_API_KEY`، و`secretref-managed`، و`minimax-oauth`، و`oauth:chutes`، و`ollama-local`) بدلًا من إخفائها كأسرار.

### فحص النماذج

يقرأ `models scan` كتالوج OpenRouter العام `:free` ويرتب المرشحين لاستخدامهم
كخيارات احتياط. الكتالوج نفسه عام، لذلك لا تحتاج الفحوصات الخاصة بالبيانات التعريفية فقط
إلى مفتاح OpenRouter.

افتراضيًا، يحاول OpenClaw فحص دعم الأدوات والصور باستدعاءات نماذج حية.
إذا لم يتم تكوين مفتاح OpenRouter، يرجع الأمر إلى مخرجات بيانات تعريفية فقط
ويوضح أن نماذج `:free` لا تزال تتطلب `OPENROUTER_API_KEY` لإجراء
الفحوصات والاستدلال.

الخيارات:

- `--no-probe` (بيانات تعريفية فقط؛ دون بحث في التكوين/الأسرار)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (مهلة طلب الكتالوج وكل فحص)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` فحوصات حية؛ نتائج الفحص الخاصة بالبيانات التعريفية فقط
معلوماتية ولا تُطبّق على التكوين.

### حالة النماذج

الخيارات:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (فحص حي لملفات تعريف المصادقة المكوّنة)
- `--probe-provider <name>` (فحص مزوّد واحد)
- `--probe-profile <id>` (معرّفات ملفات تعريف مكررة أو مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف وكيل مكوّن؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

يحافظ `--json` على stdout مخصصًا لحمولة JSON. تُوجّه تشخيصات ملف تعريف المصادقة والمزوّد
وبدء التشغيل إلى stderr كي تتمكن السكربتات من تمرير stdout مباشرة
إلى أدوات مثل `jq`.

مجموعات حالة الفحص:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات تفاصيل الفحص/رموز السبب المتوقعة:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزن، لكن
  `auth.order.<provider>` الصريح حذفه، لذلك يبلّغ الفحص عن الاستبعاد بدلًا من
  تجربته.
- `missing_credential`، و`invalid_expires`، و`expired`، و`unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للحل.
- `no_model`: مصادقة المزوّد موجودة، لكن OpenClaw لم يتمكن من حل
  مرشح نموذج قابل للفحص لذلك المزوّد.

## الأسماء المستعارة + خيارات الاحتياط

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ملفات تعريف المصادقة

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` هو مساعد المصادقة التفاعلي. يمكنه تشغيل مسار مصادقة مزوّد
(OAuth/مفتاح API) أو إرشادك إلى لصق رمز يدويًا، اعتمادًا على
المزوّد الذي تختاره.

يعرض `models auth list` ملفات تعريف المصادقة المحفوظة للوكيل المحدد دون
طباعة الرمز أو مفتاح API أو مواد سر OAuth. استخدم `--provider <id>` من أجل
التصفية إلى مزوّد واحد، مثل `openai-codex`، و`--json` للسكربتات.

يشغّل `models auth login` مسار مصادقة plugin المزوّد (OAuth/مفتاح API). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبتين.
استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى
مخزن وكيل مكوّن محدد. يُحترم علم الأصل `--agent` من قِبل
`add`، و`list`، و`login`، و`setup-token`، و`paste-token`، و
`login-github-copilot`.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

ملاحظات:

- يظل `setup-token` و`paste-token` أمرين عامين للرموز للمزوّدين
  الذين يعرّضون طرق مصادقة بالرموز.
- يتطلب `setup-token` طرفية TTY تفاعلية ويشغّل طريقة مصادقة الرمز الخاصة بالمزوّد
  (مع الافتراض إلى طريقة `setup-token` الخاصة بذلك المزوّد عندما يعرّض
  واحدة).
- يقبل `paste-token` سلسلة رمز تم إنشاؤها في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطالب بقيمة الرمز، ويكتبها
  إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزن `paste-token --expires-in <duration>` انتهاء صلاحية مطلقًا للرمز من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل Anthropic `setup-token` / `paste-token` متاحين كمسار رمز مدعوم من OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

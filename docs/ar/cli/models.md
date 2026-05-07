---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد استعراض النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، الأسماء المستعارة، البدائل الاحتياطية، المصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-05-07T13:14:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

اكتشاف النماذج وفحصها وتكوينها (النموذج الافتراضي، والبدائل الاحتياطية، وملفات تعريف المصادقة).

ذات صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النماذج + أمر slash ‏`/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [بدء الاستخدام](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` القيمة الافتراضية/البدائل الاحتياطية التي تم حلها، إضافة إلى نظرة عامة على المصادقة.
عندما تتوفر لقطات استخدام المزوّد، يتضمن قسم حالة OAuth/API-key
نوافذ استخدام المزوّد ولقطات الحصص.
مزوّدو نافذة الاستخدام الحاليون: Anthropic وGitHub Copilot وGemini CLI وOpenAI
Codex وMiniMax وXiaomi وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بالمزوّد
عند توفرها؛ وإلا يعود OpenClaw إلى بيانات اعتماد OAuth/API-key المطابقة
من ملفات تعريف المصادقة أو env أو config.
في مخرجات `--json`، يمثل `auth.providers` النظرة العامة للمزوّد الواعية بـ env/config/store،
بينما يمثل `auth.oauth` صحة ملفات تعريف auth-store فقط.
أضف `--probe` لتشغيل فحوصات مصادقة حية ضد كل ملف تعريف مزوّد مكوّن.
الفحوصات هي طلبات حقيقية (قد تستهلك رموزًا وتؤدي إلى حدود معدل).
استخدم `--agent <id>` لفحص حالة النموذج/المصادقة لوكيل مكوّن. عند حذفه،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كانا مضبوطين، وإلا يستخدم
الوكيل الافتراضي المكوّن.
يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة أو بيانات اعتماد env أو `models.json`.
لاستكشاف أخطاء Codex OAuth، تعد `openclaw models status`،
و`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` أسرع طريقة
لتأكيد ما إذا كان لدى الوكيل ملف تعريف مصادقة `openai-codex` قابل للاستخدام لـ
`openai/*` عبر وقت تشغيل Codex الأصلي. راجع [إعداد مزوّد OpenAI](/ar/providers/openai#check-and-recover-codex-oauth-routing).

ملاحظات:

- يقبل `models set <model-or-alias>` الصيغة `provider/model` أو اسمًا مستعارًا.
- `models list` للقراءة فقط: يقرأ config وملفات تعريف المصادقة وحالة الكتالوج الحالية
  وصفوف الكتالوج المملوكة للمزوّد، لكنه لا يعيد كتابة
  `models.json`.
- عمود `Auth` على مستوى المزوّد وللقراءة فقط. يتم حسابه من بيانات تعريف ملفات تعريف المصادقة
  المحلية، وعلامات env، ومفاتيح المزوّد المكوّنة، وعلامات المزوّد المحلي،
  وعلامات env/profile الخاصة بـ AWS Bedrock، وبيانات تعريف المصادقة الاصطناعية الخاصة بالـ plugin؛
  ولا يحمّل وقت تشغيل المزوّد، أو يقرأ أسرار keychain، أو يستدعي واجهات API الخاصة بالمزوّد،
  أو يثبت جاهزية التنفيذ الدقيقة لكل نموذج.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف كتالوج ثابتة مملوكة للمزوّد
  من بيانات plugin manifests أو بيانات تعريف كتالوج المزوّد المضمّنة حتى عندما
  لا تكون قد صادقت مع ذلك المزوّد بعد. تظل تلك الصفوف تظهر
  على أنها غير متاحة حتى يتم تكوين المصادقة المطابقة.
- يحافظ `models list` على استجابة مستوى التحكم أثناء بطء اكتشاف كتالوج المزوّد.
  تعود عروض الافتراضي والمكوّن إلى صفوف نماذج مكوّنة أو
  اصطناعية بعد انتظار قصير وتسمح للاكتشاف بالانتهاء في
  الخلفية. استخدم `--all` عندما تحتاج إلى الكتالوج المكتشف الكامل الدقيق
  وتكون مستعدًا لانتظار اكتشاف المزوّد.
- يدمج `models list --all` الواسع صفوف كتالوج manifest فوق صفوف السجل
  دون تحميل خطافات تكميل وقت تشغيل المزوّد. تستخدم المسارات السريعة للـ manifest
  المفلترة حسب المزوّد فقط المزوّدين المعلّمين `static`؛ أما المزوّدون المعلّمون `refreshable`
  فيبقون معتمدين على السجل/ذاكرة التخزين المؤقت ويضيفون صفوف manifest كتكميلات، بينما
  يبقى المزوّدون المعلّمون `runtime` على اكتشاف السجل/وقت التشغيل.
- يحافظ `models list` على فصل بيانات تعريف النموذج الأصلية عن حدود وقت التشغيل. في مخرجات الجدول،
  يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف حد وقت التشغيل الفعّال
  عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON القيمة `contextTokens`
  عندما يكشف المزوّد ذلك الحد.
- يرشّح `models list --provider <id>` حسب معرّف المزوّد، مثل `moonshot` أو
  `openai-codex`. لا يقبل تسميات العرض من منتقيات المزوّدين التفاعلية،
  مثل `Moonshot AI`.
- يتم تحليل مراجع النماذج بالتقسيم عند **أول** `/`. إذا كان معرّف النموذج يتضمن `/` (بأسلوب OpenRouter)، فضمّن بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحل OpenClaw الإدخال كاسم مستعار أولًا، ثم
  كتطابق فريد لمزوّد مكوّن لمعرّف النموذج الدقيق ذاك، وبعد ذلك فقط
  يعود إلى المزوّد الافتراضي المكوّن مع تحذير إهمال.
  إذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المكوّن، فإن OpenClaw
  يعود إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار
  افتراضي قديم لمزوّد تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (على سبيل المثال `OPENAI_API_KEY` و`secretref-managed` و`minimax-oauth` و`oauth:chutes` و`ollama-local`) بدلًا من إخفائها كأسرار.

### فحص النماذج

يقرأ `models scan` كتالوج `:free` العام الخاص بـ OpenRouter ويرتّب المرشحين
لاستخدامهم كبدائل احتياطية. الكتالوج نفسه عام، لذلك لا تحتاج الفحوصات المعتمدة على بيانات التعريف فقط
إلى مفتاح OpenRouter.

افتراضيًا يحاول OpenClaw فحص دعم الأدوات والصور باستدعاءات نماذج حية.
إذا لم يتم تكوين مفتاح OpenRouter، يعود الأمر إلى مخرجات بيانات التعريف فقط
ويوضح أن نماذج `:free` لا تزال تتطلب `OPENROUTER_API_KEY` من أجل
الفحوصات والاستدلال.

الخيارات:

- `--no-probe` (بيانات التعريف فقط؛ لا بحث في config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (طلب الكتالوج ومهلة كل فحص)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` فحوصات حية؛ نتائج الفحص المعتمدة على بيانات التعريف فقط
معلوماتية ولا تطبّق على config.

### حالة النماذج

الخيارات:

- `--json`
- `--plain`
- `--check` (رمز الخروج 1=منتهي/مفقود، 2=شارف على الانتهاء)
- `--probe` (فحص حي لملفات تعريف المصادقة المكوّنة)
- `--probe-provider <name>` (فحص مزوّد واحد)
- `--probe-profile <id>` (معرّفات ملفات تعريف مكررة أو مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف الوكيل المكوّن؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

يحافظ `--json` على stdout محجوزًا لحمولة JSON. يتم توجيه تشخيصات ملف تعريف المصادقة والمزوّد
وبدء التشغيل إلى stderr حتى تتمكن السكربتات من تمرير stdout مباشرة
إلى أدوات مثل `jq`.

حاويات حالة الفحص:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

حالات تفاصيل/رموز سبب الفحص المتوقعة:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزّن، لكن
  `auth.order.<provider>` الصريح حذفه، لذلك يبلّغ الفحص عن الاستبعاد بدلًا من
  تجربته.
- `missing_credential`، `invalid_expires`، `expired`، `unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/قابل للحل.
- `no_model`: توجد مصادقة المزوّد، لكن OpenClaw لم يتمكن من حل مرشح نموذج
  قابل للفحص لذلك المزوّد.

## الأسماء المستعارة + البدائل الاحتياطية

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

`models auth add` هو مساعد المصادقة التفاعلي. يمكنه تشغيل تدفق مصادقة مزوّد
(OAuth/API key) أو إرشادك إلى لصق الرمز يدويًا، بناءً على
المزوّد الذي تختاره.

يسرد `models auth list` ملفات تعريف المصادقة المحفوظة للوكيل المحدد دون
طباعة الرمز أو API-key أو مادة سر OAuth. استخدم `--provider <id>` من أجل
التصفية إلى مزوّد واحد، مثل `openai-codex`، و`--json` للبرمجة النصية.

يشغّل `models auth login` تدفق مصادقة Plugin الخاص بالمزوّد (OAuth/API key). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبتين.
استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى
مخزن وكيل مكوّن محدد. يتم احترام علم الأصل `--agent` بواسطة
`add`، و`list`، و`login`، و`setup-token`، و`paste-token`، و
`login-github-copilot`.

أمثلة:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

ملاحظات:

- يظل `setup-token` و`paste-token` أمرين عامين للرموز للمزوّدين
  الذين يكشفون طرق مصادقة بالرمز.
- يتطلب `setup-token` TTY تفاعليًا ويشغّل طريقة مصادقة الرمز الخاصة بالمزوّد
  (مع الرجوع افتراضيًا إلى طريقة `setup-token` لذلك المزوّد عندما يكشف
  واحدة).
- يقبل `paste-token` سلسلة رمز تم إنشاؤها في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` العلم `--provider`، ويطلب قيمة الرمز، ويكتبها
  إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزّن `paste-token --expires-in <duration>` انتهاء صلاحية رمز مطلقًا من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بأسلوب OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` كاستخدام مصرح به لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل `setup-token` / `paste-token` الخاصان بـ Anthropic متاحين كمسار رمز مدعوم في OpenClaw، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تحويل فشل النموذج](/ar/concepts/model-failover)

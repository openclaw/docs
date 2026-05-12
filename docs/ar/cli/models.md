---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، الأسماء المستعارة، البدائل الاحتياطية، المصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-05-12T00:59:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

اكتشاف النماذج وفحصها وتكوينها (النموذج الافتراضي، وآليات الرجوع، وملفات تعريف المصادقة).

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

يعرض `openclaw models status` الإعداد الافتراضي/آليات الرجوع التي تم حلها، إضافة إلى نظرة عامة على المصادقة.
عندما تتوفر لقطات استخدام المزوّد، يتضمن قسم حالة OAuth/مفتاح API
نوافذ استخدام المزوّد ولقطات الحصص.
مزوّدو نوافذ الاستخدام الحاليون: Anthropic، وGitHub Copilot، وGemini CLI، وOpenAI
Codex، وMiniMax، وXiaomi، وz.ai. تأتي مصادقة الاستخدام من خطاطيف خاصة بالمزوّد
عند توفرها؛ وإلا يرجع OpenClaw إلى مطابقة بيانات اعتماد OAuth/مفتاح API
من ملفات تعريف المصادقة أو env أو config.
في مخرجات `--json`، يكون `auth.providers` هو النظرة العامة للمزوّد
الواعية بـ env/config/store، بينما يكون `auth.oauth` هو صحة ملفات تعريف مخزن المصادقة فقط.
أضف `--probe` لتشغيل فحوصات مصادقة حية على كل ملف تعريف مزوّد مكوّن.
الفحوصات هي طلبات حقيقية (قد تستهلك الرموز وتؤدي إلى حدود معدل).
استخدم `--agent <id>` لفحص حالة نموذج/مصادقة وكيل مكوّن. عند حذفه،
يستخدم الأمر `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` إذا كانا معيّنين، وإلا يستخدم
الوكيل الافتراضي المكوّن.
يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة، أو بيانات اعتماد env، أو `models.json`.
لاستكشاف مشكلات OAuth في Codex، تكون `openclaw models status`،
و`openclaw models auth list --provider openai-codex`، و
`openclaw config get agents.defaults.model --json` أسرع طريقة
للتأكد مما إذا كان لدى الوكيل ملف تعريف مصادقة `openai-codex` قابل للاستخدام لـ
`openai/*` عبر وقت تشغيل Codex الأصلي. راجع [إعداد مزوّد OpenAI](/ar/providers/openai#check-and-recover-codex-oauth-routing).

ملاحظات:

- يقبل `models set <model-or-alias>` الصيغة `provider/model` أو اسمًا مستعارًا.
- `models list` للقراءة فقط: يقرأ config وملفات تعريف المصادقة وحالة الفهرس
  الموجودة وصفوف الفهرس المملوكة للمزوّد، لكنه لا يعيد كتابة
  `models.json`.
- عمود `Auth` على مستوى المزوّد وللقراءة فقط. يُحسب من بيانات تعريف ملفات
  تعريف المصادقة المحلية، وعلامات env، ومفاتيح المزوّد المكوّنة، وعلامات المزوّد
  المحلي، وعلامات env/profile في AWS Bedrock، وبيانات تعريف المصادقة الاصطناعية في Plugin؛
  ولا يحمّل وقت تشغيل المزوّد، ولا يقرأ أسرار keychain، ولا يستدعي واجهات API
  للمزوّد، ولا يثبت جاهزية التنفيذ الدقيقة لكل نموذج.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف فهرس ثابتة مملوكة للمزوّد
  من بيانات Plugin manifests أو بيانات تعريف فهرس المزوّد المجمّع حتى عندما
  لا تكون قد صادقت مع ذلك المزوّد بعد. تظل تلك الصفوف تظهر كغير متاحة
  إلى أن تُكوَّن مصادقة مطابقة.
- يحافظ `models list` على استجابة مستوى التحكم أثناء بطء اكتشاف فهرس المزوّد.
  ترجع العروض الافتراضية والمكوّنة إلى صفوف نماذج مكوّنة أو اصطناعية
  بعد انتظار قصير وتتيح للاكتشاف أن يكتمل في الخلفية. استخدم `--all`
  عندما تحتاج إلى الفهرس الكامل المكتشف بدقة وتكون مستعدًا لانتظار اكتشاف المزوّد.
- يدمج `models list --all` الواسع صفوف فهرس manifest فوق صفوف السجل
  من دون تحميل خطاطيف ملحق وقت تشغيل المزوّد. تستخدم المسارات السريعة لتصفية المزوّد عبر manifest
  المزوّدين المعلّمين بـ `static` فقط؛ أما المزوّدون المعلّمون بـ `refreshable`
  فيبقون مدعومين بالسجل/الذاكرة المخبئية ويضيفون صفوف manifest كملحقات، بينما
  يبقى المزوّدون المعلّمون بـ `runtime` على اكتشاف السجل/وقت التشغيل.
- يحافظ `models list` على تمييز بيانات تعريف النموذج الأصلية وحدود وقت التشغيل. في مخرجات الجدول،
  يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف حد وقت التشغيل الفعّال
  عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON الحقل `contextTokens`
  عندما يكشف المزوّد ذلك الحد.
- يرشّح `models list --provider <id>` حسب معرّف المزوّد، مثل `moonshot` أو
  `openai-codex`. ولا يقبل تسميات العرض من منتقيات المزوّد التفاعلية،
  مثل `Moonshot AI`.
- تُحلل مراجع النماذج بالتقسيم عند أول `/`. إذا كان معرّف النموذج يتضمن `/` (بنمط OpenRouter)، فأدرج بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحل OpenClaw الإدخال كاسم مستعار أولًا، ثم
  كمطابقة فريدة لمزوّد مكوّن لذلك المعرّف الدقيق للنموذج، وعندها فقط
  يرجع إلى المزوّد الافتراضي المكوّن مع تحذير إهمال.
  إذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المكوّن، فإن OpenClaw
  يرجع إلى أول مزوّد/نموذج مكوّن بدلًا من إظهار إعداد افتراضي قديم
  لمزوّد مُزال.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (على سبيل المثال `OPENAI_API_KEY`، و`secretref-managed`، و`minimax-oauth`، و`oauth:chutes`، و`ollama-local`) بدلًا من حجبها كأسرار.

### فحص النماذج

يقرأ `models scan` فهرس OpenRouter العام `:free` ويرتب المرشحين
لاستخدامهم كرجوع. الفهرس نفسه عام، لذلك لا تحتاج الفحوصات التي تقتصر على بيانات التعريف
إلى مفتاح OpenRouter.

افتراضيًا يحاول OpenClaw فحص دعم الأدوات والصور باستدعاءات نماذج حية.
إذا لم يُكوَّن مفتاح OpenRouter، يرجع الأمر إلى مخرجات تقتصر على بيانات التعريف
ويوضح أن نماذج `:free` ما زالت تتطلب `OPENROUTER_API_KEY` من أجل
الفحوصات والاستدلال.

الخيارات:

- `--no-probe` (بيانات تعريف فقط؛ بلا بحث في config/الأسرار)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (طلب الفهرس ومهلة كل فحص)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` فحوصات حية؛ أما نتائج الفحص التي تقتصر
على بيانات التعريف فهي معلوماتية ولا تُطبّق على config.

### حالة النماذج

الخيارات:

- `--json`
- `--plain`
- `--check` (رمز الخروج 1=منتهي/مفقود، 2=يوشك على الانتهاء)
- `--probe` (فحص حي لملفات تعريف المصادقة المكوّنة)
- `--probe-provider <name>` (فحص مزوّد واحد)
- `--probe-profile <id>` (معرّفات ملفات تعريف مكررة أو مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرّف الوكيل المكوّن؛ يتجاوز `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

يحافظ `--json` على stdout مخصصًا لحمولة JSON. تُوجَّه تشخيصات ملف تعريف المصادقة، والمزوّد،
وبدء التشغيل إلى stderr حتى تتمكن السكربتات من تمرير stdout مباشرة
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

- `excluded_by_auth_order`: يوجد ملف تعريف مخزّن، لكن
  `auth.order.<provider>` الصريح أغفله، لذلك يبلّغ الفحص عن الاستبعاد بدلًا من
  تجربته.
- `missing_credential`، و`invalid_expires`، و`expired`، و`unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للحل.
- `no_model`: مصادقة المزوّد موجودة، لكن OpenClaw لم يتمكن من حل مرشح
  نموذج قابل للفحص لذلك المزوّد.

## الأسماء المستعارة + آليات الرجوع

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
(OAuth/مفتاح API) أو إرشادك إلى لصق رمز يدويًا، بحسب
المزوّد الذي تختاره.

يسرد `models auth list` ملفات تعريف المصادقة المحفوظة للوكيل المحدد من دون
طباعة الرمز، أو مفتاح API، أو مادة سر OAuth. استخدم `--provider <id>` من أجل
التصفية إلى مزوّد واحد، مثل `openai-codex`، و`--json` للسكربتات.

يشغّل `models auth login` مسار مصادقة Plugin لمزوّد (OAuth/مفتاح API). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبتين.
استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى
مخزن وكيل مكوّن محدد. تُحترم راية الأصل `--agent` بواسطة
`add`، و`list`، و`login`، و`setup-token`، و`paste-token`، و
`login-github-copilot`.

بالنسبة إلى نماذج OpenAI، يكون `--provider openai` افتراضيًا لتسجيل الدخول إلى حساب ChatGPT/Codex.
استخدم `--method api-key` فقط عندما تريد إضافة ملف تعريف مفتاح OpenAI API،
عادة كنسخة احتياطية لحدود اشتراك Codex. ما زالت صياغة
`--provider openai-codex` القديمة تعمل للسكربتات الموجودة.

أمثلة:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

ملاحظات:

- يظل `setup-token` و`paste-token` أوامر رموز عامة للمزوّدين
  الذين يكشفون طرق مصادقة بالرموز.
- يتطلب `setup-token` TTY تفاعليًا ويشغّل طريقة مصادقة الرمز الخاصة بالمزوّد
  (مع الافتراض إلى طريقة `setup-token` لذلك المزوّد عندما يكشف
  واحدة).
- يقبل `paste-token` سلسلة رمز مولّدة في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطالب بقيمة الرمز، ويكتبها
  إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- يخزن `paste-token --expires-in <duration>` انتهاء صلاحية رمز مطلقًا من
  مدة نسبية مثل `365d` أو `12h`.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` كأمر مصرح به لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل Anthropic `setup-token` / `paste-token` متاحين كمسار رمز OpenClaw مدعوم، لكن OpenClaw يفضّل الآن إعادة استخدام Claude CLI و`claude -p` عندما يكونان متاحين.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (status/list/set/scan، الأسماء البديلة، آليات الرجوع الاحتياطي، المصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-06-27T17:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

اكتشاف النماذج وفحصها وتكوينها (النموذج الافتراضي، الاحتياطيات، ملفات تعريف المصادقة).

ذات صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر الشرطة المائلة `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [البدء](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

يعرض `openclaw models status` الاحتياطيات/الافتراضي المحلول مع نظرة عامة على المصادقة.
عندما تكون لقطات استخدام المزوّدين متاحة، يتضمن قسم حالة OAuth/API-key
نوافذ استخدام المزوّدين ولقطات الحصص.
مزوّدو نوافذ الاستخدام الحاليون: Anthropic وGitHub Copilot وGemini CLI وOpenAI
وMiniMax وXiaomi وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بالمزوّدين
عند توفرها؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/API-key
من ملفات تعريف المصادقة أو env أو التكوين.
في مخرج `--json`، يكون `auth.providers` هو النظرة العامة للمزوّد
الواعية بـ env/config/store، بينما يكون `auth.oauth` صحة ملفات تعريف مخزن المصادقة فقط.
أضف `--probe` لتشغيل فحوصات مصادقة حية على كل ملف تعريف مزوّد مكوّن.
الفحوصات هي طلبات حقيقية (قد تستهلك رموزا وتؤدي إلى حدود معدل).
استخدم `--agent <id>` لفحص حالة نموذج/مصادقة وكيل مكوّن. عند حذفه،
يستخدم الأمر `OPENCLAW_AGENT_DIR` إذا كان مضبوطا، وإلا يستخدم
الوكيل الافتراضي المكوّن.
يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة أو بيانات اعتماد env أو `models.json`.
لاستكشاف أخطاء OAuth في OpenAI ChatGPT/Codex، تعد `openclaw models status`
و`openclaw models auth list --provider openai` و
`openclaw config get agents.defaults.model --json` أسرع طريقة
لتأكيد ما إذا كان لدى الوكيل ملف تعريف OAuth صالحا لـ `openai`
من أجل `openai/*` عبر وقت تشغيل Codex الأصلي. راجع [إعداد مزوّد OpenAI](/ar/providers/openai#check-and-recover-codex-oauth-routing).

ملاحظات:

- يقبل `models set <model-or-alias>` صيغة `provider/model` أو اسما مستعارا.
- `models list` للقراءة فقط: يقرأ التكوين وملفات تعريف المصادقة وحالة الفهرس
  الحالية وصفوف الفهرس المملوكة للمزوّدين، لكنه لا يعيد كتابة
  `models.json`.
- عمود `Auth` على مستوى المزوّد وللقراءة فقط. يتم حسابه من بيانات تعريف
  ملف تعريف المصادقة المحلية، وعلامات env، ومفاتيح المزوّدين المكوّنة، وعلامات المزوّدين المحليين،
  وعلامات env/profile الخاصة بـ AWS Bedrock، وبيانات تعريف المصادقة الاصطناعية الخاصة بالـ Plugin؛
  ولا يحمّل وقت تشغيل المزوّد، ولا يقرأ أسرار keychain، ولا يستدعي
  واجهات API للمزوّدين، ولا يثبت الجاهزية الدقيقة للتنفيذ لكل نموذج.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف فهرس ثابتة مملوكة للمزوّد
  من بيانات Plugin manifests أو بيانات تعريف فهرس المزوّد المضمّن حتى عندما
  لا تكون قد صادقت مع ذلك المزوّد بعد. تظل تلك الصفوف تظهر على أنها
  غير متاحة حتى يتم تكوين مصادقة مطابقة.
- يحافظ `models list` على استجابة مستوى التحكم أثناء بطء اكتشاف فهرس المزوّد.
  تعود العروض الافتراضية والمكوّنة إلى صفوف نماذج مكوّنة أو
  اصطناعية بعد انتظار قصير وتترك الاكتشاف ينتهي في
  الخلفية. استخدم `--all` عندما تحتاج إلى الفهرس المكتشف الكامل الدقيق
  وتكون مستعدا لانتظار اكتشاف المزوّد.
- يدمج `models list --all` الواسع صفوف فهرس manifest فوق صفوف السجل
  من دون تحميل خطافات تكميلية لوقت تشغيل المزوّد. تستخدم المسارات السريعة لبيانات manifest
  المفلترة حسب المزوّد فقط المزوّدين الموسومين `static`؛ أما المزوّدون الموسومون `refreshable`
  فيبقون مدعومين بالسجل/الذاكرة المخبأة ويلحقون صفوف manifest كملحقات، بينما
  يبقى المزوّدون الموسومون `runtime` على اكتشاف السجل/وقت التشغيل.
- يحافظ `models list` على فصل بيانات تعريف النموذج الأصلية وحدود وقت التشغيل. في مخرج الجدول،
  يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف حد وقت التشغيل الفعال
  عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON القيمة `contextTokens`
  عندما يكشف المزوّد ذلك الحد.
- يرشح `models list --provider <id>` حسب معرف المزوّد، مثل `moonshot` أو
  `openai`. لا يقبل تسميات العرض من ملتقطات المزوّدين التفاعلية،
  مثل `Moonshot AI`.
- يتم تحليل مراجع النماذج بالتقسيم عند **أول** `/`. إذا كان معرف النموذج يتضمن `/` (نمط OpenRouter)، فأدرج بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحل OpenClaw الإدخال كاسم مستعار أولا، ثم
  كمطابقة فريدة لمزوّد مكوّن لذلك المعرف الدقيق للنموذج، وبعد ذلك فقط
  يعود إلى المزوّد الافتراضي المكوّن مع تحذير إهمال.
  إذا لم يعد ذلك المزوّد يكشف النموذج الافتراضي المكوّن، يعود OpenClaw
  إلى أول مزوّد/نموذج مكوّن بدلا من إظهار
  افتراضي قديم لمزوّد تمت إزالته.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرج المصادقة للعناصر النائبة غير السرية (على سبيل المثال `OPENAI_API_KEY` و`secretref-managed` و`minimax-oauth` و`oauth:chutes` و`ollama-local`) بدلا من إخفائها كأسرار.

### فحص النماذج

يقرأ `models scan` فهرس OpenRouter العام `:free` ويرتب المرشحين
للاستخدام كاحتياطيات. الفهرس نفسه عام، لذلك لا تحتاج الفحوصات التي تقتصر على بيانات التعريف
إلى مفتاح OpenRouter.

يحاول OpenClaw افتراضيا فحص دعم الأدوات والصور عبر استدعاءات نموذج حية.
إذا لم يكن هناك مفتاح OpenRouter مكوّن، يعود الأمر إلى مخرج بيانات تعريف فقط
ويوضح أن نماذج `:free` لا تزال تتطلب `OPENROUTER_API_KEY` من أجل
الفحوصات والاستدلال.

الخيارات:

- `--no-probe` (بيانات تعريف فقط؛ بلا بحث في التكوين/الأسرار)
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

يتطلب `--set-default` و`--set-image` فحوصات حية؛ نتائج الفحص
التي تقتصر على بيانات التعريف معلوماتية ولا تطبق على التكوين.

### حالة النماذج

الخيارات:

- `--json`
- `--plain`
- `--check` (exit 1=expired/missing, 2=expiring)
- `--probe` (فحص حي لملفات تعريف المصادقة المكوّنة)
- `--probe-provider <name>` (فحص مزوّد واحد)
- `--probe-profile <id>` (معرفات ملفات تعريف مكررة أو مفصولة بفواصل)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (معرف الوكيل المكوّن؛ يتجاوز `OPENCLAW_AGENT_DIR`)

يحافظ `--json` على stdout مخصصا لحمولة JSON. يتم توجيه تشخيصات ملف تعريف المصادقة والمزوّد
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

حالات تفاصيل الفحص/رمز السبب المتوقعة:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزن، لكن `auth.order.<provider>`
  الصريح حذفه، لذلك يبلغ الفحص عن الاستبعاد بدلا من
  تجربته.
- `missing_credential` و`invalid_expires` و`expired` و`unresolved_ref`:
  ملف التعريف موجود لكنه غير مؤهل/غير قابل للحل.
- `no_model`: توجد مصادقة المزوّد، لكن OpenClaw لم يستطع حل
  مرشح نموذج قابل للفحص لذلك المزوّد.

## الأسماء المستعارة + الاحتياطيات

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## ملفات تعريف المصادقة

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` هو مساعد المصادقة التفاعلي. يمكنه تشغيل تدفق مصادقة مزوّد
(OAuth/API key) أو إرشادك إلى لصق الرمز يدويا، حسب
المزوّد الذي تختاره.

يسرد `models auth list` ملفات تعريف المصادقة المحفوظة للوكيل المحدد من دون
طباعة الرمز أو API-key أو مادة سر OAuth. استخدم `--provider <id>`
للتصفية إلى مزوّد واحد، مثل `openai`، و`--json` للبرمجة النصية.

يشغل `models auth login` تدفق مصادقة Plugin المزوّد (OAuth/API key). استخدم
`openclaw plugins list` لمعرفة المزوّدين المثبتين.
استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى
مخزن وكيل مكوّن محدد. يتم احترام علم الأصل `--agent` بواسطة
`add` و`list` و`login` و`paste-api-key` و`setup-token` و`paste-token` و
`login-github-copilot`.

بالنسبة إلى نماذج OpenAI، يكون `--provider openai` افتراضيا تسجيل دخول حساب ChatGPT/Codex.
استخدم `--method api-key` فقط عندما تريد إضافة ملف تعريف API-key لـ OpenAI،
عادة كنسخة احتياطية لحدود اشتراك Codex. شغل `openclaw doctor --fix`
لترحيل حالة المصادقة/ملف التعريف القديمة ذات بادئة OpenAI Codex إلى `openai`.

أمثلة:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

ملاحظات:

- يقبل `login` الخيار `--profile-id <id>` للمزوّدين الذين يدعمون ملفات تعريف
  مسماة أثناء تسجيل الدخول. استخدم هذا لإبقاء عمليات تسجيل الدخول المتعددة للمزوّد
  نفسه منفصلة.
- يقبل `paste-api-key` مفاتيح API المنشأة في مكان آخر، ويطلب قيمة المفتاح،
  ويكتبها إلى معرف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`. في الأتمتة، مرر المفتاح عبر stdin، على سبيل المثال
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- يظل `setup-token` و`paste-token` أوامر رموز عامة للمزوّدين
  الذين يكشفون طرق مصادقة بالرموز.
- يتطلب `setup-token` واجهة TTY تفاعلية ويشغل طريقة مصادقة الرموز الخاصة بالمزوّد
  (مع الافتراض إلى طريقة `setup-token` الخاصة بذلك المزوّد عندما يكشف
  واحدة).
- يقبل `paste-token` سلسلة رمز منشأة في مكان آخر أو من الأتمتة.
- يتطلب `paste-token` الخيار `--provider`، ويطلب قيمة الرمز افتراضيا،
  ويكتبها إلى معرف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر
  `--profile-id`.
- في الأتمتة، مرر الرمز عبر stdin بدلا من تمريره كوسيط حتى
  لا تظهر بيانات اعتماد المزوّد في سجل shell أو قوائم العمليات.
- يخزن `paste-token --expires-in <duration>` انتهاء صلاحية مطلقا للرمز من
  مدة نسبية مثل `365d` أو `12h`.
- بالنسبة إلى `openai`، تختلف مفاتيح API الخاصة بـ OpenAI ومادة رمز ChatGPT/OAuth
  كأشكال مصادقة. استخدم `paste-api-key` لمفاتيح API الخاصة بـ OpenAI بصيغة `sk-...`
  و`paste-token` فقط لمادة مصادقة الرموز.
- ملاحظة Anthropic: أخبرنا موظفو Anthropic أن استخدام Claude CLI بنمط OpenClaw مسموح به مرة أخرى، لذلك يتعامل OpenClaw مع إعادة استخدام Claude CLI واستخدام `claude -p` على أنهما معتمدان لهذا التكامل ما لم تنشر Anthropic سياسة جديدة.
- يظل Anthropic `setup-token` / `paste-token` متاحين كمسار رموز OpenClaw مدعوم، لكن OpenClaw يفضل الآن إعادة استخدام Claude CLI و`claude -p` عند توفرهما.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [تجاوز فشل النموذج](/ar/concepts/model-failover)

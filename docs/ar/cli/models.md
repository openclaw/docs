---
read_when:
    - تريد تغيير النماذج الافتراضية أو عرض حالة مصادقة المزوّد
    - تريد فحص النماذج/المزوّدين المتاحين وتصحيح أخطاء ملفات تعريف المصادقة
summary: مرجع CLI لـ `openclaw models` (الحالة/العرض/التعيين/الفحص، الأسماء المستعارة، البدائل الاحتياطية، المصادقة)
title: النماذج
x-i18n:
    generated_at: "2026-07-16T13:47:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

اكتشاف النماذج وفحصها وتهيئتها (النموذج الافتراضي، والنماذج الاحتياطية، وملفات تعريف المصادقة).

مواضيع ذات صلة:

- المزوّدون + النماذج: [النماذج](/ar/providers/models)
- مفاهيم اختيار النموذج + أمر الشرطة المائلة `/models`: [مفهوم النماذج](/ar/concepts/models)
- إعداد مصادقة المزوّد: [بدء الاستخدام](/ar/start/getting-started)

## الأوامر الشائعة

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

تقبل الأوامر الفرعية `status` و`auth` الخيار `--agent <id>` لاستهداف وكيل مُهيّأ؛ وتستخدم `list` و`scan` و`aliases` و`fallbacks`/`image-fallbacks` دائمًا الوكيل الافتراضي المُهيّأ، بينما ترفض `set`/`set-image` الخيار `--agent` رفضًا صريحًا. عند حذفه، تستخدم الأوامر التي تدعم `--agent` القيمة `OPENCLAW_AGENT_DIR` إذا كانت معيّنة، وإلا فتستخدم الوكيل الافتراضي المُهيّأ.

### الحالة

يعرض `openclaw models status` النموذج الافتراضي والنماذج الاحتياطية بعد حلّها، بالإضافة إلى نظرة عامة على المصادقة. عند توفر لقطات استخدام المزوّد، يتضمن قسم حالة OAuth/مفتاح API نوافذ استخدام المزوّد ولقطات الحصص. مزوّدو نوافذ الاستخدام الحاليون: Anthropic وGitHub Copilot وGemini CLI وOpenAI وMiniMax وXiaomi وz.ai. تأتي مصادقة الاستخدام من خطافات خاصة بالمزوّد عند توفرها؛ وإلا يعود OpenClaw إلى مطابقة بيانات اعتماد OAuth/مفتاح API من ملفات تعريف المصادقة أو متغيرات البيئة أو التهيئة.

في مخرجات `--json`، تمثل `auth.providers` النظرة العامة للمزوّد المراعية لمتغيرات البيئة/التهيئة/المخزن، بينما تمثل `auth.oauth` سلامة ملفات تعريف مخزن المصادقة فقط.

الخيارات:

| العلامة                      | التأثير                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | مخرجات JSON؛ تُرسل تشخيصات ملف تعريف المصادقة والمزوّد وبدء التشغيل إلى stderr كي تظل stdout قابلة للتمرير عبر الأنابيب إلى `jq`. |
| `--plain`                 | مخرجات نصية عادية.                                                                                            |
| `--check`                 | الخروج برمز غير صفري إذا كانت المصادقة على وشك الانتهاء/منتهية: `1` = منتهية/مفقودة، و`2` = على وشك الانتهاء.                             |
| `--probe`                 | فحص مباشر لملفات تعريف المصادقة المُهيّأة. طلبات حقيقية؛ قد تستهلك الرموز وتؤدي إلى تفعيل حدود المعدل.            |
| `--probe-provider <name>` | فحص مزوّد واحد فقط.                                                                                      |
| `--probe-profile <id>`    | فحص معرّفات محددة لملفات تعريف المصادقة (بالتكرار أو مفصولة بفواصل).                                                  |
| `--probe-timeout <ms>`    | المهلة الزمنية لكل فحص.                                                                                            |
| `--probe-concurrency <n>` | الفحوصات المتزامنة.                                                                                            |
| `--probe-max-tokens <n>`  | الحد الأقصى لرموز الفحص (حسب أفضل جهد).                                                                               |
| `--agent <id>`            | معرّف الوكيل المُهيّأ؛ يتجاوز `OPENCLAW_AGENT_DIR`.                                                          |

يمكن أن تأتي صفوف الفحص من ملفات تعريف المصادقة أو بيانات اعتماد متغيرات البيئة أو `models.json`. فئات حالة الفحص: `ok` و`auth` و`rate_limit` و`billing` و`timeout` و`format` و`unknown` و`no_model`.

رموز تفاصيل/أسباب الفحص المتوقعة عندما لا يصل الفحص مطلقًا إلى استدعاء نموذج:

- `excluded_by_auth_order`: يوجد ملف تعريف مخزّن، لكن `auth.order.<provider>` الصريح أغفله، لذا يُبلغ الفحص عن الاستبعاد بدلًا من تجربته.
- `missing_credential` و`invalid_expires` و`expired` و`unresolved_ref`: ملف التعريف موجود لكنه غير مؤهل أو يتعذر حلّه.
- `ineligible_profile`: ملف التعريف غير متوافق مع تهيئة المزوّد لسبب آخر.
- `no_model`: توجد مصادقة للمزوّد، لكن OpenClaw لم يتمكن من حل مرشح نموذج قابل للفحص لذلك المزوّد.

لاستكشاف مشكلات OAuth في OpenAI ChatGPT/Codex وإصلاحها، تُعد `openclaw models status` و`openclaw models auth list --provider openai` و`openclaw config get agents.defaults.model --json` أسرع طريقة للتأكد مما إذا كان لدى الوكيل ملف تعريف OAuth صالح للاستخدام من النوع `openai` لـ `openai/*` عبر وقت تشغيل Codex الأصلي. راجع [إعداد مزوّد OpenAI](/ar/providers/openai#check-and-recover-codex-oauth-routing).

### القائمة

الأمر `openclaw models list` للقراءة فقط: يقرأ التهيئة وملفات تعريف المصادقة وحالة الكتالوج الحالية وصفوف الكتالوج المملوكة للمزوّد، لكنه لا يعيد أبدًا كتابة `models.json`.

الخيارات: `--all` (الكتالوج الكامل)، و`--local` (التصفية إلى النماذج المحلية)، و`--provider <id>`، و`--json`، و`--plain`.

ملاحظات:

- عمود `Auth` للقراءة فقط. بالنسبة إلى مسارات النماذج المملوكة للمزوّد مثل OpenAI، فإنه يطابق مسار API/عنوان URL الأساسي لكل صف مع ملفات التعريف المؤهلة في `auth.order` الفعّال، وبيانات اعتماد البيئة/التهيئة، وSecretRefs التي تم حلّها ضمن نطاق الأمر. يظل صف OpenAI المحدد مجهولًا عندما تكون سياسة مساره غير متاحة بدلًا من استعارة مصادقة على مستوى المزوّد؛ وتحتفظ عمليات التحقق القديمة الخاصة بالمزوّد فقط والمزوّدون الآخرون بالسلوك على مستوى المزوّد. بيانات المصادقة الاصطناعية الوصفية للـ Plugin ليست سوى تلميح إلى إمكانات وقت التشغيل، وليست دليلًا على مصادقة حساب أصلية، لذلك تظل المسارات المعتمدة على الحساب مجهولة دون دليل إيجابي من السجل. لا يحمّل الأمر وقت تشغيل المزوّد، ولا يقرأ أسرار سلسلة المفاتيح، ولا يستدعي واجهات API للمزوّد، ولا يثبت الجاهزية الدقيقة للتنفيذ.
- يمكن أن يتضمن `models list --all --provider <id>` صفوف كتالوج ثابتة مملوكة للمزوّد من بيانات تعريف Plugin أو بيانات كتالوج المزوّد المضمّنة حتى إن لم تكن قد صادقت مع ذلك المزوّد بعد. وتظل هذه الصفوف ظاهرة على أنها غير متاحة حتى تُهيّأ مصادقة مطابقة.
- يحافظ `models list` على استجابة مستوى التحكم أثناء بطء اكتشاف كتالوج المزوّد. تعود العروض الافتراضية والمُهيّأة إلى صفوف النماذج المُهيّأة أو الاصطناعية بعد انتظار قصير، وتسمح للاكتشاف بالاكتمال في الخلفية. استخدم `--all` عندما تحتاج إلى الكتالوج الكامل المكتشف بدقة وتكون مستعدًا لانتظار اكتشاف المزوّد.
- يدمج `models list --all` واسع النطاق صفوف كتالوج البيان فوق صفوف السجل دون تحميل خطافات تكميلية لوقت تشغيل المزوّد. تستخدم المسارات السريعة للبيانات المفلترة حسب المزوّد فقط المزوّدين المعلّمين بـ `static`؛ ويظل المزوّدون المعلّمون بـ `refreshable` معتمدين على السجل/ذاكرة التخزين المؤقت ويضيفون صفوف البيان كمكمّلات، بينما يظل المزوّدون المعلّمون بـ `runtime` على اكتشاف السجل/وقت التشغيل.
- يبقي `models list` بيانات النموذج الوصفية الأصلية وحدود وقت التشغيل منفصلة. في مخرجات الجدول، يعرض `Ctx` القيمة `contextTokens/contextWindow` عندما يختلف حد وقت التشغيل الفعّال عن نافذة السياق الأصلية؛ وتتضمن صفوف JSON القيمة `contextTokens` عندما يكشف المزوّد ذلك الحد.
- بالنسبة إلى المسارات المملوكة للمزوّد، يعرض `models list` صفًا منطقيًا واحدًا للمزوّد/النموذج على المسار المحدد. تأتي `Input` و`Ctx` فقط من صف كتالوج مطابق تمامًا للمسار الفعلي، مع تطبيق التجاوزات المنطقية الصريحة المُهيّأة أخيرًا؛ ويعرض اختيار المسار غير المحلول حقول إمكانات مجهولة بدلًا من استعارة بيانات وصفية من مسار شقيق.
- يُجري `models list --provider <id>` التصفية حسب معرّف المزوّد، مثل `moonshot` أو `openai`. ولا يقبل تسميات العرض من أدوات اختيار المزوّد التفاعلية، مثل `Moonshot AI`.
- تُحلّل مراجع النماذج بالتقسيم عند **أول** `/`. إذا كان معرّف النموذج يتضمن `/` (بأسلوب OpenRouter)، فأدرج بادئة المزوّد (مثال: `openrouter/moonshotai/kimi-k2`).
- إذا حذفت المزوّد، يحل OpenClaw الإدخال أولًا بوصفه اسمًا مستعارًا، ثم بوصفه تطابقًا فريدًا لمزوّد مُهيّأ مع معرّف النموذج المطابق تمامًا، وعندها فقط يعود إلى المزوّد الافتراضي المُهيّأ مع تحذير بالإهمال. إذا لم يعد ذلك المزوّد يعرض النموذج الافتراضي المُهيّأ، يعود OpenClaw إلى أول مزوّد/نموذج مُهيّأ بدلًا من إظهار إعداد افتراضي قديم لمزوّد أُزيل.
- قد يعرض `models status` القيمة `marker(<value>)` في مخرجات المصادقة للعناصر النائبة غير السرية (مثل `OPENAI_API_KEY` و`secretref-managed` و`minimax-oauth` و`oauth:chutes` و`ollama-local`) بدلًا من إخفائها كما لو كانت أسرارًا.

### تعيين النموذج الافتراضي / نموذج الصور

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

يكتب `set` إلى `agents.defaults.model.primary`؛ ويكتب `set-image` إلى `agents.defaults.imageModel.primary`. يقبل كلاهما `provider/model` أو اسمًا مستعارًا مُهيّأ. كما يصلح `set` عمليات تثبيت Plugin وقت تشغيل Codex/Copilot عندما يحتاج النموذج المحدد حديثًا إلى أحدها؛ بينما لا يفعل `set-image` ذلك. لا يقبل أي من الأمرين `--agent`؛ إذ يكتبان دائمًا الإعدادات الافتراضية للوكيل.

### الفحص

يقرأ `models scan` كتالوج OpenRouter العام `:free` ويرتّب المرشحين للاستخدام كنماذج احتياطية. الكتالوج نفسه عام، لذلك لا تحتاج عمليات فحص البيانات الوصفية فقط إلى مفتاح OpenRouter.

يحاول OpenClaw افتراضيًا فحص دعم الأدوات والصور عبر استدعاءات مباشرة للنماذج. إذا لم يكن هناك مفتاح OpenRouter مُهيّأ، يعود الأمر إلى مخرجات البيانات الوصفية فقط ويوضح أن نماذج `:free` لا تزال تتطلب `OPENROUTER_API_KEY` لإجراء الفحوصات والاستدلال.

الخيارات:

- `--no-probe` (بيانات وصفية فقط؛ دون البحث في التهيئة/الأسرار)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (المهلة الزمنية لطلب الكتالوج ولكل فحص)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

يتطلب `--set-default` و`--set-image` فحوصات مباشرة؛ وتكون نتائج فحص البيانات الوصفية فقط معلوماتية ولا تُطبّق على التهيئة.

## الأسماء المستعارة

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

تُخزّن الأسماء المستعارة لكل إدخال نموذج في `agents.defaults.models.<key>.alias`. يحل `add` القيمة `<model-or-alias>` إلى مفتاح مزوّد/نموذج قياسي أولًا، لذا فإن منح اسم مستعار لاسم مستعار يعيد توجيهه بدلًا من إنشاء سلسلة.

## النماذج الاحتياطية

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

يدير `agents.defaults.model.fallbacks`. يدير `openclaw models image-fallbacks list|add|remove|clear` قائمة `agents.defaults.imageModel.fallbacks` الموازية بالشكل نفسه للأوامر الفرعية.

## ملفات تعريف المصادقة

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

يمثل `models auth add` مساعد المصادقة التفاعلي. ويمكنه تشغيل تدفق مصادقة للمزوّد (OAuth/مفتاح API) أو إرشادك إلى لصق الرمز يدويًا، حسب المزوّد الذي تختاره.

`models auth list` يسرد ملفات تعريف المصادقة المحفوظة للوكيل المحدد دون طباعة أي مواد سرية للرمز المميز أو مفتاح API أو OAuth. استخدم `--provider <id>` للتصفية حسب مزود واحد، مثل `openai`، و`--json` للبرمجة النصية.

يشغّل `models auth login` تدفق المصادقة الخاص بـ Plugin المزود (OAuth/مفتاح API). استخدم `openclaw plugins list` لمعرفة المزودين المثبتين. يقبل `login` الخيار `--profile-id <id>` للمزودين الذين يدعمون ملفات التعريف المسماة أثناء تسجيل الدخول (استخدمه لإبقاء عمليات تسجيل الدخول المتعددة إلى المزود نفسه منفصلة)، و`--method <id>` لاختيار طريقة مصادقة محددة، و`--device-code` كاختصار لـ `--method device-code`، و`--set-default` لتطبيق النموذج الافتراضي الذي يوصي به المزود، و`--force` لإزالة ملفات التعريف الحالية لذلك المزود أولًا (استخدمه عندما يكون ملف تعريف OAuth المخزن مؤقتًا عالقًا أو عند الرغبة في تبديل الحسابات).

يمثل `models auth login-github-copilot` اختصارًا لـ `models auth login --provider github-copilot --method device` (تدفق جهاز GitHub)؛ ويقبل `--yes` للكتابة فوق ملف تعريف حالي دون مطالبة.

استخدم `openclaw models auth --agent <id> <subcommand>` لكتابة نتائج المصادقة إلى مخزن وكيل مكوّن محدد. تراعي الأوامر `add` و`list` و`login` و`paste-api-key` و`setup-token` و`paste-token` و`login-github-copilot` و`order get`/`set`/`clear` علامة الأمر الأب `--agent`.

بالنسبة إلى نماذج OpenAI، يستخدم `--provider openai` تسجيل الدخول إلى حساب ChatGPT/Codex افتراضيًا. لا تستخدم `--method api-key` إلا عند الرغبة في إضافة ملف تعريف لمفتاح OpenAI API، وعادةً ما يكون نسخة احتياطية لحدود اشتراك Codex. شغّل `openclaw doctor --fix` لترحيل حالة المصادقة/ملف التعريف القديمة التي تستخدم بادئة OpenAI Codex إلى `openai`.

أمثلة:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

ملاحظات:

- يقبل `paste-api-key` مفاتيح API المنشأة في مكان آخر، ويطالب بإدخال قيمة المفتاح، ويكتبها إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر `--profile-id`. في الأتمتة، مرّر المفتاح عبر الإدخال القياسي، على سبيل المثال `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- يظل `setup-token` و`paste-token` أمرين عامين للرموز المميزة للمزودين الذين يوفّرون طرق مصادقة بالرموز المميزة.
- يتطلب `setup-token` طرفية TTY تفاعلية ويشغّل طريقة مصادقة المزود بالرمز المميز (مع استخدام طريقة `setup-token` لذلك المزود افتراضيًا عندما يوفّرها).
- يتطلب `paste-token` الخيار `--provider`، ويطالب بإدخال قيمة الرمز المميز افتراضيًا، ويكتبها إلى معرّف ملف التعريف الافتراضي `<provider>:manual` ما لم تمرر `--profile-id`. في الأتمتة، مرّر الرمز المميز عبر الإدخال القياسي بدلًا من تمريره كوسيط، كي لا تظهر بيانات اعتماد المزود في سجل الصدفة أو قوائم العمليات.
- يخزّن `paste-token --expires-in <duration>` وقت انتهاء صلاحية مطلقًا للرمز المميز محسوبًا من مدة نسبية مثل `365d` أو `12h`.
- بالنسبة إلى `openai`، تختلف بنية مصادقة مفاتيح OpenAI API عن بنية مواد رموز ChatGPT/OAuth المميزة. استخدم `paste-api-key` لمفاتيح OpenAI API الخاصة بـ `sk-...`، ولا تستخدم `paste-token` إلا لمواد المصادقة بالرموز المميزة.
- Anthropic: يُدعم `setup-token`/`paste-token` كمساري مصادقة في OpenClaw لـ `anthropic`، لكن OpenClaw يفضّل إعادة استخدام Claude CLI ‏(`claude -p`) على المضيف عند توفره.
- يدير `auth order get/set/clear` تجاوزًا لترتيب ملفات تعريف المصادقة خاصًا بكل وكيل لمزود واحد، ويُخزّن في `auth-state.json` (بشكل منفصل عن مفتاح الإعداد `auth.order.<provider>`). يأخذ `set` معرّف ملف تعريف واحدًا أو أكثر وفق ترتيب الأولوية؛ بينما يعود `clear` إلى ترتيب الإعداد/التناوب الدوري.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [اختيار النموذج](/ar/concepts/model-providers)
- [التبديل الاحتياطي للنموذج](/ar/concepts/model-failover)
